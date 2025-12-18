import { NextResponse } from "next/server";
import { authenticateWithCRM } from "@/app/api/utils/crmAuth";

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
      body
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
 */
async function callPauseCancelSubscriptionInCRM(
  wpUserID,
  crmUserID,
  payload
) {
  const crmHost = process.env.CRM_HOST;
  const apiUsername = process.env.CRM_API_USERNAME;
  const apiPasswordEncoded = process.env.CRM_API_PASSWORD;

  if (!crmHost || !apiUsername || !apiPasswordEncoded) {
    console.error(
      "[PAUSE_CANCEL_SUBSCRIPTION] Missing CRM configuration (CRM_HOST, CRM_API_USERNAME, or CRM_API_PASSWORD)"
    );
    return {
      status: false,
      message: "CRM configuration missing",
    };
  }

  console.log(`[PAUSE_CANCEL_SUBSCRIPTION] CRM Host: ${crmHost}`);

  try {
    let apiPassword;
    try {
      const decoded = Buffer.from(apiPasswordEncoded, "base64").toString("utf8");
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
      return {
        status: false,
        message: `CRM API error: ${crmResponse.status} ${crmResponse.statusText}`,
        details: errorText,
      };
    }

    const responseData = await crmResponse.json();
    console.log(
      `[PAUSE_CANCEL_SUBSCRIPTION] CRM response received:`,
      JSON.stringify(responseData, null, 2)
    );

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


