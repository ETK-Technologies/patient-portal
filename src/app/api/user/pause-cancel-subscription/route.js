import { NextResponse } from "next/server";
import { getTokenFromCookie } from "../../utils/getTokenFromCookie";

/**
 * POST /api/user/pause-cancel-subscription
 *
 * Proxies pause/cancel subscription request to CRM.
 * Uses wp_user_id and userId from cookies.
 *
 * Expected Request Body:
 * {
 *   "subscriptionId": "500230",
 *   "wpUserId": "107685",
 *   "crmUserId": "33237",
 *   "answers": { ... }
 * }
 *
 * Expected Response:
 * {
 *   "success": true,
 *   "data": { ... }
 * }
 */
export async function POST(request) {
  try {
    const cookieHeader = request.headers.get("cookie") || "";
    let wpUserID = null;
    let crmUserID = null;
    console.log("cookieHeader", wpUserID, crmUserID);

    if (cookieHeader) {
      const wpUserIdMatch = cookieHeader.match(/wp_user_id=([^;]+)/);
      if (wpUserIdMatch) {
        wpUserID = decodeURIComponent(wpUserIdMatch[1].trim());
      }

      const userIdMatch = cookieHeader.match(/userId=([^;]+)/);
      if (userIdMatch) {
        crmUserID = decodeURIComponent(userIdMatch[1].trim());
      }
    }

    console.log(
      `[PAUSE_CANCEL_SUBSCRIPTION] Cookie header: ${cookieHeader.substring(0, 100)}...`
    );
    console.log(
      `[PAUSE_CANCEL_SUBSCRIPTION] Extracted wp_user_id: ${wpUserID || "not found"}`
    );
    console.log(
      `[PAUSE_CANCEL_SUBSCRIPTION] Extracted userId: ${crmUserID || "not found"}`
    );

    const body = await request.json();
    console.log(
      `[PAUSE_CANCEL_SUBSCRIPTION] Request body:`,
      JSON.stringify(body, null, 2)
    );

    if (!body.subscriptionId) {
      return NextResponse.json(
        {
          success: false,
          error: "subscriptionId is required",
        },
        { status: 400 }
      );
    }

    const finalWpUserId = body.wpUserId || wpUserID;
    const finalCrmUserId = body.crmUserId || crmUserID;

    if (!finalWpUserId || !finalCrmUserId) {
      return NextResponse.json(
        {
          success: false,
          error: "wpUserId and crmUserId are required (from cookies or body)",
        },
        { status: 400 }
      );
    }

    const crmResponse = await callPauseCancelSubscriptionInCRM(
      finalWpUserId,
      finalCrmUserId,
      body,
      request
    );

    if (!crmResponse.status) {
      return NextResponse.json(
        {
          success: false,
          error: crmResponse.message || "Failed to update subscription",
        },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      data: crmResponse,
    });
  } catch (error) {
    console.error("Error in pause-cancel-subscription:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Failed to process request",
        details: error.message,
      },
      { status: 500 }
    );
  }
}

/**
 * Call pause/cancel subscription endpoint in CRM
 * @param {string} wpUserID - WordPress user ID
 * @param {string} crmUserID - CRM user ID
 * @param {object} payload - Request payload
 * @param {Request} request - The request object to get token from cookie
 */
async function callPauseCancelSubscriptionInCRM(
  wpUserID,
  crmUserID,
  payload,
  request
) {
  const crmHost = process.env.CRM_HOST;

  if (!crmHost) {
    console.error(
      "[PAUSE_CANCEL_SUBSCRIPTION] Missing CRM configuration (CRM_HOST)"
    );
    return {
      status: false,
      message: "CRM configuration missing",
    };
  }

  console.log(`[PAUSE_CANCEL_SUBSCRIPTION] CRM Host: ${crmHost}`);

  try {
    const authToken = getTokenFromCookie(request);
    
    if (!authToken) {
      console.error("[PAUSE_CANCEL_SUBSCRIPTION] No token found in cookie");
      return {
        status: false,
        message: "Authentication token not found",
      };
    }

    console.log("[PAUSE_CANCEL_SUBSCRIPTION] Using token from cookie");

    const crmUrl = `${crmHost}/api/user/pause-cancel-subscription`;
    console.log(
      `[PAUSE_CANCEL_SUBSCRIPTION] Calling CRM endpoint: ${crmUrl}`
    );

    console.log(
      `[PAUSE_CANCEL_SUBSCRIPTION] Request payload:`,
      JSON.stringify(payload, null, 2)
    );

    const crmResponse = await fetch(crmUrl, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${authToken}`,
        "Content-Type": "application/json",
        "is-patient-portal": "true",
      },
      body: JSON.stringify(payload),
    });

    console.log(
      `[PAUSE_CANCEL_SUBSCRIPTION] CRM response status: ${crmResponse.status} ${crmResponse.statusText}`
    );

    if (!crmResponse.ok) {
      const errorText = await crmResponse.text();
      console.error(
        `[PAUSE_CANCEL_SUBSCRIPTION] CRM API error: ${errorText}`
      );
      
      let errorMessage = `CRM server ${crmResponse.status} error`;
      try {
        const errorJson = JSON.parse(errorText);
        if (errorJson.error) {
          errorMessage = errorJson.error;
        } else if (errorJson.message) {
          errorMessage = errorJson.message;
        }
      } catch (parseError) {
        if (errorText && errorText.length < 200) {
          errorMessage = errorText;
        }
      }
      
      return {
        status: false,
        message: errorMessage,
        details: errorText,
      };
    }

    const responseData = await crmResponse.json();
    console.log(
      `[PAUSE_CANCEL_SUBSCRIPTION] CRM response received:`,
      JSON.stringify(responseData, null, 2)
    );

    if (responseData.status === false) {
      const errorMessage = responseData.error || responseData.message || "Failed to update subscription";
      return {
        status: false,
        message: errorMessage,
        details: responseData,
      };
    }

    return responseData;
  } catch (error) {
    console.error(
      "[PAUSE_CANCEL_SUBSCRIPTION] Error calling CRM:",
      error
    );
    return {
      status: false,
      message: "Error calling CRM API",
      details: error.message,
    };
  }
}



