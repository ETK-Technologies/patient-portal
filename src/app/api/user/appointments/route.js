import { NextResponse } from "next/server";
import { authenticateWithCRM } from "../../utils/crmAuth";

/**
 * GET /api/user/appointments
 *
 * Fetches appointments from Calendly API for the authenticated user.
 * Returns meetings data based on the user's email from CRM.
 *
 * Expected Response:
 * {
 *   "success": true,
 *   "meetings": [
 *     {
 *       "eventUuid": "...",
 *       "name": "...",
 *       "startTime": "...",
 *       "organizer": null,
 *       "invitees": [...]
 *     }
 *   ]
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
      `[APPOINTMENTS] Cookie header: ${cookieHeader.substring(0, 100)}...`
    );
    console.log(`[APPOINTMENTS] Extracted wp_user_id: ${wpUserID || "not found"}`);

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

    console.log(`[APPOINTMENTS] Using wp_user_id from cookies: ${wpUserID}`);

    const inviteeEmail = await fetchUserEmailFromCRM(wpUserID);

    if (!inviteeEmail) {
      return NextResponse.json(
        {
          success: false,
          error: "Failed to fetch user email from CRM",
        },
        { status: 404 }
      );
    }

    console.log(`[APPOINTMENTS] Using invitee email from CRM: ${inviteeEmail}`);

    // Get base URL from environment variable or use default
    let baseUrl = process.env.CALENDLY_BASE_URL || "http://3.99.130.153";

    // Ensure base URL has protocol
    if (!baseUrl.startsWith("http://") && !baseUrl.startsWith("https://")) {
      baseUrl = `http://${baseUrl}`;
    }

    // Remove trailing slash if present
    baseUrl = baseUrl.replace(/\/$/, "");

    // Fetch appointments from Calendly API
    const calendlyUrl = `${baseUrl}/calendly/groups/meetings?inviteeEmail=${encodeURIComponent(
      inviteeEmail
    )}`;

    console.log(`[APPOINTMENTS] Fetching appointments from: ${calendlyUrl}`);
    console.log(`[APPOINTMENTS] Using invitee email: ${inviteeEmail}`);

    const calendlyResponse = await fetch(calendlyUrl, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
      },
    });

    if (!calendlyResponse.ok) {
      console.error(
        `[APPOINTMENTS] Calendly API error: ${calendlyResponse.status} ${calendlyResponse.statusText}`
      );
      const errorText = await calendlyResponse.text();
      console.error(`[APPOINTMENTS] Error details: ${errorText}`);

      return NextResponse.json(
        {
          success: false,
          error: "Failed to fetch appointments from Calendly",
          details: errorText,
        },
        { status: calendlyResponse.status }
      );
    }

    const calendlyData = await calendlyResponse.json();
    console.log(
      `[APPOINTMENTS] Successfully fetched ${
        calendlyData.meetings?.length || 0
      } meetings`
    );

    return NextResponse.json({
      success: true,
      meetings: calendlyData.meetings || [],
    });
  } catch (error) {
    console.error("[APPOINTMENTS] Error fetching appointments:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Failed to fetch appointments",
        details: error.message,
      },
      { status: 500 }
    );
  }
}

/**
 * Fetch user email from CRM API
 * Uses the personal profile endpoint: /api/crm-users/{wpUserID}/edit/personal-profile
 */
async function fetchUserEmailFromCRM(wpUserID) {
  const crmHost = process.env.CRM_HOST;
  const apiUsername = process.env.CRM_API_USERNAME;
  const apiPasswordEncoded = process.env.CRM_API_PASSWORD;

  if (!crmHost || !apiUsername || !apiPasswordEncoded) {
    console.error("[APPOINTMENTS] Missing CRM credentials:");
    console.error({
      crmHost: crmHost || "MISSING",
      apiUsername: apiUsername ? "SET" : "MISSING",
      apiPasswordEncoded: apiPasswordEncoded ? "SET" : "MISSING",
    });
    return null;
  }

  console.log(`[APPOINTMENTS] CRM Host: ${crmHost}`);
  console.log(`[APPOINTMENTS] CRM Username: ${apiUsername}`);

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
        console.log("[APPOINTMENTS] Password decoded from base64");
      } else {
        apiPassword = apiPasswordEncoded;
        console.log("[APPOINTMENTS] Using password as plain text");
      }
    } catch (decodeError) {
      apiPassword = apiPasswordEncoded;
      console.log(
        "[APPOINTMENTS] Base64 decode failed, using password as plain text"
      );
    }

    console.log("[APPOINTMENTS] Authenticating with CRM...");
    const authResult = await authenticateWithCRM(
      crmHost,
      apiUsername,
      apiPassword
    );

    if (!authResult.success) {
      console.error(
        `[APPOINTMENTS] CRM authentication failed: ${authResult.error}`
      );
      if (authResult.endpoint) {
        console.error(
          `[APPOINTMENTS] Failed endpoint: ${authResult.endpoint}`
        );
      }
      return null;
    }

    const authToken = authResult.token;
    console.log(
      `[APPOINTMENTS] Successfully obtained CRM auth token from ${authResult.endpoint}`
    );

    const profileUrl = `${crmHost}/api/user/profile?wp_user_id=${wpUserID}`;
    console.log(
      `[APPOINTMENTS] Fetching user profile from: ${profileUrl}`
    );

    const profileResponse = await fetch(profileUrl, {
      method: "GET",
      headers: {
        Authorization: `Bearer ${authToken}`,
        "Content-Type": "application/json",
        "is-patient-portal": "true",
      },
    });

    if (!profileResponse.ok) {
      const errorText = await profileResponse.text();
      console.error(
        `[APPOINTMENTS] Failed to fetch user profile: ${profileResponse.status} ${profileResponse.statusText}`
      );
      console.error(`[APPOINTMENTS] Error details: ${errorText}`);
      return null;
    }

    const responseData = await profileResponse.json();
    console.log("[APPOINTMENTS] CRM profile response received");

    let email = null;
    if (responseData.user?.email) {
      email = responseData.user.email;
    } else if (responseData.email) {
      email = responseData.email;
    }

    if (email) {
      console.log(
        `[APPOINTMENTS] ✓ Successfully fetched email for user: ${wpUserID}`
      );
    } else {
      console.error(
        `[APPOINTMENTS] Email not found in profile response for user: ${wpUserID}`
      );
    }

    return email;
  } catch (error) {
    console.error(
      "[APPOINTMENTS] Error fetching user email from CRM:",
      error
    );
    return null;
  }
}