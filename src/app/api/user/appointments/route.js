import { NextResponse } from "next/server";

/**
 * GET /api/user/appointments
 *
 * Fetches appointments from Calendly API for the authenticated user.
 * Returns meetings data based on the user's email.
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
    // Get userId from cookies
    const cookieHeader = request.headers.get("cookie") || "";
    let userId = null;

    if (cookieHeader) {
      const match = cookieHeader.match(/userId=([^;]+)/);
      if (match) {
        userId = decodeURIComponent(match[1].trim());
      }
    }

    if (!userId) {
      return NextResponse.json(
        {
          success: false,
          error: "User not authenticated",
        },
        { status: 401 }
      );
    }

    // Fetch user profile to get email
    const profileResponse = await fetch(
      `${request.nextUrl.origin}/api/user/profile`,
      {
        method: "GET",
        headers: {
          cookie: cookieHeader,
        },
      }
    );

    if (!profileResponse.ok) {
      return NextResponse.json(
        {
          success: false,
          error: "Failed to fetch user profile",
        },
        { status: 500 }
      );
    }

    const profileData = await profileResponse.json();

    // Handle both response formats for compatibility
    // New format: { status: true, user: {...} }
    // Old format: { success: true, userData: {...} }
    const user = profileData.user || profileData.userData;
    const hasValidResponse = profileData.status || profileData.success;

    if (!hasValidResponse || !user?.email) {
      console.error(
        "[APPOINTMENTS] User email not found in profile response:",
        {
          hasStatus: !!profileData.status,
          hasSuccess: !!profileData.success,
          hasUser: !!profileData.user,
          hasUserData: !!profileData.userData,
          email: user?.email,
        }
      );
      return NextResponse.json(
        {
          success: false,
          error: "User email not found",
        },
        { status: 404 }
      );
    }

    const inviteeEmail = user.email;

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
