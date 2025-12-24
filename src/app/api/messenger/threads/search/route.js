import { NextResponse } from "next/server";
import { authenticateWithCRM } from "../../../utils/crmAuth";

/**
 * GET /api/messenger/threads/search
 *
 * Searches for a messenger thread between the user and their provider.
 * 
 * Query parameters:
 *   - subscriptionId: The subscription ID to get the prescription crm_user_id from
 *
 * This endpoint:
 * 1. Gets userId from cookies
 * 2. Fetches subscription data to get prescription.crm_user_id
 * 3. Calls messenger API: https://messenger.myrocky.ca/crm-api/threads/search?participantIds={crm_user_id},{userId}
 *
 * Expected Response:
 * {
 *   "success": true,
 *   "data": { ... } // Response from messenger API
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
      `[MESSENGER_THREAD_SEARCH] Cookie header: ${cookieHeader.substring(0, 100)}...`
    );
    console.log(`[MESSENGER_THREAD_SEARCH] Extracted userId: ${userId || "not found"}`);
    console.log(`[MESSENGER_THREAD_SEARCH] Extracted wp_user_id: ${wpUserID || "not found"}`);

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

    console.log(`[MESSENGER_THREAD_SEARCH] Subscription ID: ${subscriptionId}`);

    const subscriptionData = await fetchSubscriptionData(wpUserID, subscriptionId);

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

    const prescriptionCrmUserId = subscription.prescription?.crm_user_id;

    if (!prescriptionCrmUserId) {
      return NextResponse.json(
        {
          success: false,
          error: "No prescription found for this subscription",
        },
        { status: 404 }
      );
    }

    console.log(`[MESSENGER_THREAD_SEARCH] Prescription CRM User ID: ${prescriptionCrmUserId}`);
    console.log(`[MESSENGER_THREAD_SEARCH] User ID: ${userId}`);

    const messengerBaseUrl = process.env.MESSENGER_BASE_URL || "https://messenger.myrocky.ca";
    const messengerEmail = process.env.MESSENGER_EMAIL;
    const messengerPassword = process.env.MESSENGER_PASSWORD;
    const messengerSecret = process.env.MESSENGER_SECRET;

    if (!messengerEmail || !messengerPassword || !messengerSecret) {
      console.error("[MESSENGER_THREAD_SEARCH] Missing required environment variables");
      return NextResponse.json(
        {
          success: false,
          error: "Server configuration error. Missing messenger credentials.",
        },
        { status: 500 }
      );
    }

    console.log("[MESSENGER_THREAD_SEARCH] Authenticating with messenger CRM...");
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
        `[MESSENGER_THREAD_SEARCH] Authentication failed: ${authResponse.status} ${authResponse.statusText}`
      );
      console.error(`[MESSENGER_THREAD_SEARCH] Error details: ${errorText}`);
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
      console.error("[MESSENGER_THREAD_SEARCH] No token received from authentication");
      return NextResponse.json(
        {
          success: false,
          error: "No authentication token received",
        },
        { status: 500 }
      );
    }

    console.log("[MESSENGER_THREAD_SEARCH] Successfully authenticated with messenger CRM");

    const participantIds = `${prescriptionCrmUserId},${userId}`;
    const searchUrl = `${messengerBaseUrl}/crm-api/threads/search?participantIds=${participantIds}`;
    
    console.log(`[MESSENGER_THREAD_SEARCH] Searching for thread: ${searchUrl}`);

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
        `[MESSENGER_THREAD_SEARCH] Thread search failed: ${searchResponse.status} ${searchResponse.statusText}`
      );
      console.error(`[MESSENGER_THREAD_SEARCH] Error details: ${errorText}`);
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
    console.log("[MESSENGER_THREAD_SEARCH] Thread search successful");

    let chatData = null;
    const chatId = threadData?.chats?._id || threadData?.data?.chats?._id || threadData?._id;
    
    if (chatId) {
      console.log(`[MESSENGER_THREAD_SEARCH] Chat ID found: ${chatId}`);
      const chatsUrl = `${messengerBaseUrl}/api/chats/${chatId}?anotherAdminId=undefined`;
      
      console.log(`[MESSENGER_THREAD_SEARCH] Calling chats API: ${chatsUrl}`);
      
      try {
        const chatsResponse = await fetch(chatsUrl, {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
            Secret: messengerSecret,
            Authorization: `Bearer ${crmToken}`,
          },
        });

        if (chatsResponse.ok) {
          chatData = await chatsResponse.json();
          console.log("[MESSENGER_THREAD_SEARCH] Chats API call successful");
        } else {
          const errorText = await chatsResponse.text();
          console.warn(
            `[MESSENGER_THREAD_SEARCH] Chats API call failed: ${chatsResponse.status} ${chatsResponse.statusText}`
          );
          console.warn(`[MESSENGER_THREAD_SEARCH] Error details: ${errorText}`);
        }
      } catch (chatsError) {
        console.warn(
          "[MESSENGER_THREAD_SEARCH] Error calling chats API:",
          chatsError
        );
      }
    } else {
      console.warn("[MESSENGER_THREAD_SEARCH] No chat ID found in thread data");
    }

    return NextResponse.json({
      success: true,
      data: threadData,
      chatData: chatData,
    });
  } catch (error) {
    console.error("[MESSENGER_THREAD_SEARCH] Error:", error);
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

/**
 * Fetch subscription data from CRM
 */
async function fetchSubscriptionData(wpUserID, subscriptionId) {
  const crmHost = process.env.CRM_HOST;
  const apiUsername = process.env.CRM_API_USERNAME;
  const apiPasswordEncoded = process.env.CRM_API_PASSWORD;

  if (!crmHost || !apiUsername || !apiPasswordEncoded) {
    console.error("[MESSENGER_THREAD_SEARCH] Missing CRM credentials");
    return {
      success: false,
      error: "CRM configuration missing",
      status: 500,
    };
  }

  try {
    let apiPassword;
    try {
      const decoded = Buffer.from(apiPasswordEncoded, "base64").toString("utf8");
      const hasNonPrintable = /[\x00-\x08\x0E-\x1F\x7F-\x9F]/.test(decoded);
      const isSameAsInput = decoded === apiPasswordEncoded;

      if (!hasNonPrintable && !isSameAsInput && decoded.length > 0) {
        apiPassword = decoded;
      } else {
        apiPassword = apiPasswordEncoded;
      }
    } catch (decodeError) {
      apiPassword = apiPasswordEncoded;
    }

    const authResult = await authenticateWithCRM(
      crmHost,
      apiUsername,
      apiPassword
    );

    if (!authResult.success) {
      console.error(
        `[MESSENGER_THREAD_SEARCH] CRM authentication failed: ${authResult.error}`
      );
      return {
        success: false,
        error: "CRM authentication failed",
        status: 500,
      };
    }

    const authToken = authResult.token;

    const subscriptionsUrl = `${crmHost}/api/user/subscriptions/${wpUserID}`;
    console.log(
      `[MESSENGER_THREAD_SEARCH] Fetching subscriptions from: ${subscriptionsUrl}`
    );

    const subscriptionsResponse = await fetch(subscriptionsUrl, {
      method: "GET",
      headers: {
        Authorization: `Bearer ${authToken}`,
        "Content-Type": "application/json",
        "is-patient-portal": "true",
      },
    });

    if (!subscriptionsResponse.ok) {
      const errorText = await subscriptionsResponse.text();
      console.error(
        `[MESSENGER_THREAD_SEARCH] Failed to fetch subscriptions: ${subscriptionsResponse.status}`
      );
      return {
        success: false,
        error: `Failed to fetch subscriptions: ${subscriptionsResponse.status}`,
        status: subscriptionsResponse.status,
      };
    }

    const responseData = await subscriptionsResponse.json();
    return {
      success: true,
      data: responseData,
    };
  } catch (error) {
    console.error(
      "[MESSENGER_THREAD_SEARCH] Error fetching subscription data:",
      error
    );
    return {
      success: false,
      error: error.message || "Failed to fetch subscription data",
      status: 500,
    };
  }
}



