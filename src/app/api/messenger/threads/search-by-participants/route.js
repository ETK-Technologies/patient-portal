import { NextResponse } from "next/server";

/**
 * GET /api/messenger/threads/search-by-participants
 *
 * Searches for a messenger thread by participant IDs and returns the chat URL.
 * 
 * Query parameters:
 *   - participantIds: Comma-separated participant IDs (e.g., "107913,25944")
 *
 * This endpoint:
 * 1. Gets userId from cookies
 * 2. Calls messenger API: https://messenger.myrocky.ca/crm-api/threads/search?participantIds={participantIds}
 * 3. Returns the chat URL to open in a new tab
 *
 * Expected Response:
 * {
 *   "success": true,
 *   "chatUrl": "https://messenger.myrocky.ca/chat/{chatId}",
 *   "data": { ... }
 * }
 */
export async function GET(request) {
  try {
    const cookieHeader = request.headers.get("cookie") || "";
    let userId = null;

    if (cookieHeader) {
      const userIdMatch = cookieHeader.match(/userId=([^;]+)/);
      if (userIdMatch) {
        userId = decodeURIComponent(userIdMatch[1].trim());
      }
    }

    console.log(
      `[MESSENGER_SEARCH_BY_PARTICIPANTS] Cookie header: ${cookieHeader.substring(0, 100)}...`
    );
    console.log(`[MESSENGER_SEARCH_BY_PARTICIPANTS] Extracted userId: ${userId || "not found"}`);

    if (!userId) {
      return NextResponse.json(
        {
          success: false,
          error: "User not authenticated. userId not found in cookies.",
        },
        { status: 401 }
      );
    }

    const searchParams = request.nextUrl.searchParams;
    const participantIdsParam = searchParams.get("participantIds");

    if (!participantIdsParam) {
      return NextResponse.json(
        {
          success: false,
          error: "participantIds is required",
        },
        { status: 400 }
      );
    }

    console.log(`[MESSENGER_SEARCH_BY_PARTICIPANTS] Participant IDs: ${participantIdsParam}`);

    const messengerBaseUrl = process.env.MESSENGER_BASE_URL || "https://messenger.myrocky.ca";
    const messengerEmail = process.env.MESSENGER_EMAIL;
    const messengerPassword = process.env.MESSENGER_PASSWORD;
    const messengerSecret = process.env.MESSENGER_SECRET;

    if (!messengerEmail || !messengerPassword || !messengerSecret) {
      console.error("[MESSENGER_SEARCH_BY_PARTICIPANTS] Missing required environment variables");
      return NextResponse.json(
        {
          success: false,
          error: "Server configuration error. Missing messenger credentials.",
        },
        { status: 500 }
      );
    }

    console.log("[MESSENGER_SEARCH_BY_PARTICIPANTS] Authenticating with messenger CRM...");
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
        `[MESSENGER_SEARCH_BY_PARTICIPANTS] Authentication failed: ${authResponse.status} ${authResponse.statusText}`
      );
      console.error(`[MESSENGER_SEARCH_BY_PARTICIPANTS] Error details: ${errorText}`);
      return NextResponse.json(
        {
          success: false,
          error: "Failed to authenticate with messenger",
          details: errorText,
        },
        { status: authResponse.status }
      );
    }

    const authData = await authResponse.json();
    const crmToken = authData.token;

    if (!crmToken) {
      console.error("[MESSENGER_SEARCH_BY_PARTICIPANTS] No token received from authentication");
      return NextResponse.json(
        {
          success: false,
          error: "No authentication token received",
        },
        { status: 500 }
      );
    }

    console.log("[MESSENGER_SEARCH_BY_PARTICIPANTS] Successfully authenticated with messenger CRM");

    const searchUrl = `${messengerBaseUrl}/crm-api/threads/search?participantIds=${participantIdsParam}`;
    
    console.log(`[MESSENGER_SEARCH_BY_PARTICIPANTS] Searching for thread: ${searchUrl}`);

    const searchResponse = await fetch(searchUrl, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        Secret: messengerSecret,
        Authorization: `Bearer ${crmToken}`,
      },
    });

    if (!searchResponse.ok) {
      const errorText = await searchResponse.text();
      console.error(
        `[MESSENGER_SEARCH_BY_PARTICIPANTS] Thread search failed: ${searchResponse.status} ${searchResponse.statusText}`
      );
      console.error(`[MESSENGER_SEARCH_BY_PARTICIPANTS] Error details: ${errorText}`);
      return NextResponse.json(
        {
          success: false,
          error: "Failed to search for thread",
          details: errorText,
        },
        { status: searchResponse.status }
      );
    }

    const threadData = await searchResponse.json();
    console.log("[MESSENGER_SEARCH_BY_PARTICIPANTS] Thread search successful");

    const chatId = threadData?.chats?._id || threadData?.data?.chats?._id || threadData?._id;
    
    if (!chatId) {
      console.warn("[MESSENGER_SEARCH_BY_PARTICIPANTS] No chat ID found in thread data");
      return NextResponse.json(
        {
          success: false,
          error: "No chat found for these participants",
        },
        { status: 404 }
      );
    }

    console.log(`[MESSENGER_SEARCH_BY_PARTICIPANTS] Chat ID found: ${chatId}`);
    
    console.log("[MESSENGER_SEARCH_BY_PARTICIPANTS] Getting user session with thread_id...");
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
        thread_id: chatId,
      }),
    });

    let chatUrl = null;
    if (userSessionResponse.ok) {
      const userSessionData = await userSessionResponse.json();
      if (userSessionData.loginURL) {
        chatUrl = userSessionData.loginURL;
        if (!chatUrl.startsWith("http://") && !chatUrl.startsWith("https://")) {
          chatUrl = `https://${chatUrl}`;
        }
        console.log(`[MESSENGER_SEARCH_BY_PARTICIPANTS] Login URL obtained: ${chatUrl}`);
      }
    } else {
      console.warn("[MESSENGER_SEARCH_BY_PARTICIPANTS] Failed to get user session, using direct chat URL");
      chatUrl = `${messengerBaseUrl}/chat/${chatId}`;
    }
    
    if (!chatUrl) {
      chatUrl = `${messengerBaseUrl}/chat/${chatId}`;
    }
    
    console.log(`[MESSENGER_SEARCH_BY_PARTICIPANTS] Final chat URL: ${chatUrl}`);

    return NextResponse.json({
      success: true,
      chatUrl: chatUrl,
      chatId: chatId,
      data: threadData,
    });
  } catch (error) {
    console.error("[MESSENGER_SEARCH_BY_PARTICIPANTS] Error:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Failed to search for thread",
        details: error.message,
      },
      { status: 500 }
    );
  }
}

