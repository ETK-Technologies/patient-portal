import { NextResponse } from "next/server";
import { verifyAutoLoginToken } from "../auto-login-link/route";
import { authenticateWithCRM } from "../../utils/crmAuth";

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
      crm_user_id: userId,
    };
  }

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
        console.log("[USERDATA] Password decoded from base64");
      } else {
        apiPassword = apiPasswordEncoded;
        console.log("[USERDATA] Using password as plain text");
      }
    } catch (decodeError) {
      // If base64 decode fails, use as plain text
      apiPassword = apiPasswordEncoded;
      console.log(
        "[USERDATA] Base64 decode failed, using password as plain text"
      );
    }

    // Step 1: Authenticate with CRM to get auth token
    console.log("[USERDATA] Authenticating with CRM...");
    const authResult = await authenticateWithCRM(
      crmHost,
      apiUsername,
      apiPassword
    );

    if (!authResult.success) {
      console.error(
        `[USERDATA] CRM authentication failed: ${authResult.error}`
      );
      if (authResult.endpoint) {
        console.error(`[USERDATA] Failed endpoint: ${authResult.endpoint}`);
      }
      return {
        crm_user_id: userId,
      };
    }

    const authToken = authResult.token;
    console.log(
      `[USERDATA] Successfully obtained CRM auth token from ${authResult.endpoint}`
    );

    // Step 2: Fetch user profile from CRM
    // Use the same endpoint as the profile route: /api/user/{userId}/profile
    const profileUrl = `${crmHost}/api/user/${userId}/profile`;
    console.log(`[USERDATA] Fetching user profile from: ${profileUrl}`);

    const profileResponse = await fetch(profileUrl, {
      method: "GET",
      headers: {
        Authorization: `Bearer ${authToken}`,
        "Content-Type": "application/json",
        "is-patient-portal": "true",
      },
    });

    if (!profileResponse.ok) {
      console.error(
        `[USERDATA] Failed to fetch user profile: ${profileResponse.status} ${profileResponse.statusText}`
      );
      const errorText = await profileResponse.text();
      console.error(`[USERDATA] Error details: ${errorText}`);
      return {
        crm_user_id: userId,
      };
    }

    const responseData = await profileResponse.json();
    console.log("[USERDATA] Successfully fetched user profile data");
    console.log("[USERDATA] Response status:", responseData.status);

    // Extract user data from the CRM response structure
    // CRM returns: { status: true, message: "...", user: {...} }
    let userData = null;
    if (responseData.status && responseData.user) {
      userData = responseData.user;
      console.log("[USERDATA] ✓ Extracted user data from CRM response");
    } else if (responseData.data && responseData.data.user) {
      userData = responseData.data.user;
      console.log(
        "[USERDATA] ✓ Extracted user data from CRM response (data.user)"
      );
    } else if (responseData.data) {
      userData = responseData.data;
      console.log("[USERDATA] ✓ Using data as user data");
    } else {
      // Fallback: use response as-is
      userData = responseData;
      console.log("[USERDATA] ⚠ Using full response as user data");
    }

    // Ensure crm_user_id is set
    if (!userData.crm_user_id && userId) {
      userData.crm_user_id = userId;
    }

    // Return the user data from CRM
    return userData;
  } catch (error) {
    console.error("[USERDATA] Error fetching user data from CRM:", error);
    return {
      crm_user_id: userId,
    };
  }
}
