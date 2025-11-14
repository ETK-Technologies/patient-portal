import { NextResponse } from "next/server";
import { authenticateWithCRM } from "../../utils/crmAuth";

/**
 * GET /api/user/shipping-address
 *
 * Fetches shipping address data from CRM for the authenticated user.
 * Returns shipping address information from the CRM shipping address endpoint.
 * 
 * User ID can be provided in two ways:
 * 1. Query parameter: ?id={userData.id} or ?crmUserID={userData.id} (from UserContext)
 * 2. Cookies: userId from cookies (set during auto-login) - used as fallback
 * 
 * Since userData is already available in UserContext on the frontend,
 * the frontend can pass userData.id as a query parameter.
 *
 * Expected Response:
 * {
 *   "success": true,
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
            `[SHIPPING_ADDRESS] Cookie header: ${cookieHeader.substring(0, 100)}...`
        );
        console.log(`[SHIPPING_ADDRESS] Extracted userId: ${userId || "not found"}`);

        // Check if CRM user ID is passed as query parameter (from frontend context)
        const searchParams = request.nextUrl.searchParams;
        const crmUserIDFromQuery = searchParams.get("crmUserID") || searchParams.get("id");

        // Use CRM user ID from query parameter if available (from userData.id in context),
        // otherwise fall back to userId from cookies
        const crmUserID = crmUserIDFromQuery || userId;

        if (!crmUserID) {
            return NextResponse.json(
                {
                    success: false,
                    error: "User not authenticated",
                },
                { status: 401 }
            );
        }

        if (crmUserIDFromQuery) {
            console.log(`[SHIPPING_ADDRESS] Using CRM user ID from query parameter (userData.id): ${crmUserID}`);
        } else {
            console.log(`[SHIPPING_ADDRESS] Using userId from cookies as CRM user ID: ${crmUserID}`);
        }

        // Fetch shipping address from CRM
        const shippingAddressData = await fetchShippingAddress(crmUserID);

        return NextResponse.json({
            success: true,
            data: shippingAddressData,
        });
    } catch (error) {
        console.error("Error fetching shipping address:", error);
        return NextResponse.json(
            {
                success: false,
                error: "Failed to fetch shipping address",
                details: error.message,
            },
            { status: 500 }
        );
    }
}

/**
 * POST /api/user/shipping-address
 *
 * Creates or updates shipping address data in CRM for the authenticated user.
 * Accepts shipping address data and sends it to the CRM shipping address endpoint.
 * 
 * User ID can be provided in two ways:
 * 1. Query parameter: ?id={userData.id} or ?crmUserID={userData.id} (from UserContext)
 * 2. Cookies: userId from cookies (set during auto-login) - used as fallback
 *
 * Expected Request Body:
 * {
 *   "address": "...",
 *   "city": "...",
 *   "province": "...",
 *   "postal_code": "...",
 *   ...
 * }
 */
export async function POST(request) {
    try {
        // Get userId from cookies (set during auto-login)
        const cookieHeader = request.headers.get("cookie") || "";
        let userId = null;

        if (cookieHeader) {
            const match = cookieHeader.match(/userId=([^;]+)/);
            if (match) {
                userId = decodeURIComponent(match[1].trim());
            }
        }

        // Check if CRM user ID is passed as query parameter (from frontend context)
        const searchParams = request.nextUrl.searchParams;
        const crmUserIDFromQuery = searchParams.get("crmUserID") || searchParams.get("id");

        // Use CRM user ID from query parameter if available (from userData.id in context),
        // otherwise fall back to userId from cookies
        const crmUserID = crmUserIDFromQuery || userId;

        if (!crmUserID) {
            return NextResponse.json(
                {
                    success: false,
                    error: "User not authenticated",
                },
                { status: 401 }
            );
        }

        if (crmUserIDFromQuery) {
            console.log(`[SHIPPING_ADDRESS_UPDATE] Using CRM user ID from query parameter (userData.id): ${crmUserID}`);
        } else {
            console.log(`[SHIPPING_ADDRESS_UPDATE] Using userId from cookies as CRM user ID: ${crmUserID}`);
        }

        // Parse request body
        const body = await request.json();
        console.log(`[SHIPPING_ADDRESS_UPDATE] Updating shipping address for user: ${crmUserID}`);

        // Update shipping address in CRM
        const updateResult = await updateShippingAddress(crmUserID, body);

        if (!updateResult.success) {
            return NextResponse.json(
                {
                    success: false,
                    error: updateResult.error || "Failed to update shipping address",
                    details: updateResult.details,
                },
                { status: updateResult.status || 500 }
            );
        }

        return NextResponse.json({
            success: true,
            message: "Shipping address updated successfully",
            data: updateResult.data,
        });
    } catch (error) {
        console.error("Error updating shipping address:", error);
        return NextResponse.json(
            {
                success: false,
                error: "Failed to update shipping address",
                details: error.message,
            },
            { status: 500 }
        );
    }
}

/**
 * PUT /api/user/shipping-address
 *
 * Updates shipping address data in CRM for the authenticated user.
 * Same as POST but using PUT method.
 */
export async function PUT(request) {
    // Reuse POST handler logic
    return POST(request);
}

/**
 * Fetch shipping address from CRM API
 * Uses the shipping address endpoint: /api/user/{crmUserID}/shipping-address
 */
async function fetchShippingAddress(crmUserID) {
    const crmHost = process.env.CRM_HOST;
    const apiUsername = process.env.CRM_API_USERNAME;
    const apiPasswordEncoded = process.env.CRM_API_PASSWORD;

    if (!crmHost || !apiUsername || !apiPasswordEncoded) {
        console.error("[SHIPPING_ADDRESS] Missing CRM credentials:");
        console.error({
            crmHost: crmHost || "MISSING",
            apiUsername: apiUsername ? "SET" : "MISSING",
            apiPasswordEncoded: apiPasswordEncoded ? "SET" : "MISSING",
        });
        return {
            id: crmUserID,
        };
    }

    console.log(`[SHIPPING_ADDRESS] CRM Host: ${crmHost}`);
    console.log(`[SHIPPING_ADDRESS] CRM Username: ${apiUsername}`);

    try {
        // Decode the password - try base64 first, fallback to plain text
        let apiPassword;
        try {
            // Try to decode as base64
            const decoded = Buffer.from(apiPasswordEncoded, "base64").toString(
                "utf8"
            );
            // Check if decoded value is valid and reasonable
            const hasNonPrintable = /[\x00-\x08\x0E-\x1F\x7F-\x9F]/.test(decoded);
            const isSameAsInput = decoded === apiPasswordEncoded;

            if (!hasNonPrintable && !isSameAsInput && decoded.length > 0) {
                apiPassword = decoded;
                console.log("[SHIPPING_ADDRESS] Password decoded from base64");
            } else {
                apiPassword = apiPasswordEncoded;
                console.log("[SHIPPING_ADDRESS] Using password as plain text");
            }
        } catch (decodeError) {
            // If base64 decode fails, use as plain text
            apiPassword = apiPasswordEncoded;
            console.log(
                "[SHIPPING_ADDRESS] Base64 decode failed, using password as plain text"
            );
        }

        // Step 1: Authenticate with CRM to get auth token
        console.log("[SHIPPING_ADDRESS] Authenticating with CRM...");
        const authResult = await authenticateWithCRM(
            crmHost,
            apiUsername,
            apiPassword
        );

        if (!authResult.success) {
            console.error(
                `[SHIPPING_ADDRESS] CRM authentication failed: ${authResult.error}`
            );
            if (authResult.endpoint) {
                console.error(`[SHIPPING_ADDRESS] Failed endpoint: ${authResult.endpoint}`);
            }
            return {
                id: crmUserID,
            };
        }

        const authToken = authResult.token;
        console.log(
            `[SHIPPING_ADDRESS] Successfully obtained CRM auth token from ${authResult.endpoint}`
        );

        // Step 2: Fetch shipping address from CRM
        const shippingAddressUrl = `${crmHost}/api/user/${crmUserID}/shipping-address`;
        console.log(`[SHIPPING_ADDRESS] Fetching shipping address from: ${shippingAddressUrl}`);

        const shippingAddressResponse = await fetch(shippingAddressUrl, {
            method: "GET",
            headers: {
                Authorization: `Bearer ${authToken}`,
                "Content-Type": "application/json",
            },
        });

        if (!shippingAddressResponse.ok) {
            const errorText = await shippingAddressResponse.text();
            console.error(
                `[SHIPPING_ADDRESS] Failed to fetch shipping address: ${shippingAddressResponse.status} ${shippingAddressResponse.statusText}`
            );
            console.error(`[SHIPPING_ADDRESS] Error details: ${errorText}`);
            return {
                id: crmUserID,
                error: `Failed to fetch: ${shippingAddressResponse.status} ${shippingAddressResponse.statusText}`,
            };
        }

        const responseData = await shippingAddressResponse.json();
        console.log("[SHIPPING_ADDRESS] CRM response received");
        console.log("[SHIPPING_ADDRESS] Full CRM response:", JSON.stringify(responseData, null, 2));

        console.log(`[SHIPPING_ADDRESS] ✓ Successfully fetched shipping address for user: ${crmUserID}`);
        return responseData;
    } catch (error) {
        console.error("[SHIPPING_ADDRESS] Error fetching shipping address from CRM:", error);
        return {
            id: crmUserID,
            error: error.message,
        };
    }
}

/**
 * Update shipping address in CRM API
 * Uses the shipping address endpoint: /api/user/{crmUserID}/shipping-address
 */
async function updateShippingAddress(crmUserID, updateData) {
    const crmHost = process.env.CRM_HOST;
    const apiUsername = process.env.CRM_API_USERNAME;
    const apiPasswordEncoded = process.env.CRM_API_PASSWORD;

    if (!crmHost || !apiUsername || !apiPasswordEncoded) {
        console.error("[SHIPPING_ADDRESS_UPDATE] Missing CRM credentials");
        return {
            success: false,
            error: "CRM configuration missing",
            status: 500,
        };
    }

    try {
        // Decode the password - try base64 first, fallback to plain text
        let apiPassword;
        try {
            const decoded = Buffer.from(apiPasswordEncoded, "base64").toString(
                "utf8"
            );
            const hasNonPrintable = /[\x00-\x08\x0E-\x1F\x7F-\x9F]/.test(decoded);
            const isSameAsInput = decoded === apiPasswordEncoded;

            if (!hasNonPrintable && !isSameAsInput && decoded.length > 0) {
                apiPassword = decoded;
                console.log("[SHIPPING_ADDRESS_UPDATE] Password decoded from base64");
            } else {
                apiPassword = apiPasswordEncoded;
                console.log("[SHIPPING_ADDRESS_UPDATE] Using password as plain text");
            }
        } catch (decodeError) {
            apiPassword = apiPasswordEncoded;
            console.log(
                "[SHIPPING_ADDRESS_UPDATE] Using password as plain text (base64 decode failed)"
            );
        }

        // Step 1: Authenticate with CRM to get auth token
        console.log("[SHIPPING_ADDRESS_UPDATE] Authenticating with CRM...");
        const authResult = await authenticateWithCRM(
            crmHost,
            apiUsername,
            apiPassword
        );

        if (!authResult.success) {
            console.error(
                `[SHIPPING_ADDRESS_UPDATE] CRM authentication failed: ${authResult.error}`
            );
            return {
                success: false,
                error: `CRM authentication failed: ${authResult.error}`,
                status: 500,
            };
        }

        const authToken = authResult.token;
        console.log(
            `[SHIPPING_ADDRESS_UPDATE] Successfully obtained CRM auth token from ${authResult.endpoint}`
        );

        // Step 2: Update shipping address in CRM
        const updateUrl = `${crmHost}/api/user/${crmUserID}/shipping-address`;
        console.log(`[SHIPPING_ADDRESS_UPDATE] Updating shipping address at: ${updateUrl}`);
        console.log(`[SHIPPING_ADDRESS_UPDATE] User ID: ${crmUserID}`);
        console.log(`[SHIPPING_ADDRESS_UPDATE] Update data:`, updateData);

        const updateResponse = await fetch(updateUrl, {
            method: "POST",
            headers: {
                Authorization: `Bearer ${authToken}`,
                "Content-Type": "application/json",
            },
            body: JSON.stringify(updateData),
        });

        if (!updateResponse.ok) {
            const errorText = await updateResponse.text();
            console.error(
                `[SHIPPING_ADDRESS_UPDATE] Failed to update shipping address: ${updateResponse.status} ${updateResponse.statusText}`
            );
            console.error(`[SHIPPING_ADDRESS_UPDATE] Error details: ${errorText}`);

            let errorDetails;
            try {
                errorDetails = JSON.parse(errorText);
            } catch {
                errorDetails = errorText;
            }

            return {
                success: false,
                error: `Failed to update shipping address: ${updateResponse.status} ${updateResponse.statusText}`,
                details: errorDetails,
                status: updateResponse.status,
            };
        }

        const responseData = await updateResponse.json();
        console.log("[SHIPPING_ADDRESS_UPDATE] Shipping address update response received");
        console.log("[SHIPPING_ADDRESS_UPDATE] Response:", responseData);

        return {
            success: true,
            data: responseData,
        };
    } catch (error) {
        console.error("[SHIPPING_ADDRESS_UPDATE] Error updating shipping address:", error);
        return {
            success: false,
            error: `Error updating shipping address: ${error.message}`,
            status: 500,
        };
    }
}

