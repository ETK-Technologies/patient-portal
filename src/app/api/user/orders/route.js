import { NextResponse } from "next/server";
import { authenticateWithCRM } from "../../utils/crmAuth";

/**
 * GET /api/user/orders
 *
 * Fetches user orders data from CRM.
 * Returns order information from the CRM orders endpoint.
 * wpUserID is obtained from cookies (set during auto-login).
 *
 * Expected Response:
 * {
 *   "success": true,
 *   "orders": [...],
 *   "data": { ... }
 * }
 */
export async function GET(request) {
  try {
    // Get wpUserID from cookies (set during auto-login)
    // Parse cookie header manually for compatibility
    const cookieHeader = request.headers.get("cookie") || "";
    let wpUserID = null;

    if (cookieHeader) {
      // Parse cookies from header string
      const match = cookieHeader.match(/userId=([^;]+)/);
      if (match) {
        wpUserID = decodeURIComponent(match[1].trim());
      }
    }

    console.log(
      `[USER_ORDERS] Cookie header: ${cookieHeader.substring(0, 100)}...`
    );
    console.log(`[USER_ORDERS] Extracted wpUserID: ${wpUserID || "not found"}`);

    if (!wpUserID) {
      return NextResponse.json(
        {
          success: false,
          error: "User not authenticated",
        },
        { status: 401 }
      );
    }

    // Get page parameter from query string
    const { searchParams } = new URL(request.url);
    const page = searchParams.get("page") || "1";
    const pageNumber = parseInt(page, 10) || 1;

    console.log(
      `[USER_ORDERS] Fetching orders for user: ${wpUserID}, page: ${pageNumber}`
    );

    // Fetch orders from CRM
    const ordersData = await fetchOrders(wpUserID, pageNumber);

    return NextResponse.json({
      success: true,
      orders: ordersData.orders || [],
      data: ordersData,
    });
  } catch (error) {
    console.error("Error fetching user orders:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Failed to fetch user orders",
        details: error.message,
      },
      { status: 500 }
    );
  }
}

/**
 * Fetch orders from CRM API
 * Uses the orders endpoint: /api/user/orders/{wpUserID}
 * wpUserID can be found from user context (userData.id) or cookies (userId)
 * @param {string} userId - The WordPress user ID
 * @param {number} page - The page number to fetch (default: 1)
 */
async function fetchOrders(userId, page = 1) {
  const crmHost = process.env.CRM_HOST;
  const apiUsername = process.env.CRM_API_USERNAME;
  const apiPasswordEncoded = process.env.CRM_API_PASSWORD;

  if (!crmHost || !apiUsername || !apiPasswordEncoded) {
    console.error("[USER_ORDERS] Missing CRM credentials:");
    console.error({
      crmHost: crmHost || "MISSING",
      apiUsername: apiUsername ? "SET" : "MISSING",
      apiPasswordEncoded: apiPasswordEncoded ? "SET" : "MISSING",
    });
    return {
      orders: [],
      id: userId,
    };
  }

  console.log(`[USER_ORDERS] CRM Host: ${crmHost}`);
  console.log(`[USER_ORDERS] CRM Username: ${apiUsername}`);

  try {
    // Decode the password - try base64 first, fallback to plain text
    let apiPassword;
    try {
      // Try to decode as base64
      const decoded = Buffer.from(apiPasswordEncoded, "base64").toString(
        "utf8"
      );
      // Check if decoded value is valid and reasonable
      // If the decoded string is the same as input or contains many non-printable chars, use plain text
      const hasNonPrintable = /[\x00-\x08\x0E-\x1F\x7F-\x9F]/.test(decoded);
      const isSameAsInput = decoded === apiPasswordEncoded;

      if (!hasNonPrintable && !isSameAsInput && decoded.length > 0) {
        apiPassword = decoded;
        console.log("[USER_ORDERS] Password decoded from base64");
      } else {
        apiPassword = apiPasswordEncoded;
        console.log("[USER_ORDERS] Using password as plain text");
      }
    } catch (decodeError) {
      // If base64 decode fails, use as plain text
      apiPassword = apiPasswordEncoded;
      console.log(
        "[USER_ORDERS] Base64 decode failed, using password as plain text"
      );
    }

    // Step 1: Authenticate with CRM to get auth token
    console.log("[USER_ORDERS] Authenticating with CRM...");
    const authResult = await authenticateWithCRM(
      crmHost,
      apiUsername,
      apiPassword
    );

    if (!authResult.success) {
      console.error(
        `[USER_ORDERS] CRM authentication failed: ${authResult.error}`
      );
      if (authResult.endpoint) {
        console.error(`[USER_ORDERS] Failed endpoint: ${authResult.endpoint}`);
      }
      return {
        orders: [],
        id: userId,
      };
    }

    const authToken = authResult.token;
    console.log(
      `[USER_ORDERS] Successfully obtained CRM auth token from ${authResult.endpoint}`
    );

    // Step 2: Fetch orders from CRM
    // Uses the orders endpoint: /api/user/orders/{wpUserID}?page={page}
    const ordersUrl = `${crmHost}/api/user/orders/${userId}${
      page > 1 ? `?page=${page}` : ""
    }`;
    console.log(`[USER_ORDERS] Fetching orders from: ${ordersUrl}`);

    const ordersResponse = await fetch(ordersUrl, {
      method: "GET",
      headers: {
        Authorization: `Bearer ${authToken}`,
        "Content-Type": "application/json",
      },
    });

    if (!ordersResponse.ok) {
      const errorText = await ordersResponse.text();
      console.error(
        `[USER_ORDERS] Failed to fetch orders: ${ordersResponse.status} ${ordersResponse.statusText}`
      );
      console.error(`[USER_ORDERS] Error details: ${errorText}`);
      return {
        orders: [],
        id: userId,
      };
    }

    const responseData = await ordersResponse.json();
    console.log("[USER_ORDERS] CRM response received");
    console.log(
      "[USER_ORDERS] Full CRM response:",
      JSON.stringify(responseData, null, 2)
    );
    console.log("[USER_ORDERS] Response status:", responseData.status);
    console.log("[USER_ORDERS] Response keys:", Object.keys(responseData));

    // Log the actual orders data structure
    if (responseData.data) {
      console.log(
        "[USER_ORDERS] Response.data type:",
        Array.isArray(responseData.data) ? "Array" : typeof responseData.data
      );
      console.log(
        "[USER_ORDERS] Response.data:",
        JSON.stringify(responseData.data, null, 2)
      );
      if (responseData.data.orders) {
        console.log(
          "[USER_ORDERS] Response.data.orders:",
          JSON.stringify(responseData.data.orders, null, 2)
        );
      }
    }

    // Extract orders from the CRM response structure
    // CRM might return: { status: true, data: { orders: [...], count: 5 } }
    // or: { status: true, data: [...] } where data is the orders array
    let ordersData = null;

    if (responseData.status && responseData.data) {
      // Check if orders array is directly in data
      if (Array.isArray(responseData.data)) {
        ordersData = {
          orders: responseData.data,
          count: responseData.data.length,
        };
        console.log(
          `[USER_ORDERS] ✓ Found orders array in data: ${ordersData.count} orders`
        );
      }
      // Check if orders array exists in data object
      else if (
        responseData.data.orders &&
        Array.isArray(responseData.data.orders)
      ) {
        ordersData = {
          orders: responseData.data.orders,
          count: responseData.data.orders.length,
          ...responseData.data,
        };
        console.log(
          `[USER_ORDERS] ✓ Found orders in data.orders: ${ordersData.count} orders`
        );
      }
      // If data exists but structure is different
      else {
        console.log("[USER_ORDERS] Response has data but unexpected structure");
        console.log("[USER_ORDERS] Data keys:", Object.keys(responseData.data));
        ordersData = {
          orders: [],
          ...responseData.data,
        };
      }
    }
    // Fallback: if response doesn't have status/data structure
    else if (Array.isArray(responseData)) {
      ordersData = {
        orders: responseData,
        count: responseData.length,
      };
      console.log(
        `[USER_ORDERS] ✓ Response is array, counted: ${ordersData.count} orders`
      );
    }
    // Last fallback: return the response as-is
    else {
      ordersData = {
        orders: [],
        data: responseData,
      };
    }

    if (!ordersData) {
      console.error("[USER_ORDERS] ✗ Failed to extract orders data");
      return {
        orders: [],
        id: userId,
      };
    }

    console.log(
      `[USER_ORDERS] ✓ Successfully fetched orders: ${
        ordersData.count || ordersData.orders?.length || 0
      } orders`
    );
    return ordersData;
  } catch (error) {
    console.error("[USER_ORDERS] Error fetching orders from CRM:", error);
    return {
      orders: [],
      id: userId,
    };
  }
}
