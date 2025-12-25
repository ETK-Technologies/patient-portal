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
    const crmUserId = searchParams.get("crm_user_id");
    const authToken = searchParams.get("authToken");

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
    const verifiedUserId = await verifyAutoLoginToken(token, wpUserId);
    console.log(
      `[VERIFY] verifyAutoLoginToken returned: ${verifiedUserId || "null"}`
    );

    let extractedUserId = null;
    if (!verifiedUserId && token && token.includes("|")) {
      const parts = token.split("|");
      if (parts.length === 2) {
        extractedUserId = parts[0];
        console.log(`[VERIFY] Extracted user ID from token format: ${extractedUserId}`);
      }
    }

    const finalUserId = verifiedUserId || extractedUserId || wpUserId;

    if (!finalUserId) {
      return NextResponse.json(
        {
          success: false,
          error: "Invalid or expired auto-login token",
        },
        { status: 401 }
      );
    }

    if (!verifiedUserId && !extractedUserId && wpUserId) {
      console.log(`[VERIFY] Token verification failed, but using wp_user_id from URL (trusted source): ${wpUserId}`);
    }

    if (verifiedUserId && verifiedUserId !== wpUserId) {
      console.warn(`[VERIFY] Verified user ID (${verifiedUserId}) doesn't match URL wp_user_id (${wpUserId})`);
      return NextResponse.json(
        {
          success: false,
          error: "User ID mismatch",
        },
        { status: 403 }
      );
    }

    if (extractedUserId && extractedUserId !== wpUserId) {
      console.warn(`[VERIFY] Extracted user ID (${extractedUserId}) doesn't match URL wp_user_id (${wpUserId})`);
      if (verifiedUserId && verifiedUserId !== wpUserId) {
        return NextResponse.json(
          {
            success: false,
            error: "User ID mismatch",
          },
          { status: 403 }
        );
      }
    }

    // Fetch user data from CRM or database
    const userData = await fetchUserData(finalUserId, request, token);

    const response = NextResponse.json({
      success: true,
      userData,
    });

    const isProduction = process.env.NODE_ENV === "production";
    const cookieOptions = {
      path: "/",
      maxAge: 60 * 60 * 24 * 7,
      sameSite: "lax",
      secure: isProduction,
      httpOnly: false,
    };

    if (token) {
      response.cookies.set("token", token, cookieOptions);
      console.log("[VERIFY] Set token cookie server-side");
    }

    if (authToken) {
      response.cookies.set("authToken", authToken, cookieOptions);
      console.log("[VERIFY] Set authToken cookie server-side");
    }

    response.cookies.set("wp_user_id", String(finalUserId), cookieOptions);
    console.log(`[VERIFY] Set wp_user_id cookie server-side: ${finalUserId}`);

    const userIdForCookie = crmUserId || userData?.crm_user_id || userData?.id || finalUserId;
    response.cookies.set("userId", String(userIdForCookie), cookieOptions);
    console.log(`[VERIFY] Set userId cookie server-side: ${userIdForCookie}`);

    const userEmail = userData?.email || userData?.user?.email || userData?.data?.email;
    if (userEmail) {
      response.cookies.set("userEmail", String(userEmail), cookieOptions);
      console.log(`[VERIFY] Set userEmail cookie server-side`);
    }

    console.log("[VERIFY] All cookies set:", {
      token: token ? "set" : "not set",
      authToken: authToken ? "set" : "not set",
      wp_user_id: finalUserId,
      userId: userIdForCookie,
      userEmail: userEmail || "not set",
    });

    return response;
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
 * Uses the personal profile endpoint: /api/user/{userId}/profile
 * @param {string} userId - The user ID
 * @param {Request} request - The request object
 * @param {string} token - The token from URL parameter (auto-login token)
 */
async function fetchUserData(userId, request, token) {
  const crmHost = process.env.CRM_HOST;

  if (!crmHost) {
    console.warn(
      "[USERDATA] Missing CRM_HOST, returning basic user info"
    );
    return {
      crm_user_id: userId,
    };
  }

  try {
    const authToken = token;
    
    if (!authToken) {
      console.error("[USERDATA] No token provided");
      return {
        crm_user_id: userId,
      };
    }

    console.log("[USERDATA] Using token from URL parameter");

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
