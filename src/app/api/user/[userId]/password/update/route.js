import { NextResponse } from "next/server";
import { authenticateWithCRM } from "../../../../utils/crmAuth";

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
      new_password
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
 */
async function updatePasswordInCRM(
  userId,
  wp_username,
  oldPassword,
  newPassword
) {
  const crmHost = process.env.CRM_HOST;
  const apiUsername = process.env.CRM_API_USERNAME;
  const apiPasswordEncoded = process.env.CRM_API_PASSWORD;

  if (!crmHost || !apiUsername || !apiPasswordEncoded) {
    console.error("[PASSWORD_UPDATE] Missing CRM credentials:");
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

  console.log(`[PASSWORD_UPDATE] CRM Host: ${crmHost}`);

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
        console.log("[PASSWORD_UPDATE] Password decoded from base64");
      } else {
        apiPassword = apiPasswordEncoded;
        console.log("[PASSWORD_UPDATE] Using password as plain text");
      }
    } catch (decodeError) {
      apiPassword = apiPasswordEncoded;
      console.log(
        "[PASSWORD_UPDATE] Base64 decode failed, using password as plain text"
      );
    }

    console.log("[PASSWORD_UPDATE] Authenticating with CRM...");
    const authResult = await authenticateWithCRM(
      crmHost,
      apiUsername,
      apiPassword
    );

    if (!authResult.success) {
      console.error(
        `[PASSWORD_UPDATE] CRM authentication failed: ${authResult.error}`
      );
      if (authResult.endpoint) {
        console.error(
          `[PASSWORD_UPDATE] Failed endpoint: ${authResult.endpoint}`
        );
      }
      return {
        status: false,
        message: "CRM authentication failed",
      };
    }

    const authToken = authResult.token;
    console.log(
      `[PASSWORD_UPDATE] Successfully obtained CRM auth token from ${authResult.endpoint}`
    );

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


