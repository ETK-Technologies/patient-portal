import { NextResponse } from "next/server";
import { getTokenFromCookie } from "../../../../utils/getTokenFromCookie";

/**
 * GET /api/user/orders/manage/[orderId]
 *
 * Fetches order management data from CRM for a specific order.
 * Returns order information from the CRM order manage endpoint.
 * wpUserID is obtained from cookies (set during auto-login).
 * orderId is obtained from the URL parameter (crmOrderID).
 *
 * Expected Response:
 * {
 *   "status": true,
 *   "message": "Order details retrieved successfully.",
 *   "data": {
 *     "order": {
 *       "crm_order_id": 331951,
 *       "wp_order_id": "581405",
 *       "status": "cancelled",
 *       "order_type": "New Subscription",
 *       "transaction_date": "Wednesday, October 08, 2025 (GMT+7)",
 *       "customer_name": "...",
 *       "customer_email": "...",
 *       "customer_phone": "...",
 *       "shipping_address": {...},
 *       "tracking_number": [],
 *       "discount_total": 138,
 *       "shipping_total": 0,
 *       "total": 0,
 *       "coupon": [...],
 *       "line_items": [...]
 *     }
 *   }
 * }
 */
export async function GET(request, { params }) {
  try {
    // Get orderId from URL parameters
    // params is a Promise in Next.js and must be awaited
    const { orderId } = await params;

    if (!orderId) {
      return NextResponse.json(
        {
          status: false,
          message: "Order ID is required",
          error: "Order ID is required",
        },
        { status: 400 }
      );
    }

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
      `[ORDER_MANAGE] Cookie header: ${cookieHeader.substring(0, 100)}...`
    );
    console.log(
      `[ORDER_MANAGE] Extracted wpUserID: ${wpUserID || "not found"}`
    );
    console.log(`[ORDER_MANAGE] Order ID: ${orderId}`);

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

    console.log(
      `[ORDER_MANAGE] Fetching order management data for order: ${orderId}`
    );

    // Fetch order management data from CRM
    const orderData = await fetchOrderManage(orderId, request);

    // Return in the expected format
    // Expected: { status: true, message: "...", data: { order: {...} } }
    return NextResponse.json({
      status: true,
      message: "Order details retrieved successfully.",
      data: {
        order: orderData.order || orderData,
      },
    });
  } catch (error) {
    console.error("Error fetching order management data:", error);
    return NextResponse.json(
      {
        status: false,
        message: "Failed to fetch order management data",
        error: "Failed to fetch order management data",
        details: error.message,
      },
      { status: 500 }
    );
  }
}

/**
 * Fetch order management data from CRM API
 * Uses the order manage endpoint: /api/user/order/manage/{orderId}
 * @param {string} orderId - Order ID
 * @param {Request} request - The request object to get token from cookie
 */
async function fetchOrderManage(orderId, request) {
  const crmHost = process.env.CRM_HOST;

  if (!crmHost) {
    console.error("[ORDER_MANAGE] Missing CRM configuration (CRM_HOST)");
    return {
      orderId: orderId,
    };
  }

  console.log(`[ORDER_MANAGE] CRM Host: ${crmHost}`);

  try {
    const authToken = getTokenFromCookie(request);
    
    if (!authToken) {
      console.error("[ORDER_MANAGE] No token found in cookie");
      return {
        orderId: orderId,
        error: "Authentication token not found",
      };
    }

    console.log("[ORDER_MANAGE] Using token from cookie");

    // Step 2: Fetch order management data from CRM
    // Uses the order manage endpoint: /api/user/order/manage/{orderId}
    const orderManageUrl = `${crmHost}/api/user/order/manage/${orderId}`;
    console.log(
      `[ORDER_MANAGE] Fetching order management data from: ${orderManageUrl}`
    );

    const orderResponse = await fetch(orderManageUrl, {
      method: "GET",
      headers: {
        Authorization: `Bearer ${authToken}`,
        "Content-Type": "application/json",
        "is-patient-portal": "true",
      },
    });

    if (!orderResponse.ok) {
      const errorText = await orderResponse.text();
      console.error(
        `[ORDER_MANAGE] Failed to fetch order management data: ${orderResponse.status} ${orderResponse.statusText}`
      );
      console.error(`[ORDER_MANAGE] Error details: ${errorText}`);
      return {
        orderId: orderId,
        error: `Failed to fetch: ${orderResponse.status} ${orderResponse.statusText}`,
      };
    }

    const responseData = await orderResponse.json();
    console.log("[ORDER_MANAGE] CRM response received");
    console.log(
      "[ORDER_MANAGE] Full CRM response:",
      JSON.stringify(responseData, null, 2)
    );

    // Extract order data from CRM response
    // CRM returns: { status: true, message: "...", data: { order: {...} } }
    let orderData = responseData;

    if (responseData.status && responseData.data && responseData.data.order) {
      // New format: extract the order from nested structure
      orderData = {
        ...responseData.data,
        _fullResponse: responseData,
      };
      console.log(
        `[ORDER_MANAGE] ✓ Extracted order from nested data structure`
      );
    } else if (responseData.data) {
      // Alternative: data exists but might be structured differently
      orderData = {
        ...responseData.data,
        _fullResponse: responseData,
      };
      console.log(`[ORDER_MANAGE] ✓ Using data property from response`);
    }

    console.log(
      `[ORDER_MANAGE] ✓ Successfully fetched order management data for order: ${orderId}`
    );
    return orderData;
  } catch (error) {
    console.error(
      "[ORDER_MANAGE] Error fetching order management data from CRM:",
      error
    );
    return {
      orderId: orderId,
      error: error.message,
    };
  }
}
