import { NextResponse } from "next/server";

/**
 * GET /api/messenger/unread-count
 *
 * Fetches unread messages count from messenger API.
 * This endpoint:
 * 1. Authenticates with messenger.myrocky.ca/crm-api/sessions to get a CRM token
 * 2. Gets user session token by calling messenger.myrocky.ca/crm-api/user-sessions
 * 3. Uses that user session token to call messenger.myrocky.ca/api/messages/unread
 * 4. Returns the unread messages count
 *
 * Expected Response:
 * {
 *   "success": true,
 *   "count": 9
 * }
 */
export async function GET(request) {
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
      `[MESSENGER_UNREAD_COUNT] Cookie header: ${cookieHeader.substring(0, 100)}...`
    );
    console.log(`[MESSENGER_UNREAD_COUNT] Extracted userId: ${userId || "not found"}`);

    if (!userId) {
      return NextResponse.json(
        {
          success: false,
          error: "User not authenticated. userId not found in cookies.",
          count: 0,
        },
        { status: 401 }
      );
    }

    const messengerBaseUrl = process.env.MESSENGER_BASE_URL || "https://messenger.myrocky.ca";
    const messengerEmail = process.env.MESSENGER_EMAIL;
    const messengerPassword = process.env.MESSENGER_PASSWORD;
    const messengerSecret = process.env.MESSENGER_SECRET;

    if (!messengerEmail || !messengerPassword || !messengerSecret) {
      console.error("[MESSENGER_UNREAD_COUNT] Missing required environment variables");
      return NextResponse.json(
        {
          success: false,
          error: "Server configuration error. Missing messenger credentials.",
          count: 0,
        },
        { status: 500 }
      );
    }

    console.log("[MESSENGER_UNREAD_COUNT] Step 1: Authenticating with messenger CRM...");
    const authUrl = `${messengerBaseUrl}/crm-api/sessions`;
    
    const authResponse = await fetch(authUrl, {
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

    if (!authResponse.ok) {
      const errorText = await authResponse.text();
      console.error(
        `[MESSENGER_UNREAD_COUNT] Authentication failed: ${authResponse.status} ${authResponse.statusText}`
      );
      console.error(`[MESSENGER_UNREAD_COUNT] Error details: ${errorText}`);
      return NextResponse.json(
        {
          success: false,
          error: "Failed to authenticate with messenger CRM",
          details: errorText,
          count: 0,
        },
        { status: authResponse.status }
      );
    }

    const authData = await authResponse.json();
    const crmToken = authData.token;

    if (!crmToken) {
      console.error("[MESSENGER_UNREAD_COUNT] No token received from authentication");
      return NextResponse.json(
        {
          success: false,
          error: "No authentication token received",
          count: 0,
        },
        { status: 500 }
      );
    }

    console.log("[MESSENGER_UNREAD_COUNT] Successfully authenticated with messenger CRM");
    console.log("[MESSENGER_UNREAD_COUNT] Step 2: Getting user session...");
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
        `[MESSENGER_UNREAD_COUNT] User session failed: ${userSessionResponse.status} ${userSessionResponse.statusText}`
      );
      console.error(`[MESSENGER_UNREAD_COUNT] Error details: ${errorText}`);
      return NextResponse.json(
        {
          success: false,
          error: "Failed to get user session",
          details: errorText,
          count: 0,
        },
        { status: userSessionResponse.status }
      );
    }

    const userSessionData = await userSessionResponse.json();
    console.log("[MESSENGER_UNREAD_COUNT] User session obtained successfully");

    if (!userSessionData.token) {
      console.error("[MESSENGER_UNREAD_COUNT] No token received from user session");
      return NextResponse.json(
        {
          success: false,
          error: "No user session token received",
          count: 0,
        },
        { status: 500 }
      );
    }

    const userSessionToken = userSessionData.token;
    console.log("[MESSENGER_UNREAD_COUNT] Step 3: Fetching unread messages count...");
    
    const unreadMessagesUrl = `${messengerBaseUrl}/api/messages/unread`;
    console.log(`[MESSENGER_UNREAD_COUNT] Calling: ${unreadMessagesUrl}`);

    const messagesResponse = await fetch(unreadMessagesUrl, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        Secret: messengerSecret,
        Authorization: `Bearer ${userSessionToken}`,
      },
    });

    if (!messagesResponse.ok) {
      const errorText = await messagesResponse.text();
      console.error(
        `[MESSENGER_UNREAD_COUNT] Failed to fetch unread messages: ${messagesResponse.status} ${messagesResponse.statusText}`
      );
      console.error(`[MESSENGER_UNREAD_COUNT] Error details: ${errorText}`);
      return NextResponse.json(
        {
          success: false,
          error: "Failed to fetch unread messages",
          details: errorText,
          count: 0,
        },
        { status: messagesResponse.status }
      );
    }

    const messagesData = await messagesResponse.json();
    console.log("[MESSENGER_UNREAD_COUNT] Unread messages response received");
    console.log(`[MESSENGER_UNREAD_COUNT] Unread messages count: ${messagesData.count || 0}`);

    return NextResponse.json({
      success: true,
      count: messagesData.count || 0,
    });
  } catch (error) {
    console.error("[MESSENGER_UNREAD_COUNT] Error:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Internal server error",
        details: error.message,
        count: 0,
      },
      { status: 500 }
    );
  }
}

