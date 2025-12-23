import { NextResponse } from "next/server";
import { getTokenFromCookie } from "../../utils/getTokenFromCookie";

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
    let inviteeEmail = null;

    if (cookieHeader) {
      const wpUserIdMatch = cookieHeader.match(/wp_user_id=([^;]+)/);
      if (wpUserIdMatch) {
        wpUserID = decodeURIComponent(wpUserIdMatch[1].trim());
      }

      const userEmailMatch = cookieHeader.match(/userEmail=([^;]+)/);
      if (userEmailMatch) {
        inviteeEmail = decodeURIComponent(userEmailMatch[1].trim());
      }
    }

    console.log(
      `[APPOINTMENTS] Cookie header: ${cookieHeader.substring(0, 100)}...`
    );
    console.log(`[APPOINTMENTS] Extracted wp_user_id: ${wpUserID || "not found"}`);
    console.log(`[APPOINTMENTS] Extracted userEmail: ${inviteeEmail || "not found"}`);

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

    if (!inviteeEmail) {
      return NextResponse.json(
        {
          success: false,
          error: "User email not found",
          message: "userEmail not found in cookies",
        },
        { status: 400 }
      );
    }

    console.log(`[APPOINTMENTS] Using wp_user_id from cookies: ${wpUserID}`);
    console.log(`[APPOINTMENTS] Using invitee email from cookie: ${inviteeEmail}`);

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
