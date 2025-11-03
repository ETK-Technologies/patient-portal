import { NextResponse } from "next/server";
import { verifyAutoLoginToken } from "../auto-login-link/route";

/**
 * GET /api/user/verify-auto-login
 *
 * Verifies an auto-login token and returns user information.
 * This endpoint is called by the auto-login page to authenticate users.
 *
 * Query Parameters:
 * - token: Auto-login token from URL
 * - wp_user_id: WordPress user ID
 *
 * Expected Response:
 * {
 *   "success": true,
 *   "userData": {
 *     "id": "123",
 *     "name": "John Doe",
 *     "email": "user@example.com"
 *   }
 * }
 */
export async function GET(request) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const token = searchParams.get("token");
    const wpUserId = searchParams.get("wp_user_id");

    console.log("[VERIFY] Received verification request");
    console.log(
      `[VERIFY] Token from URL: ${
        token ? token.substring(0, 10) + "..." : "null"
      }`
    );
    console.log(`[VERIFY] Token length: ${token?.length || 0}`);
    console.log(`[VERIFY] wp_user_id: ${wpUserId}`);
    console.log(
      `[VERIFY] Full token (first 50 chars): ${
        token ? token.substring(0, 50) : "null"
      }`
    );

    // Validate required parameters
    if (!token || !wpUserId) {
      console.error("[VERIFY] Missing required parameters");
      return NextResponse.json(
        {
          success: false,
          error: "Missing required parameters: token and wp_user_id",
        },
        { status: 400 }
      );
    }

    // Verify the auto-login token
    console.log("[VERIFY] Calling verifyAutoLoginToken...");
    const verifiedUserId = await verifyAutoLoginToken(token);
    console.log(
      `[VERIFY] verifyAutoLoginToken returned: ${verifiedUserId || "null"}`
    );

    if (!verifiedUserId) {
      return NextResponse.json(
        {
          success: false,
          error: "Invalid or expired auto-login token",
        },
        { status: 401 }
      );
    }

    // Verify that the user ID matches
    if (verifiedUserId !== wpUserId) {
      return NextResponse.json(
        {
          success: false,
          error: "User ID mismatch",
        },
        { status: 403 }
      );
    }

    // Fetch user data from CRM or database
    const userData = await fetchUserData(wpUserId);

    return NextResponse.json({
      success: true,
      userData,
    });
  } catch (error) {
    console.error("Error verifying auto-login token:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Failed to verify auto-login token",
        details: error.message,
      },
      { status: 500 }
    );
  }
}

/**
 * Fetch user data from CRM API
 * Uses the personal profile endpoint: /api/crm-users/{userId}/edit/personal-profile
 */
async function fetchUserData(userId) {
  const crmHost = process.env.CRM_HOST;
  const apiUsername = process.env.CRM_API_USERNAME;
  const apiPasswordEncoded = process.env.CRM_API_PASSWORD;

  if (!crmHost || !apiUsername || !apiPasswordEncoded) {
    console.warn(
      "[USERDATA] Missing CRM credentials, returning basic user info"
    );
    return {
      id: userId,
    };
  }

  try {
    // Decode the base64 encoded password
    let apiPassword;
    try {
      apiPassword = Buffer.from(apiPasswordEncoded, "base64").toString();
    } catch (decodeError) {
      console.error(
        "[USERDATA] Failed to decode base64 password:",
        decodeError
      );
      return {
        id: userId,
      };
    }

    // Step 1: Authenticate with CRM to get auth token
    console.log("[USERDATA] Authenticating with CRM...");
    const loginResponse = await fetch(`${crmHost}/api/login`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        email: apiUsername,
        password: apiPassword,
      }),
    });

    if (!loginResponse.ok) {
      console.error(
        `[USERDATA] CRM authentication failed: ${loginResponse.status}`
      );
      return {
        id: userId,
      };
    }

    const loginData = await loginResponse.json();

    if (!loginData.success || !loginData.data?.token) {
      console.error("[USERDATA] CRM authentication token not found");
      return {
        id: userId,
      };
    }

    const authToken = loginData.data.token;
    console.log("[USERDATA] Successfully obtained CRM auth token");

    // Step 2: Fetch user profile from CRM
    const profileUrl = `${crmHost}/api/crm-users/${userId}/edit/personal-profile`;
    console.log(`[USERDATA] Fetching user profile from: ${profileUrl}`);

    const profileResponse = await fetch(profileUrl, {
      method: "GET",
      headers: {
        Authorization: `Bearer ${authToken}`,
        "Content-Type": "application/json",
      },
    });

    if (!profileResponse.ok) {
      console.error(
        `[USERDATA] Failed to fetch user profile: ${profileResponse.status} ${profileResponse.statusText}`
      );
      const errorText = await profileResponse.text();
      console.error(`[USERDATA] Error details: ${errorText}`);
      return {
        id: userId,
      };
    }

    const userData = await profileResponse.json();
    console.log("[USERDATA] Successfully fetched user profile data");

    // Return the user data from CRM
    return userData;
  } catch (error) {
    console.error("[USERDATA] Error fetching user data from CRM:", error);
    return {
      id: userId,
    };
  }
}
