import { NextResponse } from "next/server";
import { getTokenFromCookie } from "../../../utils/getTokenFromCookie";

/**
 * GET /api/user/subscription/[subscriptionId]
 *
 * Fetches a specific subscription's details from CRM.
 * Uses wp_user_id from cookies.
 *
 * Expected Response:
 * {
 *   "success": true,
 *   "data": {
 *     "status": true,
 *     "message": "Subscription details fetched successfully.",
 *     "data": {
 *       "subscription": { ... }
 *     }
 *   }
 * }
 */
export async function GET(request, { params }) {
  try {
    const { subscriptionId } = await params;

    if (!subscriptionId) {
      return NextResponse.json(
        {
          success: false,
          error: "Missing subscription ID in route",
        },
        { status: 400 }
      );
    }

    const cookieHeader = request.headers.get("cookie") || "";
    let wpUserID = null;

    if (cookieHeader) {
      const match = cookieHeader.match(/wp_user_id=([^;]+)/);
      if (match) {
        wpUserID = decodeURIComponent(match[1].trim());
      }
    }

    console.log(
      `[SUBSCRIPTION_DETAILS] Cookie header: ${cookieHeader.substring(0, 100)}...`
    );
    console.log(
      `[SUBSCRIPTION_DETAILS] Extracted wp_user_id: ${wpUserID || "not found"}`
    );
    console.log(
      `[SUBSCRIPTION_DETAILS] Subscription ID: ${subscriptionId}`
    );

    if (!wpUserID) {
      return NextResponse.json(
        {
          success: false,
          error: "User not authenticated",
          message: "wp_user_id not found in cookies",
        },
        { status: 401 }
      );
    }

    console.log(
      `[SUBSCRIPTION_DETAILS] Fetching subscription details for subscription: ${subscriptionId}`
    );

    const subscriptionData = await fetchSubscriptionDetails(
      wpUserID,
      subscriptionId,
      request
    );

    return NextResponse.json({
      success: true,
      data: subscriptionData,
    });
  } catch (error) {
    console.error("[SUBSCRIPTION_DETAILS] Error:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Failed to fetch subscription details",
        details: error.message,
      },
      { status: 500 }
    );
  }
}

/**
 * Fetch subscription details from CRM API
 * Uses the subscription endpoint: /api/user/subscription/{subscriptionId}
 * @param {string} wpUserID - WordPress user ID
 * @param {string} subscriptionId - Subscription ID
 * @param {Request} request - The request object to get token from cookie
 */
async function fetchSubscriptionDetails(wpUserID, subscriptionId, request) {
  const crmHost = process.env.CRM_HOST;

  if (!crmHost) {
    console.error("[SUBSCRIPTION_DETAILS] Missing CRM_HOST");
    return {
      status: false,
      message: "CRM configuration missing",
      data: {
        subscription: null,
      },
    };
  }

  console.log(`[SUBSCRIPTION_DETAILS] CRM Host: ${crmHost}`);

  try {
    const authToken = getTokenFromCookie(request);
    
    if (!authToken) {
      console.error("[SUBSCRIPTION_DETAILS] No token found in cookie");
      return {
        status: false,
        message: "Authentication token not found",
        data: {
          subscription: null,
        },
      };
    }

    console.log("[SUBSCRIPTION_DETAILS] Using token from cookie");

    const subscriptionUrl = `${crmHost}/api/user/subscription/${subscriptionId}`;
    console.log(
      `[SUBSCRIPTION_DETAILS] Fetching subscription from: ${subscriptionUrl}`
    );

    const subscriptionResponse = await fetch(subscriptionUrl, {
      method: "GET",
      headers: {
        Authorization: `Bearer ${authToken}`,
        "is-patient-portal": "true",
      },
    });

    if (!subscriptionResponse.ok) {
      const errorText = await subscriptionResponse.text();
      console.error(
        `[SUBSCRIPTION_DETAILS] Failed to fetch subscription: ${subscriptionResponse.status} ${subscriptionResponse.statusText}`
      );
      console.error(`[SUBSCRIPTION_DETAILS] Error details: ${errorText}`);
      return {
        status: false,
        message: `Failed to fetch: ${subscriptionResponse.status} ${subscriptionResponse.statusText}`,
        data: {
          subscription: null,
        },
      };
    }

    const responseData = await subscriptionResponse.json();
    console.log("[SUBSCRIPTION_DETAILS] CRM response received");
    console.log(
      "[SUBSCRIPTION_DETAILS] Full CRM response:",
      JSON.stringify(responseData, null, 2)
    );

    let subscriptionData = null;
    if (responseData.subscriptions && Array.isArray(responseData.subscriptions) && responseData.subscriptions.length > 0) {
      subscriptionData = responseData.subscriptions[0];
    } else if (responseData.data?.subscriptions && Array.isArray(responseData.data.subscriptions) && responseData.data.subscriptions.length > 0) {
      subscriptionData = responseData.data.subscriptions[0];
    } else if (responseData.data?.subscription) {
      subscriptionData = responseData.data.subscription;
    } else if (responseData.subscription) {
      subscriptionData = responseData.subscription;
    }

    console.log(
      `[SUBSCRIPTION_DETAILS] ✓ Successfully fetched subscription details for subscription ${subscriptionId}`
    );
    
    return {
      status: responseData.status || true,
      message: responseData.message || "Subscription details retrieved successfully.",
      subscription: subscriptionData,
    };
  } catch (error) {
    console.error(
      "[SUBSCRIPTION_DETAILS] Error fetching subscription details in CRM:",
      error
    );
    return {
      status: false,
      message: error.message || "Failed to fetch subscription details",
      data: {
        subscription: null,
      },
    };
  }
}

