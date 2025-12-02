import { NextResponse } from "next/server";
import { authenticateWithCRM } from "../../../utils/crmAuth";

/**
 * GET /api/user/dashboard/states
 *
 * Fetches dashboard states (counts) from CRM.
 * Returns subscriptions count and orders count from the CRM dashboard states endpoint.
 *
 * Expected Response:
 * {
 *   "status": true,
 *   "message": "Subscriptions count retrieved successfully.",
 *   "subscriptions_count": 0,
 *   "orders_count": 0,
 *   "crm_user_id": 67867,
 *   "wp_user_id": 68002
 * }
 */
export async function GET(request) {
  try {
    // Get userId from cookies (set during auto-login)
    // Parse cookie header manually for compatibility
    const cookieHeader = request.headers.get("cookie") || "";
    let userId = null;

    if (cookieHeader) {
      // Parse cookies from header string
      const match = cookieHeader.match(/userId=([^;]+)/);
      if (match) {
        userId = decodeURIComponent(match[1].trim());
      }
    }

    console.log(
      `[DASHBOARD_STATES] Cookie header: ${cookieHeader.substring(0, 100)}...`
    );
    console.log(
      `[DASHBOARD_STATES] Extracted userId: ${userId || "not found"}`
    );

    // Check if CRM user ID is passed as query parameter (from frontend context)
    const searchParams = request.nextUrl.searchParams;
    const crmUserIDFromQuery =
      searchParams.get("crmUserID") || searchParams.get("id");

    // Use CRM user ID from query parameter if available (from userData.crm_user_id in context),
    // otherwise fall back to userId from cookies
    const crmUserID = crmUserIDFromQuery || userId;

    if (!crmUserID) {
      return NextResponse.json(
        {
          status: false,
          message: "User not authenticated",
          error: "User not authenticated",
        },
        { status: 401 }
      );
    }

    if (crmUserIDFromQuery) {
      console.log(
        `[DASHBOARD_STATES] Using CRM user ID from query parameter (userData.crm_user_id): ${crmUserID}`
      );
    } else {
      console.log(
        `[DASHBOARD_STATES] Using userId from cookies as CRM user ID: ${crmUserID}`
      );
    }

    console.log(
      `[DASHBOARD_STATES] Fetching dashboard states for user: ${crmUserID}`
    );

    // Fetch dashboard states from CRM
    const dashboardStates = await fetchDashboardStates(crmUserID);

    if (dashboardStates.error) {
      return NextResponse.json(
        {
          status: false,
          message: dashboardStates.error,
          error: dashboardStates.error,
        },
        { status: 500 }
      );
    }

    return NextResponse.json({
      status: true,
      message: "Subscriptions count retrieved successfully.",
      subscriptions_count: dashboardStates.subscriptions_count || 0,
      orders_count: dashboardStates.orders_count || 0,
      crm_user_id: dashboardStates.crm_user_id || userId,
      wp_user_id: dashboardStates.wp_user_id || null,
    });
  } catch (error) {
    console.error("Error fetching dashboard states:", error);
    return NextResponse.json(
      {
        status: false,
        message: "Failed to fetch dashboard states",
        error: "Failed to fetch dashboard states",
        details: error.message,
      },
      { status: 500 }
    );
  }
}

/**
 * Fetch dashboard states from CRM API
 * Uses the dashboard states endpoint: /api/user/{crmUserID}/dashboard/states
 */
async function fetchDashboardStates(userId) {
  const crmHost = process.env.CRM_HOST;
  const apiUsername = process.env.CRM_API_USERNAME;
  const apiPasswordEncoded = process.env.CRM_API_PASSWORD;

  if (!crmHost || !apiUsername || !apiPasswordEncoded) {
    console.error("[DASHBOARD_STATES] Missing CRM credentials:");
    console.error({
      crmHost: crmHost || "MISSING",
      apiUsername: apiUsername ? "SET" : "MISSING",
      apiPasswordEncoded: apiPasswordEncoded ? "SET" : "MISSING",
    });
    return {
      subscriptions_count: 0,
      orders_count: 0,
      crm_user_id: userId,
      error: "Missing CRM credentials",
    };
  }

  console.log(`[DASHBOARD_STATES] CRM Host: ${crmHost}`);
  console.log(`[DASHBOARD_STATES] CRM Username: ${apiUsername}`);

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
        console.log("[DASHBOARD_STATES] Password decoded from base64");
      } else {
        apiPassword = apiPasswordEncoded;
        console.log("[DASHBOARD_STATES] Using password as plain text");
      }
    } catch (decodeError) {
      // If base64 decode fails, use as plain text
      apiPassword = apiPasswordEncoded;
      console.log(
        "[DASHBOARD_STATES] Base64 decode failed, using password as plain text"
      );
    }

    // Step 1: Authenticate with CRM to get auth token
    console.log("[DASHBOARD_STATES] Authenticating with CRM...");
    const authResult = await authenticateWithCRM(
      crmHost,
      apiUsername,
      apiPassword
    );

    if (!authResult.success) {
      console.error(
        `[DASHBOARD_STATES] CRM authentication failed: ${authResult.error}`
      );
      if (authResult.endpoint) {
        console.error(
          `[DASHBOARD_STATES] Failed endpoint: ${authResult.endpoint}`
        );
      }
      return {
        subscriptions_count: 0,
        orders_count: 0,
        crm_user_id: userId,
        error: `CRM authentication failed: ${authResult.error}`,
      };
    }

    const authToken = authResult.token;
    console.log(
      `[DASHBOARD_STATES] Successfully obtained CRM auth token from ${authResult.endpoint}`
    );

    // Step 2: Fetch dashboard states from CRM
    const dashboardStatesUrl = `${crmHost}/api/user/${userId}/dashboard/states`;
    console.log(
      `[DASHBOARD_STATES] Fetching dashboard states from: ${dashboardStatesUrl}`
    );

    const dashboardStatesResponse = await fetch(dashboardStatesUrl, {
      method: "GET",
      headers: {
        Authorization: `Bearer ${authToken}`,
        "Content-Type": "application/json",
        "is-patient-portal": "true",
      },
    });

    if (!dashboardStatesResponse.ok) {
      const errorText = await dashboardStatesResponse.text();
      console.error(
        `[DASHBOARD_STATES] Failed to fetch dashboard states: ${dashboardStatesResponse.status} ${dashboardStatesResponse.statusText}`
      );
      console.error(`[DASHBOARD_STATES] Error details: ${errorText}`);
      console.error(`[DASHBOARD_STATES] Request URL: ${dashboardStatesUrl}`);
      console.error(`[DASHBOARD_STATES] User ID used: ${userId}`);

      // Try to parse error as JSON
      let errorDetails = errorText;
      try {
        const errorJson = JSON.parse(errorText);
        errorDetails = errorJson.message || errorJson.error || errorText;
      } catch {
        // Not JSON, use as is
      }

      return {
        subscriptions_count: 0,
        orders_count: 0,
        crm_user_id: userId,
        error: `Failed to fetch: ${dashboardStatesResponse.status} ${dashboardStatesResponse.statusText}. ${errorDetails}`,
      };
    }

    const responseData = await dashboardStatesResponse.json();
    console.log("[DASHBOARD_STATES] CRM response received");
    console.log(
      "[DASHBOARD_STATES] Full CRM response:",
      JSON.stringify(responseData, null, 2)
    );

    // Extract data from the CRM response structure
    // CRM returns: { status: true, message: "...", subscriptions_count: 0, orders_count: 0, ... }
    let dashboardStates = responseData;
    if (responseData.status && responseData.data) {
      // If data is nested, extract it
      dashboardStates = {
        ...responseData,
        ...responseData.data,
      };
      console.log("[DASHBOARD_STATES] ✓ Extracted data from nested structure");
    }

    console.log(
      `[DASHBOARD_STATES] ✓ Successfully fetched dashboard states for user: ${userId}`
    );
    console.log(
      `[DASHBOARD_STATES] Subscriptions count: ${
        dashboardStates.subscriptions_count || 0
      }`
    );
    console.log(
      `[DASHBOARD_STATES] Orders count: ${dashboardStates.orders_count || 0}`
    );

    return dashboardStates;
  } catch (error) {
    console.error(
      "[DASHBOARD_STATES] Error fetching dashboard states from CRM:",
      error
    );
    return {
      subscriptions_count: 0,
      orders_count: 0,
      crm_user_id: userId,
      error: error.message,
    };
  }
}
