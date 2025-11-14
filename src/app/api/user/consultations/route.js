import { NextResponse } from "next/server";
import { authenticateWithCRM } from "../../utils/crmAuth";

/**
 * GET /api/user/consultations
 *
 * Fetches user consultations data from CRM.
 * Returns consultation information from the CRM consultations endpoint.
 * wpUserID is obtained from cookies (set during auto-login).
 *
 * Expected Response:
 * {
 *   "success": true,
 *   "consultations": [...],
 *   "data": { ... }
 * }
 */
export async function GET(request) {
    try {
        // Get wpUserID from cookies (set during auto-login)
        // Parse cookie header manually for compatibility
        const cookieHeader = request.headers.get("cookie") || "";
        let wpUserID = null;

        if (cookieHeader) {
            // Parse cookies from header string
            const match = cookieHeader.match(/userId=([^;]+)/);
            if (match) {
                wpUserID = decodeURIComponent(match[1].trim());
            }
        }

        console.log(
            `[USER_CONSULTATIONS] Cookie header: ${cookieHeader.substring(0, 100)}...`
        );
        console.log(`[USER_CONSULTATIONS] Extracted wpUserID: ${wpUserID || "not found"}`);

        if (!wpUserID) {
            return NextResponse.json(
                {
                    success: false,
                    error: "User not authenticated",
                },
                { status: 401 }
            );
        }

        console.log(`[USER_CONSULTATIONS] Fetching consultations for user: ${wpUserID}`);

        // Fetch consultations from CRM
        const consultationsData = await fetchConsultations(wpUserID);

        return NextResponse.json({
            success: true,
            consultations: consultationsData.consultations || [],
            data: consultationsData,
        });
    } catch (error) {
        console.error("Error fetching user consultations:", error);
        return NextResponse.json(
            {
                success: false,
                error: "Failed to fetch user consultations",
                details: error.message,
            },
            { status: 500 }
        );
    }
}

/**
 * Fetch consultations from CRM API
 * Uses the consultations endpoint: /api/user/consultations?wp_user_id={wpUserID}
 */
async function fetchConsultations(userId) {
    const crmHost = process.env.CRM_HOST;
    const apiUsername = process.env.CRM_API_USERNAME;
    const apiPasswordEncoded = process.env.CRM_API_PASSWORD;

    if (!crmHost || !apiUsername || !apiPasswordEncoded) {
        console.error("[USER_CONSULTATIONS] Missing CRM credentials:");
        console.error({
            crmHost: crmHost || "MISSING",
            apiUsername: apiUsername ? "SET" : "MISSING",
            apiPasswordEncoded: apiPasswordEncoded ? "SET" : "MISSING",
        });
        return {
            consultations: [],
            id: userId,
        };
    }

    console.log(`[USER_CONSULTATIONS] CRM Host: ${crmHost}`);
    console.log(`[USER_CONSULTATIONS] CRM Username: ${apiUsername}`);

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
                console.log("[USER_CONSULTATIONS] Password decoded from base64");
            } else {
                apiPassword = apiPasswordEncoded;
                console.log("[USER_CONSULTATIONS] Using password as plain text");
            }
        } catch (decodeError) {
            // If base64 decode fails, use as plain text
            apiPassword = apiPasswordEncoded;
            console.log(
                "[USER_CONSULTATIONS] Base64 decode failed, using password as plain text"
            );
        }

        // Step 1: Authenticate with CRM to get auth token
        console.log("[USER_CONSULTATIONS] Authenticating with CRM...");
        const authResult = await authenticateWithCRM(
            crmHost,
            apiUsername,
            apiPassword
        );

        if (!authResult.success) {
            console.error(
                `[USER_CONSULTATIONS] CRM authentication failed: ${authResult.error}`
            );
            if (authResult.endpoint) {
                console.error(`[USER_CONSULTATIONS] Failed endpoint: ${authResult.endpoint}`);
            }
            return {
                consultations: [],
                id: userId,
            };
        }

        const authToken = authResult.token;
        console.log(
            `[USER_CONSULTATIONS] Successfully obtained CRM auth token from ${authResult.endpoint}`
        );

        // Step 2: Fetch consultations from CRM
        // Uses the consultations endpoint: /api/user/consultations?wp_user_id={wpUserID}
        const consultationsUrl = `${crmHost}/api/user/consultations?wp_user_id=${userId}`;
        console.log(`[USER_CONSULTATIONS] Fetching consultations from: ${consultationsUrl}`);

        const consultationsResponse = await fetch(consultationsUrl, {
            method: "GET",
            headers: {
                Authorization: `Bearer ${authToken}`,
                "Content-Type": "application/json",
            },
        });

        if (!consultationsResponse.ok) {
            const errorText = await consultationsResponse.text();
            console.error(
                `[USER_CONSULTATIONS] Failed to fetch consultations: ${consultationsResponse.status} ${consultationsResponse.statusText}`
            );
            console.error(`[USER_CONSULTATIONS] Error details: ${errorText}`);
            return {
                consultations: [],
                id: userId,
            };
        }

        const responseData = await consultationsResponse.json();
        console.log("[USER_CONSULTATIONS] CRM response received");
        console.log("[USER_CONSULTATIONS] Full CRM response:", JSON.stringify(responseData, null, 2));
        console.log("[USER_CONSULTATIONS] Response status:", responseData.status);
        console.log("[USER_CONSULTATIONS] Response keys:", Object.keys(responseData));

        // Log the actual consultations data structure
        if (responseData.data) {
            console.log("[USER_CONSULTATIONS] Response.data type:", Array.isArray(responseData.data) ? "Array" : typeof responseData.data);
            console.log("[USER_CONSULTATIONS] Response.data:", JSON.stringify(responseData.data, null, 2));
            if (responseData.data.consultations) {
                console.log("[USER_CONSULTATIONS] Response.data.consultations:", JSON.stringify(responseData.data.consultations, null, 2));
            }
        }

        // Extract consultations from the CRM response structure
        // CRM might return: { status: true, data: { consultations: [...], count: 5 } }
        // or: { status: true, data: [...] } where data is the consultations array
        let consultationsData = null;

        if (responseData.status && responseData.data) {
            // Check if consultations array is directly in data
            if (Array.isArray(responseData.data)) {
                consultationsData = {
                    consultations: responseData.data,
                    count: responseData.data.length,
                };
                console.log(`[USER_CONSULTATIONS] ✓ Found consultations array in data: ${consultationsData.count} consultations`);
            }
            // Check if consultations array exists in data object
            else if (responseData.data.consultations && Array.isArray(responseData.data.consultations)) {
                consultationsData = {
                    consultations: responseData.data.consultations,
                    count: responseData.data.consultations.length,
                    ...responseData.data,
                };
                console.log(`[USER_CONSULTATIONS] ✓ Found consultations in data.consultations: ${consultationsData.count} consultations`);
            }
            // If data exists but structure is different
            else {
                console.log("[USER_CONSULTATIONS] Response has data but unexpected structure");
                console.log("[USER_CONSULTATIONS] Data keys:", Object.keys(responseData.data));
                consultationsData = {
                    consultations: [],
                    ...responseData.data,
                };
            }
        }
        // Fallback: if response doesn't have status/data structure
        else if (Array.isArray(responseData)) {
            consultationsData = {
                consultations: responseData,
                count: responseData.length,
            };
            console.log(`[USER_CONSULTATIONS] ✓ Response is array, counted: ${consultationsData.count} consultations`);
        }
        // Last fallback: return the response as-is
        else {
            consultationsData = {
                consultations: [],
                data: responseData,
            };
        }

        if (!consultationsData) {
            console.error("[USER_CONSULTATIONS] ✗ Failed to extract consultations data");
            return {
                consultations: [],
                id: userId,
            };
        }

        console.log(`[USER_CONSULTATIONS] ✓ Successfully fetched consultations: ${consultationsData.count || consultationsData.consultations?.length || 0} consultations`);
        return consultationsData;
    } catch (error) {
        console.error("[USER_CONSULTATIONS] Error fetching consultations from CRM:", error);
        return {
            consultations: [],
            id: userId,
        };
    }
}

