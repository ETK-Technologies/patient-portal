import { NextResponse } from "next/server";
import { getTokenFromCookie } from "@/app/api/utils/getTokenFromCookie";

/**
 * GET /api/messenger/subscription-thread
 *
 * Gets the messenger thread for a subscription's prescriber.
 * 
 * Query parameters:
 *   - subscriptionId: The subscription ID
 *
 * This endpoint:
 * 1. Gets userId from cookies
 * 2. Fetches subscription data to get prescription.crm_user_id
 * 3. Authenticates with messenger CRM to get token
 * 4. Searches for thread using participantIds (userId, prescriptionCrmUserId)
 * 5. Returns the chat URL in format: https://messenger.myrocky.ca/api/chats/{_id}?anotherAdminId=undefined
 *
 * Expected Response:
 * {
 *   "success": true,
 *   "chatUrl": "https://messenger.myrocky.ca/api/chats/1256?anotherAdminId=undefined",
 *   "chatId": 1256
 * }
 */
export async function GET(request) {
  try {
    const cookieHeader = request.headers.get("cookie") || "";
    let userId = null;
    let wpUserID = null;

    if (cookieHeader) {
      const userIdMatch = cookieHeader.match(/userId=([^;]+)/);
      if (userIdMatch) {
        userId = decodeURIComponent(userIdMatch[1].trim());
      }

      const wpUserIdMatch = cookieHeader.match(/wp_user_id=([^;]+)/);
      if (wpUserIdMatch) {
        wpUserID = decodeURIComponent(wpUserIdMatch[1].trim());
      }
    }

    console.log(
      `[MESSENGER_SUBSCRIPTION_THREAD] Cookie header: ${cookieHeader.substring(0, 100)}...`
    );
    console.log(`[MESSENGER_SUBSCRIPTION_THREAD] Extracted userId: ${userId || "not found"}`);
    console.log(`[MESSENGER_SUBSCRIPTION_THREAD] Extracted wp_user_id: ${wpUserID || "not found"}`);

    if (!userId) {
      return NextResponse.json(
        {
          success: false,
          error: "User not authenticated. userId not found in cookies.",
        },
        { status: 401 }
      );
    }

    if (!wpUserID) {
      return NextResponse.json(
        {
          success: false,
          error: "User not authenticated. wp_user_id not found in cookies.",
        },
        { status: 401 }
      );
    }

    const searchParams = request.nextUrl.searchParams;
    const subscriptionId = searchParams.get("subscriptionId");

    if (!subscriptionId) {
      return NextResponse.json(
        {
          success: false,
          error: "subscriptionId is required",
        },
        { status: 400 }
      );
    }

    console.log(`[MESSENGER_SUBSCRIPTION_THREAD] Subscription ID: ${subscriptionId}`);

    // Fetch subscription data to get prescription.crm_user_id
    const subscriptionData = await fetchSubscriptionData(wpUserID, subscriptionId, request);

    if (!subscriptionData.success) {
      return NextResponse.json(
        {
          success: false,
          error: subscriptionData.error || "Failed to fetch subscription data",
        },
        { status: subscriptionData.status || 500 }
      );
    }

    const subscriptions = subscriptionData.data?.subscriptions || subscriptionData.data?.data?.subscriptions || [];
    const subscription = subscriptions.find((sub) => sub.id === parseInt(subscriptionId));

    if (!subscription) {
      return NextResponse.json(
        {
          success: false,
          error: "Subscription not found",
        },
        { status: 404 }
      );
    }

    const prescriptionCrmUserId = subscription.prescription?.crm_prescriber_id;

    if (!prescriptionCrmUserId) {
      return NextResponse.json(
        {
          success: false,
          error: "No prescription found for this subscription",
        },
        { status: 404 }
      );
    }

    console.log(`[MESSENGER_SUBSCRIPTION_THREAD] Prescription CRM User ID: ${prescriptionCrmUserId}`);
    console.log(`[MESSENGER_SUBSCRIPTION_THREAD] User ID: ${userId}`);

    // Authenticate with messenger CRM
    const messengerBaseUrl = process.env.MESSENGER_BASE_URL || "https://messenger.myrocky.ca";
    const messengerEmail = process.env.MESSENGER_EMAIL;
    const messengerPassword = process.env.MESSENGER_PASSWORD;
    const messengerSecret = process.env.MESSENGER_SECRET;

    if (!messengerEmail || !messengerPassword || !messengerSecret) {
      console.error("[MESSENGER_SUBSCRIPTION_THREAD] Missing required environment variables");
      return NextResponse.json(
        {
          success: false,
          error: "Server configuration error. Missing messenger credentials.",
        },
        { status: 500 }
      );
    }

    console.log("[MESSENGER_SUBSCRIPTION_THREAD] Authenticating with messenger CRM...");
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
        `[MESSENGER_SUBSCRIPTION_THREAD] Authentication failed: ${authResponse.status} ${authResponse.statusText}`
      );
      console.error(`[MESSENGER_SUBSCRIPTION_THREAD] Error details: ${errorText}`);
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
      console.error("[MESSENGER_SUBSCRIPTION_THREAD] No token received from authentication");
      return NextResponse.json(
        {
          success: false,
          error: "No authentication token received",
        },
        { status: 500 }
      );
    }

    console.log("[MESSENGER_SUBSCRIPTION_THREAD] Successfully authenticated with messenger CRM");

    // Search for thread
    const participantIds = `${userId},${prescriptionCrmUserId}`;
    const searchUrl = `${messengerBaseUrl}/crm-api/threads/search?participantIds=${participantIds}`;
    
    console.log(`[MESSENGER_SUBSCRIPTION_THREAD] Searching for thread: ${searchUrl}`);

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
        `[MESSENGER_SUBSCRIPTION_THREAD] Thread search failed: ${searchResponse.status} ${searchResponse.statusText}`
      );
      console.error(`[MESSENGER_SUBSCRIPTION_THREAD] Error details: ${errorText}`);
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
    console.log("[MESSENGER_SUBSCRIPTION_THREAD] Thread search successful");

    // Extract chat ID from response
    // The response structure is: { chats: [{ _id: 1256, ... }] }
    let chatId = null;
    if (threadData.chats && Array.isArray(threadData.chats) && threadData.chats.length > 0) {
      // Primary format: chats is an array
      chatId = threadData.chats[0]._id;
    } else if (threadData.data?.chats && Array.isArray(threadData.data.chats) && threadData.data.chats.length > 0) {
      // Alternative format: data.chats is an array
      chatId = threadData.data.chats[0]._id;
    } else if (threadData.chats?._id) {
      // chats is an object with _id
      chatId = threadData.chats._id;
    } else if (threadData._id) {
      // Direct _id on threadData
      chatId = threadData._id;
    }
    
    if (!chatId) {
      console.warn("[MESSENGER_SUBSCRIPTION_THREAD] No chat ID found in thread data");
      return NextResponse.json(
        {
          success: false,
          error: "No chat found for these participants",
        },
        { status: 404 }
      );
    }

    console.log(`[MESSENGER_SUBSCRIPTION_THREAD] Chat ID found: ${chatId}`);
    
    // Get user session to login and get the authentication token
    console.log("[MESSENGER_SUBSCRIPTION_THREAD] Getting user session with thread_id...");
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
    let userSessionData = null;
    let loginURL = null;
    
    if (userSessionResponse.ok) {
      userSessionData = await userSessionResponse.json();
      console.log(`[MESSENGER_SUBSCRIPTION_THREAD] User session created successfully`);
      
      if (!userSessionData.loginURL) {
        console.error("[MESSENGER_SUBSCRIPTION_THREAD] No loginURL received from user session");
        return NextResponse.json(
          {
            success: false,
            error: "No loginURL received from messenger CRM",
          },
          { status: 500 }
        );
      }

      // Extract the base URL and token from loginURL
      // loginURL format: "messenger.myrocky.ca?q={token}" or "https://messenger.myrocky.ca?q={token}"
      loginURL = userSessionData.loginURL;
      
      // Parse the loginURL to extract the base URL and token
      let baseUrl = messengerBaseUrl;
      let authToken = null;
      
      // Extract token from query parameter 'q'
      const urlMatch = loginURL.match(/[?&]q=([^&]+)/);
      if (urlMatch) {
        authToken = urlMatch[1];
        console.log(`[MESSENGER_SUBSCRIPTION_THREAD] Extracted auth token from loginURL`);
      } else if (userSessionData.token) {
        // Fallback to token from response
        authToken = userSessionData.token;
        console.log(`[MESSENGER_SUBSCRIPTION_THREAD] Using token directly from response`);
      }
      
      // Extract base URL from loginURL (remove query parameters)
      const urlWithoutQuery = loginURL.split('?')[0];
      if (urlWithoutQuery.startsWith('http://') || urlWithoutQuery.startsWith('https://')) {
        baseUrl = urlWithoutQuery;
      } else {
        // If no protocol, add https://
        baseUrl = `https://${urlWithoutQuery}`;
      }
      
      // Construct the chat URL with authentication token
      // Try multiple approaches since messenger portal may handle auth differently
      if (authToken) {
        // Ensure baseUrl doesn't have trailing slash
        const cleanBaseUrl = baseUrl.replace(/\/$/, '');
        
        // Approach 1: Append chat path with token (primary method)
        chatUrl = `${cleanBaseUrl}/api/chats/${chatId}?anotherAdminId=undefined&q=${authToken}`;
        console.log(`[MESSENGER_SUBSCRIPTION_THREAD] Constructed chat URL (method 1): ${chatUrl.substring(0, 100)}...`);
        
        // Note: If this doesn't work, the messenger portal may require:
        // - Session cookie set via loginURL first
        // - Token in a different parameter name
        // - Different URL format
      } else {
        // If no token, still construct URL but it may require manual login
        const cleanBaseUrl = baseUrl.replace(/\/$/, '');
        chatUrl = `${cleanBaseUrl}/api/chats/${chatId}?anotherAdminId=undefined`;
        console.warn("[MESSENGER_SUBSCRIPTION_THREAD] No auth token available, chat URL may require manual login");
      }
    } else {
      const errorText = await userSessionResponse.text();
      console.error("[MESSENGER_SUBSCRIPTION_THREAD] Failed to create user session:", errorText);
      return NextResponse.json(
        {
          success: false,
          error: "Failed to create user session",
          details: errorText,
        },
        { status: userSessionResponse.status || 500 }
      );
    }
    
    if (!chatUrl) {
      return NextResponse.json(
        {
          success: false,
          error: "Failed to construct chat URL",
        },
        { status: 500 }
      );
    }
    
    console.log(`[MESSENGER_SUBSCRIPTION_THREAD] Final chat URL: ${chatUrl}`);

    // Also return the loginURL and direct chat URL for fallback
    let formattedLoginURL = loginURL || null;
    if (formattedLoginURL && !formattedLoginURL.startsWith("http://") && !formattedLoginURL.startsWith("https://")) {
      formattedLoginURL = `https://${formattedLoginURL}`;
    }
    
    console.log(`[MESSENGER_SUBSCRIPTION_THREAD] Formatted loginURL: ${formattedLoginURL}`);
    
    // Direct chat URL without redirect (alternative approach)
    const directChatUrl = `${messengerBaseUrl}/api/chats/${chatId}?anotherAdminId=undefined`;

    const responseData = {
      success: true,
      chatUrl: chatUrl, // Primary: URL with redirect parameter
      loginURL: formattedLoginURL, // For authentication
      directChatUrl: directChatUrl, // Fallback: direct chat URL
      chatId: chatId,
      data: threadData,
    };
    
    console.log(`[MESSENGER_SUBSCRIPTION_THREAD] Returning response with loginURL: ${responseData.loginURL ? 'present' : 'missing'}`);

    return NextResponse.json(responseData);
  } catch (error) {
    console.error("[MESSENGER_SUBSCRIPTION_THREAD] Error:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Failed to get subscription thread",
        details: error.message,
      },
      { status: 500 }
    );
  }
}

/**
 * Fetch subscription data from CRM
 */
async function fetchSubscriptionData(wpUserID, subscriptionId, request) {
  const crmHost = process.env.CRM_HOST;

  if (!crmHost) {
    console.error("[MESSENGER_SUBSCRIPTION_THREAD] Missing CRM_HOST");
    return {
      success: false,
      error: "CRM configuration missing",
      status: 500,
    };
  }

  try {
    const authToken = getTokenFromCookie(request);
    
    if (!authToken) {
      console.error("[MESSENGER_SUBSCRIPTION_THREAD] No token found in cookie");
      return {
        success: false,
        error: "Authentication token not found",
        status: 401,
      };
    }

    // Fetch subscriptions from CRM
    const subscriptionsUrl = `${crmHost}/api/user/subscriptions/${wpUserID}`;
    console.log(
      `[MESSENGER_SUBSCRIPTION_THREAD] Fetching subscriptions from: ${subscriptionsUrl}`
    );

    const subscriptionsResponse = await fetch(subscriptionsUrl, {
      method: "GET",
      headers: {
        Authorization: `Bearer ${authToken}`,
        "is-patient-portal": "true",
      },
    });

    if (!subscriptionsResponse.ok) {
      const errorText = await subscriptionsResponse.text();
      console.error(
        `[MESSENGER_SUBSCRIPTION_THREAD] Failed to fetch subscriptions: ${subscriptionsResponse.status} ${subscriptionsResponse.statusText}`
      );
      console.error(`[MESSENGER_SUBSCRIPTION_THREAD] Error details: ${errorText}`);
      return {
        success: false,
        error: `Failed to fetch: ${subscriptionsResponse.status} ${subscriptionsResponse.statusText}`,
        status: subscriptionsResponse.status,
      };
    }

    const responseData = await subscriptionsResponse.json();
    console.log("[MESSENGER_SUBSCRIPTION_THREAD] CRM response received");

    return {
      success: true,
      data: responseData,
    };
  } catch (error) {
    console.error(
      "[MESSENGER_SUBSCRIPTION_THREAD] Error fetching subscriptions from CRM:",
      error
    );
    return {
      success: false,
      error: error.message || "Failed to fetch subscription data",
      status: 500,
    };
  }
}

