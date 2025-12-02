import { NextResponse } from "next/server";
import { authenticateWithCRM } from "../../../../utils/crmAuth";

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
    const orderData = await fetchOrderManage(orderId);

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
 */
async function fetchOrderManage(orderId) {
  const crmHost = process.env.CRM_HOST;
  const apiUsername = process.env.CRM_API_USERNAME;
  const apiPasswordEncoded = process.env.CRM_API_PASSWORD;

  if (!crmHost || !apiUsername || !apiPasswordEncoded) {
    console.error("[ORDER_MANAGE] Missing CRM credentials:");
    console.error({
      crmHost: crmHost || "MISSING",
      apiUsername: apiUsername ? "SET" : "MISSING",
      apiPasswordEncoded: apiPasswordEncoded ? "SET" : "MISSING",
    });
    return {
      orderId: orderId,
    };
  }

  console.log(`[ORDER_MANAGE] CRM Host: ${crmHost}`);
  console.log(`[ORDER_MANAGE] CRM Username: ${apiUsername}`);

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
        console.log("[ORDER_MANAGE] Password decoded from base64");
      } else {
        apiPassword = apiPasswordEncoded;
        console.log("[ORDER_MANAGE] Using password as plain text");
      }
    } catch (decodeError) {
      // If base64 decode fails, use as plain text
      apiPassword = apiPasswordEncoded;
      console.log(
        "[ORDER_MANAGE] Base64 decode failed, using password as plain text"
      );
    }

    // Step 1: Authenticate with CRM to get auth token
    console.log("[ORDER_MANAGE] Authenticating with CRM...");
    const authResult = await authenticateWithCRM(
      crmHost,
      apiUsername,
      apiPassword
    );

    if (!authResult.success) {
      console.error(
        `[ORDER_MANAGE] CRM authentication failed: ${authResult.error}`
      );
      if (authResult.endpoint) {
        console.error(`[ORDER_MANAGE] Failed endpoint: ${authResult.endpoint}`);
      }
      return {
        orderId: orderId,
      };
    }

    const authToken = authResult.token;
    console.log(
      `[ORDER_MANAGE] Successfully obtained CRM auth token from ${authResult.endpoint}`
    );

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
