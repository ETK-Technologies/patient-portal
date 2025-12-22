import { NextResponse } from "next/server";
import { getTokenFromCookie } from "../../../../utils/getTokenFromCookie";

/**
 * POST /api/user/[userId]/password/update
 *
 * Updates user password by calling the CRM API.
 * Uses wp_user_id from cookies to get wp_username from profile.
 *
 * Request Body:
 * {
 *   "old_password": "123123",
 *   "new_password": "123123"
 * }
 *
 * Expected Response:
 * {
 *   "success": true,
 *   "data": { ... }
 * }
 */
export async function POST(request, { params }) {
  try {
    const { userId } = await params;

    if (!userId) {
      return NextResponse.json(
        {
          success: false,
          error: "Missing user ID in route",
        },
        { status: 400 }
      );
    }

    const cookieHeader = request.headers.get("cookie") || "";
    let wpUserID = null;

    if (cookieHeader) {
      const match = cookieHeader.match(/wp_user_id=([^;]+)/);
      if (match) {
        wpUserID = decodeURIComponent(match[1].trim());
      }
    }

    console.log(
      `[PASSWORD_UPDATE] Cookie header: ${cookieHeader.substring(0, 100)}...`
    );
    console.log(
      `[PASSWORD_UPDATE] Extracted wp_user_id: ${wpUserID || "not found"}`
    );
    console.log(`[PASSWORD_UPDATE] userId from route: ${userId}`);

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
    const { old_password, new_password } = body;

    if (!old_password) {
      return NextResponse.json(
        {
          success: false,
          error: "Missing required field: old_password",
        },
        { status: 400 }
      );
    }

    if (!new_password) {
      return NextResponse.json(
        {
          success: false,
          error: "Missing required field: new_password",
        },
        { status: 400 }
      );
    }

    console.log(
      `[PASSWORD_UPDATE] Fetching user profile to get wp_username for wp_user_id: ${wpUserID}`
    );
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
      console.error(
        `[PASSWORD_UPDATE] Failed to fetch user profile: ${profileResponse.status}`
      );
      return NextResponse.json(
        {
          success: false,
          error: "Failed to fetch user profile",
        },
        { status: 500 }
      );
    }

    const profileData = await profileResponse.json();
    const wp_username =
      profileData?.user?.email ||
      profileData?.user?.wp_username ||
      profileData?.data?.email ||
      profileData?.data?.wp_username;

    if (!wp_username) {
      console.error("[PASSWORD_UPDATE] wp_username not found in profile");
      return NextResponse.json(
        {
          success: false,
          error: "User email not found in profile",
        },
        { status: 500 }
      );
    }

    console.log(`[PASSWORD_UPDATE] Using wp_username: ${wp_username}`);

    const result = await updatePasswordInCRM(
      userId,
      wp_username,
      old_password,
      new_password,
      request
    );

    return NextResponse.json({
      success: true,
      data: result,
    });
  } catch (error) {
    console.error("[PASSWORD_UPDATE] Error:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Failed to update password",
        details: error.message,
      },
      { status: 500 }
    );
  }
}

/**
 * Update password in CRM API
 * @param {string} userId - User ID (crmUserID)
 * @param {string} wp_username - WordPress username (email)
 * @param {string} oldPassword - Old password
 * @param {string} newPassword - New password
 * @param {Request} request - The request object to get token from cookie
 */
async function updatePasswordInCRM(
  userId,
  wp_username,
  oldPassword,
  newPassword,
  request
) {
  const crmHost = process.env.CRM_HOST;

  if (!crmHost) {
    console.error("[PASSWORD_UPDATE] Missing CRM_HOST");
    return {
      status: false,
      message: "CRM configuration missing",
    };
  }

  console.log(`[PASSWORD_UPDATE] CRM Host: ${crmHost}`);

  try {
    const authToken = getTokenFromCookie(request);
    
    if (!authToken) {
      console.error("[PASSWORD_UPDATE] No token found in cookie");
      return {
        status: false,
        message: "Authentication token not found",
      };
    }

    console.log("[PASSWORD_UPDATE] Using token from cookie");

    const updatePasswordUrl = `${crmHost}/api/user/${userId}/password/update`;
    console.log(
      `[PASSWORD_UPDATE] Calling CRM endpoint: ${updatePasswordUrl}`
    );

    const payload = {
      wp_username: wp_username,
      old_password: oldPassword,
      new_password: newPassword,
    };

    console.log(
      `[PASSWORD_UPDATE] Request payload:`,
      JSON.stringify({ ...payload, old_password: "***", new_password: "***" }, null, 2)
    );

    const crmResponse = await fetch(updatePasswordUrl, {
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
        `[PASSWORD_UPDATE] Failed to update password: ${crmResponse.status} ${crmResponse.statusText}`
      );
      console.error(`[PASSWORD_UPDATE] Error details: ${errorText}`);
      return {
        status: false,
        message: `Failed to update password: ${crmResponse.status} ${crmResponse.statusText}`,
        error: errorText,
      };
    }

    const responseData = await crmResponse.json();
    console.log("[PASSWORD_UPDATE] CRM response received");
    console.log(
      "[PASSWORD_UPDATE] Full CRM response:",
      JSON.stringify(responseData, null, 2)
    );

    console.log(
      `[PASSWORD_UPDATE] ✓ Successfully updated password for user ${userId}`
    );
    return responseData;
  } catch (error) {
    console.error(
      "[PASSWORD_UPDATE] Error updating password in CRM:",
      error
    );
    return {
      status: false,
      message: error.message || "Failed to update password",
    };
  }
}


