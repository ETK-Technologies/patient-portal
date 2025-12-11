import { NextResponse } from "next/server";
import { authenticateWithCRM } from "@/app/api/utils/crmAuth";

/**
 * POST /api/user/pause-cancel-subscription
 *
 * Pauses or cancels a subscription by calling the CRM API.
 * Uses wp_user_id and userId from cookies.
 *
 * Request Body:
 * {
 *   "subscriptionId": "500230",
 *   "wpUserId": "107685",
 *   "crmUserId": "33237",
 *   "answers": {
 *     "subscriptionAction": { "value": "pause" },
 *     "pauseOption": { "value": 30 },
 *     "quantityOption": { "value": "20" },
 *     "treatmentWorked": { "value": "yes" },
 *     "treatmentWorkedTest": { "text": "I want to pause" },
 *     "cancelReasons": { "value": ["reason1", "reason2"] },
 *     "finalFeedback": { "text": "This is good Medicine" }
 *   }
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
      `[PAUSE_CANCEL_SUBSCRIPTION] Extracted userId (crmUserId): ${crmUserID || "not found"}`
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

    if (!crmUserID) {
      return NextResponse.json(
        {
          success: false,
          error: "User not authenticated",
          message: "userId (crmUserId) not found in cookies",
        },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { subscriptionId, answers } = body;

    if (!subscriptionId) {
      return NextResponse.json(
        {
          success: false,
          error: "Missing required field: subscriptionId",
        },
        { status: 400 }
      );
    }

    if (!answers) {
      return NextResponse.json(
        {
          success: false,
          error: "Missing required field: answers",
        },
        { status: 400 }
      );
    }

    console.log(
      `[PAUSE_CANCEL_SUBSCRIPTION] Processing pause/cancel for subscription ${subscriptionId}`
    );

    const payload = {
      subscriptionId: String(subscriptionId),
      wpUserId: String(wpUserID),
      crmUserId: String(crmUserID),
      answers: answers,
    };

    console.log(
      `[PAUSE_CANCEL_SUBSCRIPTION] Request payload:`,
      JSON.stringify(payload, null, 2)
    );

    const result = await pauseCancelSubscriptionInCRM(payload);

    return NextResponse.json({
      success: true,
      data: result,
    });
  } catch (error) {
    console.error("[PAUSE_CANCEL_SUBSCRIPTION] Error:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Failed to pause/cancel subscription",
        details: error.message,
      },
      { status: 500 }
    );
  }
}

/**
 * Pause or cancel subscription in CRM API
 * @param {object} payload - Payload containing subscriptionId, wpUserId, crmUserId, and answers
 */
async function pauseCancelSubscriptionInCRM(payload) {
  const crmHost = process.env.CRM_HOST;
  const apiUsername = process.env.CRM_API_USERNAME;
  const apiPasswordEncoded = process.env.CRM_API_PASSWORD;

  if (!crmHost || !apiUsername || !apiPasswordEncoded) {
    console.error("[PAUSE_CANCEL_SUBSCRIPTION] Missing CRM credentials:");
    console.error({
      crmHost: crmHost || "MISSING",
      apiUsername: apiUsername ? "SET" : "MISSING",
      apiPasswordEncoded: apiPasswordEncoded ? "SET" : "MISSING",
    });
    return {
      status: false,
      message: "CRM configuration missing",
    };
  }

  console.log(`[PAUSE_CANCEL_SUBSCRIPTION] CRM Host: ${crmHost}`);

  try {
    let apiPassword;
    try {
      const decoded = Buffer.from(apiPasswordEncoded, "base64").toString(
        "utf8"
      );
      const hasNonPrintable = /[\x00-\x08\x0E-\x1F\x7F-\x9F]/.test(decoded);
      const isSameAsInput = decoded === apiPasswordEncoded;

      if (!hasNonPrintable && !isSameAsInput && decoded.length > 0) {
        apiPassword = decoded;
        console.log("[PAUSE_CANCEL_SUBSCRIPTION] Password decoded from base64");
      } else {
        apiPassword = apiPasswordEncoded;
        console.log("[PAUSE_CANCEL_SUBSCRIPTION] Using password as plain text");
      }
    } catch (decodeError) {
      apiPassword = apiPasswordEncoded;
      console.log(
        "[PAUSE_CANCEL_SUBSCRIPTION] Base64 decode failed, using password as plain text"
      );
    }

    console.log("[PAUSE_CANCEL_SUBSCRIPTION] Authenticating with CRM...");
    const authResult = await authenticateWithCRM(
      crmHost,
      apiUsername,
      apiPassword
    );

    if (!authResult.success) {
      console.error(
        `[PAUSE_CANCEL_SUBSCRIPTION] CRM authentication failed: ${authResult.error}`
      );
      if (authResult.endpoint) {
        console.error(
          `[PAUSE_CANCEL_SUBSCRIPTION] Failed endpoint: ${authResult.endpoint}`
        );
      }
      return {
        status: false,
        message: "CRM authentication failed",
      };
    }

    const authToken = authResult.token;
    console.log(
      `[PAUSE_CANCEL_SUBSCRIPTION] Successfully obtained CRM auth token from ${authResult.endpoint}`
    );

    const pauseCancelUrl = `${crmHost}/api/user/pause-cancel-subscription`;
    console.log(
      `[PAUSE_CANCEL_SUBSCRIPTION] Calling CRM endpoint: ${pauseCancelUrl}`
    );

    console.log(
      `[PAUSE_CANCEL_SUBSCRIPTION] Request payload:`,
      JSON.stringify(payload, null, 2)
    );

    const crmResponse = await fetch(pauseCancelUrl, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${authToken}`,
        "Content-Type": "application/json",
        "is-patient-portal": "true",
      },
      body: JSON.stringify(payload),
    });

    if (!crmResponse.ok) {
      const errorText = await crmResponse.text();
      console.error(
        `[PAUSE_CANCEL_SUBSCRIPTION] Failed to pause/cancel subscription: ${crmResponse.status} ${crmResponse.statusText}`
      );
      console.error(`[PAUSE_CANCEL_SUBSCRIPTION] Error details: ${errorText}`);
      return {
        status: false,
        message: `Failed to pause/cancel subscription: ${crmResponse.status} ${crmResponse.statusText}`,
        error: errorText,
      };
    }

    const responseData = await crmResponse.json();
    console.log("[PAUSE_CANCEL_SUBSCRIPTION] CRM response received");
    console.log(
      "[PAUSE_CANCEL_SUBSCRIPTION] Full CRM response:",
      JSON.stringify(responseData, null, 2)
    );

    console.log(
      `[PAUSE_CANCEL_SUBSCRIPTION] ✓ Successfully processed pause/cancel for subscription ${payload.subscriptionId}`
    );
    return responseData;
  } catch (error) {
    console.error(
      "[PAUSE_CANCEL_SUBSCRIPTION] Error processing pause/cancel in CRM:",
      error
    );
    return {
      status: false,
      message: error.message || "Failed to pause/cancel subscription",
    };
  }
}

