import { NextResponse } from "next/server";
import { getTokenFromCookie } from "../../utils/getTokenFromCookie";

/**
 * GET /api/user/orders
 *
 * Fetches user orders data from CRM.
 * Returns order information from the CRM orders endpoint.
 * wpUserID is obtained from cookies (wp_user_id cookie set during auto-login).
 *
 * Expected Response:
 * {
 *   "status": true,
 *   "message": "Order list fetched successfully.",
 *   "data": {
 *     "orders": [
 *       {
 *         "date": "2025-10-08",
 *         "orders": [...]
 *       }
 *     ],
 *     "pagination": {
 *       "current_page": 1,
 *       "per_page": 10,
 *       "total": 58,
 *       "last_page": 6,
 *       "next_page_url": "...",
 *       "prev_page_url": null
 *     }
 *   }
 * }
 */
export async function GET(request) {
  try {
    // Get wpUserID from cookies (set during auto-login)
    // Parse cookie header manually for compatibility
    const cookieHeader = request.headers.get("cookie") || "";
    let wpUserID = null;

    if (cookieHeader) {
      const wpUserIdMatch = cookieHeader.match(/wp_user_id=([^;]+)/);
      if (wpUserIdMatch) {
        wpUserID = decodeURIComponent(wpUserIdMatch[1].trim());
      } else {
        const userIdMatch = cookieHeader.match(/userId=([^;]+)/);
        if (userIdMatch) {
          wpUserID = decodeURIComponent(userIdMatch[1].trim());
        }
      }
    }

    console.log(
      `[USER_ORDERS] Cookie header: ${cookieHeader.substring(0, 100)}...`
    );
    console.log(`[USER_ORDERS] Extracted wpUserID: ${wpUserID || "not found"}`);

    if (!wpUserID) {
      return NextResponse.json(
        {
          status: false,
          message: "User not authenticated",
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
    const ordersData = await fetchOrders(wpUserID, pageNumber, request);

    // Return in the expected format
    // Expected: { status: true, message: "...", data: { orders: [...], pagination: {...} } }
    return NextResponse.json({
      status: true,
      message: "Order list fetched successfully.",
      data: {
        orders: ordersData.orders || [],
        pagination: ordersData.pagination || null,
      },
    });
  } catch (error) {
    console.error("Error fetching user orders:", error);
    return NextResponse.json(
      {
        status: false,
        message: "Failed to fetch user orders",
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
 * wpUserID is obtained from cookies (wp_user_id cookie set during auto-login)
 * @param {string} userId - The WordPress user ID (wp_user_id from cookie)
 * @param {number} page - The page number to fetch (default: 1)
 * @param {Request} request - The request object
 */
async function fetchOrders(userId, page = 1, request) {
  const crmHost = process.env.CRM_HOST;

  if (!crmHost) {
    console.error("[USER_ORDERS] Missing CRM_HOST");
    return {
      orders: [],
      id: userId,
    };
  }

  console.log(`[USER_ORDERS] CRM Host: ${crmHost}`);

  try {
    const authToken = getTokenFromCookie(request);
    
    if (!authToken) {
      console.error("[USER_ORDERS] No token found in cookie");
      return {
        orders: [],
        id: userId,
      };
    }

    console.log("[USER_ORDERS] Using token from cookie");

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
        "is-patient-portal": "true",
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
    // CRM returns: { status: true, message: "...", data: { orders: [...], pagination: {...} } }
    // The orders array contains objects with date and orders properties
    let ordersData = responseData;

    if (responseData.status && responseData.data) {
      // Extract data from nested structure
      ordersData = {
        ...responseData.data,
        // Keep the full response structure for reference
        _fullResponse: responseData,
      };
      console.log(
        `[USER_ORDERS] ✓ Extracted data from CRM response (data property)`
      );
      console.log(
        `[USER_ORDERS] Orders structure:`,
        Array.isArray(ordersData.orders)
          ? `Array with ${ordersData.orders.length} date groups`
          : typeof ordersData.orders
      );
      if (ordersData.pagination) {
        console.log(
          `[USER_ORDERS] Pagination: page ${ordersData.pagination.current_page} of ${ordersData.pagination.last_page} (total: ${ordersData.pagination.total})`
        );
      }
    } else if (responseData.data) {
      ordersData = {
        ...responseData.data,
        _fullResponse: responseData,
      };
      console.log(`[USER_ORDERS] ✓ Using data property from response`);
    }

    console.log(
      `[USER_ORDERS] ✓ Successfully fetched orders for user: ${userId}`
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
