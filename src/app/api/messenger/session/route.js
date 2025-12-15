import { NextResponse } from "next/server";

/**
 * POST /api/messenger/session
 *
 * Authenticates with the messenger CRM API and returns a login URL.
 * This endpoint:
 * 1. Authenticates with messenger.myrocky.ca/crm-api/sessions to get a CRM token
 * 2. Uses that token to call messenger.myrocky.ca/crm-api/user-sessions to get a login URL
 * 3. Returns the loginURL to the client
 *
 * Expected Request:
 * - userId should be in cookies (set during auto-login)
 *
 * Expected Response:
 * {
 *   "success": true,
 *   "loginURL": "messenger.myrocky.ca?q=...",
 *   "token": "..."
 * }
 */
export async function POST(request) {
  try {
    const cookieHeader = request.headers.get("cookie") || "";
    let userId = null;

    if (cookieHeader) {
      const match = cookieHeader.match(/userId=([^;]+)/);
      if (match) {
        userId = decodeURIComponent(match[1].trim());
      }
    }

    console.log(
      `[MESSENGER_SESSION] Cookie header: ${cookieHeader.substring(0, 100)}...`
    );
    console.log(`[MESSENGER_SESSION] Extracted userId: ${userId || "not found"}`);

    if (!userId) {
      return NextResponse.json(
        {
          success: false,
          error: "User not authenticated. userId not found in cookies.",
        },
        { status: 401 }
      );
    }

    const messengerEmail = process.env.MESSENGER_EMAIL;
    const messengerPassword = process.env.MESSENGER_PASSWORD;
    const messengerSecret = process.env.MESSENGER_SECRET;
    const messengerBaseUrl = process.env.MESSENGER_BASE_URL || "https://messenger.myrocky.ca";

    if (!messengerEmail || !messengerPassword || !messengerSecret) {
      console.error("[MESSENGER_SESSION] Missing required environment variables");
      return NextResponse.json(
        {
          success: false,
          error: "Server configuration error. Missing messenger credentials.",
        },
        { status: 500 }
      );
    }

    console.log("[MESSENGER_SESSION] Step 1: Authenticating with messenger CRM...");
    const sessionUrl = `${messengerBaseUrl}/crm-api/sessions`;
    
    const sessionResponse = await fetch(sessionUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Secret: messengerSecret,
      },
      body: JSON.stringify({
        email: messengerEmail,
        password: messengerPassword,
      }),
    });

    if (!sessionResponse.ok) {
      const errorText = await sessionResponse.text();
      console.error(
        `[MESSENGER_SESSION] Authentication failed: ${sessionResponse.status} ${sessionResponse.statusText}`
      );
      console.error(`[MESSENGER_SESSION] Error details: ${errorText}`);
      return NextResponse.json(
        {
          success: false,
          error: "Failed to authenticate with messenger CRM",
          details: errorText,
        },
        { status: sessionResponse.status }
      );
    }

    const sessionData = await sessionResponse.json();
    console.log("[MESSENGER_SESSION] Authentication successful");

    if (!sessionData.token) {
      console.error("[MESSENGER_SESSION] No token received from authentication");
      return NextResponse.json(
        {
          success: false,
          error: "No token received from messenger CRM",
        },
        { status: 500 }
      );
    }

    const crmToken = sessionData.token;
    console.log("[MESSENGER_SESSION] CRM token obtained");

    console.log("[MESSENGER_SESSION] Step 2: Getting user session...");
    const userSessionUrl = `${messengerBaseUrl}/crm-api/user-sessions`;
    
    const userSessionResponse = await fetch(userSessionUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Secret: messengerSecret,
        Authorization: `Bearer ${crmToken}`,
      },
      body: JSON.stringify({
        user_id: userId,
        thread_id: "",
      }),
    });

    if (!userSessionResponse.ok) {
      const errorText = await userSessionResponse.text();
      console.error(
        `[MESSENGER_SESSION] User session failed: ${userSessionResponse.status} ${userSessionResponse.statusText}`
      );
      console.error(`[MESSENGER_SESSION] Error details: ${errorText}`);
      return NextResponse.json(
        {
          success: false,
          error: "Failed to get user session",
          details: errorText,
        },
        { status: userSessionResponse.status }
      );
    }

    const userSessionData = await userSessionResponse.json();
    console.log("[MESSENGER_SESSION] User session obtained successfully");

    if (!userSessionData.loginURL) {
      console.error("[MESSENGER_SESSION] No loginURL received from user session");
      return NextResponse.json(
        {
          success: false,
          error: "No loginURL received from messenger CRM",
        },
        { status: 500 }
      );
    }

    let loginURL = userSessionData.loginURL;
    if (!loginURL.startsWith("http://") && !loginURL.startsWith("https://")) {
      loginURL = `https://${loginURL}`;
    }

    console.log(`[MESSENGER_SESSION] Login URL generated: ${loginURL}`);

    return NextResponse.json({
      success: true,
      loginURL: loginURL,
      token: userSessionData.token,
      user: userSessionData.user,
    });
  } catch (error) {
    console.error("[MESSENGER_SESSION] Error:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Internal server error",
        details: error.message,
      },
      { status: 500 }
    );
  }
}
