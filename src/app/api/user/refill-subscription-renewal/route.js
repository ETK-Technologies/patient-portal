import { NextResponse } from "next/server";
import { authenticateWithCRM } from "../../utils/crmAuth";

/**
 * POST /api/user/refill-subscription-renewal
 *
 * Requests a refill for a subscription by calling the CRM API.
 * Uses wp_user_id from cookies.
 *
 * Request Body:
 * {
 *   "subscription_id": 401200
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

    if (cookieHeader) {
      const match = cookieHeader.match(/wp_user_id=([^;]+)/);
      if (match) {
        wpUserID = decodeURIComponent(match[1].trim());
      }
    }

    console.log(
      `[REFILL_SUBSCRIPTION] Cookie header: ${cookieHeader.substring(0, 100)}...`
    );
    console.log(
      `[REFILL_SUBSCRIPTION] Extracted wp_user_id: ${wpUserID || "not found"}`
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

    const body = await request.json();
    const { subscription_id } = body;

    if (!subscription_id) {
      return NextResponse.json(
        {
          success: false,
          error: "Missing required field: subscription_id",
        },
        { status: 400 }
      );
    }

    console.log(
      `[REFILL_SUBSCRIPTION] Requesting refill for subscription ${subscription_id}`
    );

    const result = await requestRefillInCRM(wpUserID, subscription_id);

    return NextResponse.json({
      success: true,
      data: result,
    });
  } catch (error) {
    console.error("[REFILL_SUBSCRIPTION] Error:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Failed to request refill",
        details: error.message,
      },
      { status: 500 }
    );
  }
}

/**
 * Request refill in CRM API
 * @param {string} wpUserID - WordPress user ID
 * @param {number} subscriptionId - Subscription ID
 */
async function requestRefillInCRM(wpUserID, subscriptionId) {
  const crmHost = process.env.CRM_HOST;
  const apiUsername = process.env.CRM_API_USERNAME;
  const apiPasswordEncoded = process.env.CRM_API_PASSWORD;

  if (!crmHost || !apiUsername || !apiPasswordEncoded) {
    console.error("[REFILL_SUBSCRIPTION] Missing CRM credentials:");
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

  console.log(`[REFILL_SUBSCRIPTION] CRM Host: ${crmHost}`);

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
        console.log("[REFILL_SUBSCRIPTION] Password decoded from base64");
      } else {
        apiPassword = apiPasswordEncoded;
        console.log("[REFILL_SUBSCRIPTION] Using password as plain text");
      }
    } catch (decodeError) {
      apiPassword = apiPasswordEncoded;
      console.log(
        "[REFILL_SUBSCRIPTION] Base64 decode failed, using password as plain text"
      );
    }

    console.log("[REFILL_SUBSCRIPTION] Authenticating with CRM...");
    const authResult = await authenticateWithCRM(
      crmHost,
      apiUsername,
      apiPassword
    );

    if (!authResult.success) {
      console.error(
        `[REFILL_SUBSCRIPTION] CRM authentication failed: ${authResult.error}`
      );
      if (authResult.endpoint) {
        console.error(
          `[REFILL_SUBSCRIPTION] Failed endpoint: ${authResult.endpoint}`
        );
      }
      return {
        status: false,
        message: "CRM authentication failed",
      };
    }

    const authToken = authResult.token;
    console.log(
      `[REFILL_SUBSCRIPTION] Successfully obtained CRM auth token from ${authResult.endpoint}`
    );

    const refillUrl = `${crmHost}/api/user/refill-subscription-renewal`;
    console.log(
      `[REFILL_SUBSCRIPTION] Calling CRM endpoint: ${refillUrl}`
    );

    const payload = {
      wp_user_id: parseInt(wpUserID, 10),
      subscription_id: parseInt(subscriptionId, 10),
    };

    console.log(
      `[REFILL_SUBSCRIPTION] Request payload:`,
      JSON.stringify(payload, null, 2)
    );

    const crmResponse = await fetch(refillUrl, {
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
        `[REFILL_SUBSCRIPTION] Failed to request refill: ${crmResponse.status} ${crmResponse.statusText}`
      );
      console.error(`[REFILL_SUBSCRIPTION] Error details: ${errorText}`);
      return {
        status: false,
        message: `Failed to request refill: ${crmResponse.status} ${crmResponse.statusText}`,
        error: errorText,
      };
    }

    const responseData = await crmResponse.json();
    console.log("[REFILL_SUBSCRIPTION] CRM response received");
    console.log(
      "[REFILL_SUBSCRIPTION] Full CRM response:",
      JSON.stringify(responseData, null, 2)
    );

    console.log(
      `[REFILL_SUBSCRIPTION] ✓ Successfully requested refill for subscription ${subscriptionId}`
    );
    return responseData;
  } catch (error) {
    console.error(
      "[REFILL_SUBSCRIPTION] Error requesting refill in CRM:",
      error
    );
    return {
      status: false,
      message: error.message || "Failed to request refill",
    };
  }
}

