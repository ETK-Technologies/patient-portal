import { NextResponse } from "next/server";

/**
 * GET /api/user/profile
 *
 * Fetches user profile data from CRM.
 * Returns user information from the CRM personal profile endpoint.
 *
 * Expected Response:
 * {
 *   "success": true,
 *   "userData": {
 *     "id": "123",
 *     "name": "John Doe",
 *     "email": "user@example.com",
 *     ...
 *   }
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
      `[USER_PROFILE] Cookie header: ${cookieHeader.substring(0, 100)}...`
    );
    console.log(`[USER_PROFILE] Extracted userId: ${userId || "not found"}`);

    if (!userId) {
      return NextResponse.json(
        {
          success: false,
          error: "User not authenticated",
        },
        { status: 401 }
      );
    }

    console.log(`[USER_PROFILE] Fetching profile for user: ${userId}`);

    // Fetch user data from CRM
    const userData = await fetchUserData(userId);

    return NextResponse.json({
      success: true,
      userData,
    });
  } catch (error) {
    console.error("Error fetching user profile:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Failed to fetch user profile",
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
      "[USER_PROFILE] Missing CRM credentials, returning basic user info"
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
        "[USER_PROFILE] Failed to decode base64 password:",
        decodeError
      );
      return {
        id: userId,
      };
    }

    // Step 1: Authenticate with CRM to get auth token
    console.log("[USER_PROFILE] Authenticating with CRM...");
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
        `[USER_PROFILE] CRM authentication failed: ${loginResponse.status}`
      );
      return {
        id: userId,
      };
    }

    const loginData = await loginResponse.json();

    if (!loginData.success || !loginData.data?.token) {
      console.error("[USER_PROFILE] CRM authentication token not found");
      return {
        id: userId,
      };
    }

    const authToken = loginData.data.token;
    console.log("[USER_PROFILE] Successfully obtained CRM auth token");

    // Step 2: Fetch user profile from CRM
    const profileUrl = `${crmHost}/api/crm-users/${userId}/edit/personal-profile`;
    console.log(`[USER_PROFILE] Fetching user profile from: ${profileUrl}`);

    const profileResponse = await fetch(profileUrl, {
      method: "GET",
      headers: {
        Authorization: `Bearer ${authToken}`,
        "Content-Type": "application/json",
      },
    });

    if (!profileResponse.ok) {
      console.error(
        `[USER_PROFILE] Failed to fetch user profile: ${profileResponse.status} ${profileResponse.statusText}`
      );
      const errorText = await profileResponse.text();
      console.error(`[USER_PROFILE] Error details: ${errorText}`);
      return {
        id: userId,
      };
    }

    const userData = await profileResponse.json();
    console.log("[USER_PROFILE] Successfully fetched user profile data");

    // Return the user data from CRM
    return userData;
  } catch (error) {
    console.error("[USER_PROFILE] Error fetching user data from CRM:", error);
    return {
      id: userId,
    };
  }
}
