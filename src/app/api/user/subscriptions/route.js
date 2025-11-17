import { NextResponse } from "next/server";
import { authenticateWithCRM } from "../../utils/crmAuth";
import { getUserID } from "@/utils/testUserId";

/**
 * GET /api/user/subscriptions
 *
 * Fetches user subscriptions data from CRM.
 * Uses test user ID (33237) for development/testing.
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
    // Use test user ID for development/testing
    const wpUserID = getUserID();

    console.log(`[SUBSCRIPTIONS] Using test user ID: ${wpUserID}`);

    // Fetch subscriptions from CRM
    const subscriptionsData = await fetchSubscriptions(wpUserID);

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
async function fetchSubscriptions(wpUserID) {
  const crmHost = process.env.CRM_HOST;
  const apiUsername = process.env.CRM_API_USERNAME;
  const apiPasswordEncoded = process.env.CRM_API_PASSWORD;

  if (!crmHost || !apiUsername || !apiPasswordEncoded) {
    console.error("[SUBSCRIPTIONS] Missing CRM credentials:");
    console.error({
      crmHost: crmHost || "MISSING",
      apiUsername: apiUsername ? "SET" : "MISSING",
      apiPasswordEncoded: apiPasswordEncoded ? "SET" : "MISSING",
    });
    return {
      status: false,
      message: "CRM configuration missing",
      data: {
        subscriptions: [],
      },
    };
  }

  console.log(`[SUBSCRIPTIONS] CRM Host: ${crmHost}`);
  console.log(`[SUBSCRIPTIONS] CRM Username: ${apiUsername}`);

  try {
    // Decode the password - try base64 first, fallback to plain text
    let apiPassword;
    try {
      const decoded = Buffer.from(apiPasswordEncoded, "base64").toString(
        "utf8"
      );
      const hasNonPrintable = /[\x00-\x08\x0E-\x1F\x7F-\x9F]/.test(decoded);
      const isSameAsInput = decoded === apiPasswordEncoded;

      if (!hasNonPrintable && !isSameAsInput && decoded.length > 0) {
        apiPassword = decoded;
        console.log("[SUBSCRIPTIONS] Password decoded from base64");
      } else {
        apiPassword = apiPasswordEncoded;
        console.log("[SUBSCRIPTIONS] Using password as plain text");
      }
    } catch (decodeError) {
      apiPassword = apiPasswordEncoded;
      console.log(
        "[SUBSCRIPTIONS] Base64 decode failed, using password as plain text"
      );
    }

    // Step 1: Authenticate with CRM to get auth token
    console.log("[SUBSCRIPTIONS] Authenticating with CRM...");
    const authResult = await authenticateWithCRM(
      crmHost,
      apiUsername,
      apiPassword
    );

    if (!authResult.success) {
      console.error(
        `[SUBSCRIPTIONS] CRM authentication failed: ${authResult.error}`
      );
      if (authResult.endpoint) {
        console.error(
          `[SUBSCRIPTIONS] Failed endpoint: ${authResult.endpoint}`
        );
      }
      return {
        status: false,
        message: "CRM authentication failed",
        data: {
          subscriptions: [],
        },
      };
    }

    const authToken = authResult.token;
    console.log(
      `[SUBSCRIPTIONS] Successfully obtained CRM auth token from ${authResult.endpoint}`
    );

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
        "Content-Type": "application/json",
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
