import { NextResponse } from "next/server";
import { authenticateWithCRM } from "../../../utils/crmAuth";

/**
 * GET /api/user/subscriptions/count
 *
 * Fetches subscription count data from CRM.
 * Returns subscription count information from the CRM API.
 *
 * Expected Response:
 * {
 *   "success": true,
 *   "count": 5,
 *   "data": { ... }
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
            `[SUBSCRIPTIONS_COUNT] Cookie header: ${cookieHeader.substring(0, 100)}...`
        );
        console.log(
            `[SUBSCRIPTIONS_COUNT] Extracted userId: ${userId || "not found"}`
        );

        if (!userId) {
            return NextResponse.json(
                {
                    success: false,
                    error: "User not authenticated",
                },
                { status: 401 }
            );
        }

        console.log(`[SUBSCRIPTIONS_COUNT] Fetching subscription count for user: ${userId}`);

        // Fetch subscription count from CRM
        const subscriptionData = await fetchSubscriptionsCount(userId);

        return NextResponse.json({
            success: true,
            count: subscriptionData.count || 0,
            data: subscriptionData,
        });
    } catch (error) {
        console.error("Error fetching subscription count:", error);
        return NextResponse.json(
            {
                success: false,
                error: "Failed to fetch subscription count",
                details: error.message,
            },
            { status: 500 }
        );
    }
}

/**
 * Fetch subscription count from CRM API
 * Uses the subscriptions endpoint: /api/crm-users/{userId}/subscriptions
 */
async function fetchSubscriptionsCount(userId) {
    const crmHost = process.env.CRM_HOST;
    const apiUsername = process.env.CRM_API_USERNAME;
    const apiPasswordEncoded = process.env.CRM_API_PASSWORD;

    if (!crmHost || !apiUsername || !apiPasswordEncoded) {
        console.error("[SUBSCRIPTIONS_COUNT] Missing CRM credentials:");
        console.error({
            crmHost: crmHost || "MISSING",
            apiUsername: apiUsername ? "SET" : "MISSING",
            apiPasswordEncoded: apiPasswordEncoded ? "SET" : "MISSING",
        });
        return {
            count: 0,
            id: userId,
        };
    }

    console.log(`[SUBSCRIPTIONS_COUNT] CRM Host: ${crmHost}`);
    console.log(`[SUBSCRIPTIONS_COUNT] CRM Username: ${apiUsername}`);

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
                console.log("[SUBSCRIPTIONS_COUNT] Password decoded from base64");
            } else {
                apiPassword = apiPasswordEncoded;
                console.log("[SUBSCRIPTIONS_COUNT] Using password as plain text");
            }
        } catch (decodeError) {
            // If base64 decode fails, use as plain text
            apiPassword = apiPasswordEncoded;
            console.log(
                "[SUBSCRIPTIONS_COUNT] Base64 decode failed, using password as plain text"
            );
        }

        // Step 1: Authenticate with CRM to get auth token
        console.log("[SUBSCRIPTIONS_COUNT] Authenticating with CRM...");
        const authResult = await authenticateWithCRM(
            crmHost,
            apiUsername,
            apiPassword
        );

        if (!authResult.success) {
            console.error(
                `[SUBSCRIPTIONS_COUNT] CRM authentication failed: ${authResult.error}`
            );
            if (authResult.endpoint) {
                console.error(`[SUBSCRIPTIONS_COUNT] Failed endpoint: ${authResult.endpoint}`);
            }
            return {
                count: 0,
                id: userId,
            };
        }

        const authToken = authResult.token;
        console.log(
            `[SUBSCRIPTIONS_COUNT] Successfully obtained CRM auth token from ${authResult.endpoint}`
        );

        // Step 2: Fetch subscriptions from CRM
        // Uses the subscriptions endpoint: /api/crm-users/{userId}/subscriptions
        const subscriptionUrl = `${crmHost}/api/crm-users/${userId}/subscriptions`;
        console.log(`[SUBSCRIPTIONS_COUNT] Fetching subscriptions from: ${subscriptionUrl}`);

        const subscriptionResponse = await fetch(subscriptionUrl, {
            method: "GET",
            headers: {
                Authorization: `Bearer ${authToken}`,
                "Content-Type": "application/json",
            },
        });

        if (!subscriptionResponse.ok) {
            const errorText = await subscriptionResponse.text();
            console.error(
                `[SUBSCRIPTIONS_COUNT] Failed to fetch subscriptions: ${subscriptionResponse.status} ${subscriptionResponse.statusText}`
            );
            console.error(`[SUBSCRIPTIONS_COUNT] Error details: ${errorText}`);
            return {
                count: 0,
                id: userId,
            };
        }

        const responseData = await subscriptionResponse.json();
        console.log("[SUBSCRIPTIONS_COUNT] CRM response received");
        console.log("[SUBSCRIPTIONS_COUNT] Response status:", responseData.status);
        console.log("[SUBSCRIPTIONS_COUNT] Response keys:", Object.keys(responseData));

        // Extract subscription count from the CRM response structure
        // CRM might return: { status: true, data: { subscriptions: [...], count: 5 } }
        // or: { status: true, data: [...] } where we count the array
        let subscriptionData = null;

        if (responseData.status && responseData.data) {
            // Check if count is directly in data
            if (typeof responseData.data.count === "number") {
                subscriptionData = {
                    count: responseData.data.count,
                    subscriptions: responseData.data.subscriptions || [],
                    ...responseData.data,
                };
                console.log(`[SUBSCRIPTIONS_COUNT] ✓ Found count in data: ${subscriptionData.count}`);
            }
            // Check if data is an array
            else if (Array.isArray(responseData.data)) {
                subscriptionData = {
                    count: responseData.data.length,
                    subscriptions: responseData.data,
                };
                console.log(`[SUBSCRIPTIONS_COUNT] ✓ Counted array length: ${subscriptionData.count}`);
            }
            // Check if subscriptions array exists in data
            else if (responseData.data.subscriptions && Array.isArray(responseData.data.subscriptions)) {
                subscriptionData = {
                    count: responseData.data.subscriptions.length,
                    subscriptions: responseData.data.subscriptions,
                    ...responseData.data,
                };
                console.log(`[SUBSCRIPTIONS_COUNT] ✓ Counted subscriptions array: ${subscriptionData.count}`);
            }
            // If data exists but structure is different
            else {
                console.log("[SUBSCRIPTIONS_COUNT] Response has data but unexpected structure");
                console.log("[SUBSCRIPTIONS_COUNT] Data keys:", Object.keys(responseData.data));
                subscriptionData = {
                    count: 0,
                    ...responseData.data,
                };
            }
        }
        // Fallback: if response doesn't have status/data structure
        else if (Array.isArray(responseData)) {
            subscriptionData = {
                count: responseData.length,
                subscriptions: responseData,
            };
            console.log(`[SUBSCRIPTIONS_COUNT] ✓ Response is array, counted: ${subscriptionData.count}`);
        }
        // Last fallback: return the response as-is
        else {
            subscriptionData = {
                count: 0,
                data: responseData,
            };
        }

        if (!subscriptionData) {
            console.error("[SUBSCRIPTIONS_COUNT] ✗ Failed to extract subscription data");
            return {
                count: 0,
                id: userId,
            };
        }

        console.log(`[SUBSCRIPTIONS_COUNT] ✓ Successfully fetched subscription count: ${subscriptionData.count}`);
        return subscriptionData;
    } catch (error) {
        console.error("[SUBSCRIPTIONS_COUNT] Error fetching subscription count from CRM:", error);
        return {
            count: 0,
            id: userId,
        };
    }
}

