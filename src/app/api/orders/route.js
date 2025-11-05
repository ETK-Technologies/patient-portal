import { NextResponse } from "next/server";

/**
 * GET /api/orders
 *
 * Fetches orders from CRM API for the authenticated user.
 * Uses the auth token from login session.
 *
 * Query Parameters:
 * - per_page: Number of orders per page (default: 10)
 * - order_type: Type of order (default: subscription)
 *
 * Expected Response:
 * {
 *   "success": true,
 *   "orders": [...]
 * }
 */
export async function GET(request) {
  try {
    // Get auth token from cookies (set during login)
    const cookieHeader = request.headers.get("cookie") || "";
    let authToken = null;

    if (cookieHeader) {
      // Parse authToken from cookie
      const match = cookieHeader.match(/authToken=([^;]+)/);
      if (match) {
        authToken = decodeURIComponent(match[1].trim());
      }
    }

    console.log(`[ORDERS] Auth token present: ${authToken ? "Yes" : "No"}`);

    if (!authToken) {
      return NextResponse.json(
        {
          success: false,
          error: "User not authenticated",
        },
        { status: 401 }
      );
    }

    // Get query parameters
    const { searchParams } = new URL(request.url);
    const perPage = searchParams.get("per_page") || "10";
    const orderType = searchParams.get("order_type") || "subscription";

    console.log(`[ORDERS] Fetching orders - Per page: ${perPage}, Order type: ${orderType}`);

    // Fetch orders from CRM
    const ordersData = await fetchOrders(authToken, perPage, orderType);

    return NextResponse.json({
      success: true,
      orders: ordersData,
    });
  } catch (error) {
    console.error("[ORDERS] Error fetching orders:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Failed to fetch orders",
        details: error.message,
      },
      { status: 500 }
    );
  }
}

/**
 * Fetch orders from CRM API
 * Uses the endpoint: /api/crm-orders/list
 * @param {string} authToken - User's authentication token from login
 * @param {string} perPage - Number of orders per page
 * @param {string} orderType - Type of order (subscription, etc.)
 * @returns {Promise<Array>} Array of order objects
 */
async function fetchOrders(authToken, perPage, orderType) {
  const crmHost = process.env.CRM_HOST;

  if (!crmHost) {
    console.error("[ORDERS] Missing CRM_HOST environment variable");
    return [];
  }

  try {
    const ordersUrl = `${crmHost}/api/crm-orders/list?per_page=${perPage}&order_type=${orderType}`;
    console.log(`[ORDERS] Fetching orders from: ${ordersUrl}`);

    const ordersResponse = await fetch(ordersUrl, {
      method: "GET",
      headers: {
        Authorization: `Bearer ${authToken}`,
        "Content-Type": "application/json",
      },
    });

    console.log(`[ORDERS] CRM response status: ${ordersResponse.status}`);

    if (!ordersResponse.ok) {
      const errorText = await ordersResponse.text();
      console.error(`[ORDERS] Failed to fetch orders: ${errorText}`);

      let errorDetails;
      try {
        errorDetails = JSON.parse(errorText);
      } catch {
        errorDetails = errorText;
      }

      // If unauthorized, return empty array
      if (ordersResponse.status === 401) {
        console.error("[ORDERS] Unauthorized - token may be invalid");
        return [];
      }

      return [];
    }

    const responseData = await ordersResponse.json();
    console.log("[ORDERS] CRM response received");
    console.log("[ORDERS] Response status:", responseData.status);

    // Extract orders from the CRM response structure
    // CRM returns: { status: true, message: "...", data: { orders: { current_page: 1, data: [...] } } }
    if (responseData.status && responseData.data?.orders?.data) {
      const orders = responseData.data.orders.data;
      console.log(`[ORDERS] ✓ Extracted ${orders.length} orders from CRM response`);
      return orders;
    }

    // Fallback: check alternative response structure
    if (responseData.data?.data && Array.isArray(responseData.data.data)) {
      console.log(`[ORDERS] ✓ Extracted ${responseData.data.data.length} orders (alternative structure)`);
      return responseData.data.data;
    }

    // Fallback: return empty array if structure is different
    console.error("[ORDERS] ✗ Unexpected response structure");
    console.error("[ORDERS] Response keys:", Object.keys(responseData));

    return [];
  } catch (error) {
    console.error("[ORDERS] Error fetching orders from CRM:", error);
    return [];
  }
}

