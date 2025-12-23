import { NextResponse } from "next/server";
import { getTokenFromCookie } from "../../utils/getTokenFromCookie";

/**
 * POST /api/user/change-refill-date
 *
 * Changes the refill date for a subscription by calling the CRM API.
 * Uses wp_user_id from cookies.
 *
 * Request Body:
 * {
 *   "subscription_id": 401204,
 *   "refill_date": "2025-12-27" // yyyy-mm-dd format
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
      `[CHANGE_REFILL_DATE] Cookie header: ${cookieHeader.substring(0, 100)}...`
    );
    console.log(
      `[CHANGE_REFILL_DATE] Extracted wp_user_id: ${wpUserID || "not found"}`
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
    const { subscription_id, refill_date } = body;

    if (!subscription_id) {
      return NextResponse.json(
        {
          success: false,
          error: "Missing required field: subscription_id",
        },
        { status: 400 }
      );
    }

    if (!refill_date) {
      return NextResponse.json(
        {
          success: false,
          error: "Missing required field: refill_date",
        },
        { status: 400 }
      );
    }

    const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
    if (!dateRegex.test(refill_date)) {
      return NextResponse.json(
        {
          success: false,
          error: "Invalid date format. Expected yyyy-mm-dd",
        },
        { status: 400 }
      );
    }

    console.log(
      `[CHANGE_REFILL_DATE] Changing refill date for subscription ${subscription_id} to ${refill_date}`
    );

    const result = await changeRefillDateInCRM(
      wpUserID,
      subscription_id,
      refill_date,
      request
    );

    return NextResponse.json({
      success: true,
      data: result,
    });
  } catch (error) {
    console.error("[CHANGE_REFILL_DATE] Error:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Failed to change refill date",
        details: error.message,
      },
      { status: 500 }
    );
  }
}

/**
 * Change refill date in CRM API
 * @param {string} wpUserID - WordPress user ID
 * @param {number} subscriptionId - Subscription ID
 * @param {string} refillDate - Refill date in yyyy-mm-dd format
 * @param {Request} request - The request object to get token from cookie
 */
async function changeRefillDateInCRM(wpUserID, subscriptionId, refillDate, request) {
  const crmHost = process.env.CRM_HOST;

  if (!crmHost) {
    console.error("[CHANGE_REFILL_DATE] Missing CRM_HOST");
    return {
      status: false,
      message: "CRM configuration missing",
    };
  }

  console.log(`[CHANGE_REFILL_DATE] CRM Host: ${crmHost}`);

  try {
    const authToken = getTokenFromCookie(request);
    
    if (!authToken) {
      console.error("[CHANGE_REFILL_DATE] No token found in cookie");
      return {
        status: false,
        message: "Authentication token not found",
      };
    }

    console.log("[CHANGE_REFILL_DATE] Using token from cookie");

    const changeRefillDateUrl = `${crmHost}/api/user/change-refill-date`;
    console.log(
      `[CHANGE_REFILL_DATE] Calling CRM endpoint: ${changeRefillDateUrl}`
    );

    const payload = {
      wp_user_id: parseInt(wpUserID, 10),
      subscription_id: parseInt(subscriptionId, 10),
      refill_date: refillDate,
    };

    console.log(
      `[CHANGE_REFILL_DATE] Request payload:`,
      JSON.stringify(payload, null, 2)
    );

    const crmResponse = await fetch(changeRefillDateUrl, {
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
        `[CHANGE_REFILL_DATE] Failed to change refill date: ${crmResponse.status} ${crmResponse.statusText}`
      );
      console.error(`[CHANGE_REFILL_DATE] Error details: ${errorText}`);
      return {
        status: false,
        message: `Failed to change refill date: ${crmResponse.status} ${crmResponse.statusText}`,
        error: errorText,
      };
    }

    const responseData = await crmResponse.json();
    console.log("[CHANGE_REFILL_DATE] CRM response received");
    console.log(
      "[CHANGE_REFILL_DATE] Full CRM response:",
      JSON.stringify(responseData, null, 2)
    );

    console.log(
      `[CHANGE_REFILL_DATE] ✓ Successfully changed refill date for subscription ${subscriptionId}`
    );
    return responseData;
  } catch (error) {
    console.error(
      "[CHANGE_REFILL_DATE] Error changing refill date in CRM:",
      error
    );
    return {
      status: false,
      message: error.message || "Failed to change refill date",
    };
  }
}

