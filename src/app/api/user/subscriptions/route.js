import { NextResponse } from "next/server";
import { getTokenFromCookie } from "../../utils/getTokenFromCookie";

/**
 * GET /api/user/subscriptions
 *
 * Fetches user subscriptions data from CRM.
 * Uses wp_user_id from cookies.
 *
 * Expected Response:
 * {
 *   "success": true,
 *   "data": {
 *     "status": true,
 *     "message": "Subscription data fetched successfully.",
 *     "data": {
 *       "subscriptions": [...]
 *     }
 *   }
 * }
 */
export async function GET(request) {
  try {
    const cookieHeader = request.headers.get("cookie") || "";
    let wpUserID = null;

    if (cookieHeader) {
      const match = cookieHeader.match(/wp_user_id=([^;]+)/);
      if (match) {
        wpUserID = decodeURIComponent(match[1].trim());
      }
    }

    console.log(
      `[SUBSCRIPTIONS] Cookie header: ${cookieHeader.substring(0, 100)}...`
    );
    console.log(`[SUBSCRIPTIONS] Extracted wp_user_id: ${wpUserID || "not found"}`);

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

    console.log(`[SUBSCRIPTIONS] Using wp_user_id from cookies: ${wpUserID}`);

    // Fetch subscriptions from CRM
    const subscriptionsData = await fetchSubscriptions(wpUserID, request);

    return NextResponse.json({
      success: true,
      data: subscriptionsData,
    });
  } catch (error) {
    console.error("Error fetching subscriptions:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Failed to fetch subscriptions",
        details: error.message,
      },
      { status: 500 }
    );
  }
}

/**
 * Fetch subscriptions from CRM API
 * Uses the subscriptions endpoint: /api/user/subscriptions/{wpUserID}
 */
async function fetchSubscriptions(wpUserID, request) {
  const crmHost = process.env.CRM_HOST;

  if (!crmHost) {
    console.error("[SUBSCRIPTIONS] Missing CRM_HOST");
    return {
      status: false,
      message: "CRM configuration missing",
      data: {
        subscriptions: [],
      },
    };
  }

  console.log(`[SUBSCRIPTIONS] CRM Host: ${crmHost}`);

  try {
    const authToken = getTokenFromCookie(request);
    
    if (!authToken) {
      console.error("[SUBSCRIPTIONS] No token found in cookie");
      return {
        status: false,
        message: "Authentication token not found",
        data: {
          subscriptions: [],
        },
      };
    }

    console.log("[SUBSCRIPTIONS] Using token from cookie");

    // Step 2: Fetch subscriptions from CRM
    // Endpoint: /api/user/subscriptions/{wpUserID}
    const subscriptionsUrl = `${crmHost}/api/user/subscriptions/${wpUserID}`;
    console.log(
      `[SUBSCRIPTIONS] Fetching subscriptions from: ${subscriptionsUrl}`
    );

    const subscriptionsResponse = await fetch(subscriptionsUrl, {
      method: "GET",
      headers: {
        Authorization: `Bearer ${authToken}`,
        "is-patient-portal": "true",
      },
    });

    if (!subscriptionsResponse.ok) {
      const errorText = await subscriptionsResponse.text();
      console.error(
        `[SUBSCRIPTIONS] Failed to fetch subscriptions: ${subscriptionsResponse.status} ${subscriptionsResponse.statusText}`
      );
      console.error(`[SUBSCRIPTIONS] Error details: ${errorText}`);
      return {
        status: false,
        message: `Failed to fetch: ${subscriptionsResponse.status} ${subscriptionsResponse.statusText}`,
        data: {
          subscriptions: [],
        },
      };
    }

    const responseData = await subscriptionsResponse.json();
    console.log("[SUBSCRIPTIONS] CRM response received");
    console.log(
      "[SUBSCRIPTIONS] Full CRM response:",
      JSON.stringify(responseData, null, 2)
    );

    console.log(
      `[SUBSCRIPTIONS] ✓ Successfully fetched subscriptions for user: ${wpUserID}`
    );
    return responseData;
  } catch (error) {
    console.error(
      "[SUBSCRIPTIONS] Error fetching subscriptions from CRM:",
      error
    );
    return {
      status: false,
      message: error.message || "Failed to fetch subscriptions",
      data: {
        subscriptions: [],
      },
    };
  }
}
