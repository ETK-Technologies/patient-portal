import { NextResponse } from "next/server";
import { authenticateWithCRM } from "../../utils/crmAuth";

/**
 * GET /api/user/medical-profile
 *
 * Fetches medical profile data from CRM for the authenticated user.
 * Returns medical history information from the CRM medical profile endpoint.
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
            `[MEDICAL_PROFILE] Cookie header: ${cookieHeader.substring(0, 100)}...`
        );
        console.log(`[MEDICAL_PROFILE] Extracted userId: ${userId || "not found"}`);

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
            console.log(`[MEDICAL_PROFILE] Using CRM user ID from query parameter (userData.id): ${crmUserID}`);
        } else {
            console.log(`[MEDICAL_PROFILE] Using userId from cookies as CRM user ID: ${crmUserID}`);
        }

        // Fetch medical profile data from CRM
        const medicalProfileData = await fetchMedicalProfile(crmUserID);

        return NextResponse.json({
            success: true,
            data: medicalProfileData,
        });
    } catch (error) {
        console.error("Error fetching medical profile data:", error);
        return NextResponse.json(
            {
                success: false,
                error: "Failed to fetch medical profile data",
                details: error.message,
            },
            { status: 500 }
        );
    }
}

/**
 * Fetch medical profile data from CRM API
 * Uses the medical profile endpoint: /api/user/{crmUserID}/medical-profile
 */
async function fetchMedicalProfile(crmUserID) {
    const crmHost = process.env.CRM_HOST;
    const apiUsername = process.env.CRM_API_USERNAME;
    const apiPasswordEncoded = process.env.CRM_API_PASSWORD;

    if (!crmHost || !apiUsername || !apiPasswordEncoded) {
        console.error("[MEDICAL_PROFILE] Missing CRM credentials:");
        console.error({
            crmHost: crmHost || "MISSING",
            apiUsername: apiUsername ? "SET" : "MISSING",
            apiPasswordEncoded: apiPasswordEncoded ? "SET" : "MISSING",
        });
        return {
            crmUserID: crmUserID,
        };
    }

    console.log(`[MEDICAL_PROFILE] CRM Host: ${crmHost}`);
    console.log(`[MEDICAL_PROFILE] CRM Username: ${apiUsername}`);

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
                console.log("[MEDICAL_PROFILE] Password decoded from base64");
            } else {
                apiPassword = apiPasswordEncoded;
                console.log("[MEDICAL_PROFILE] Using password as plain text");
            }
        } catch (decodeError) {
            // If base64 decode fails, use as plain text
            apiPassword = apiPasswordEncoded;
            console.log(
                "[MEDICAL_PROFILE] Base64 decode failed, using password as plain text"
            );
        }

        // Step 1: Authenticate with CRM to get auth token
        console.log("[MEDICAL_PROFILE] Authenticating with CRM...");
        const authResult = await authenticateWithCRM(
            crmHost,
            apiUsername,
            apiPassword
        );

        if (!authResult.success) {
            console.error(
                `[MEDICAL_PROFILE] CRM authentication failed: ${authResult.error}`
            );
            if (authResult.endpoint) {
                console.error(`[MEDICAL_PROFILE] Failed endpoint: ${authResult.endpoint}`);
            }
            return {
                crmUserID: crmUserID,
            };
        }

        const authToken = authResult.token;
        console.log(
            `[MEDICAL_PROFILE] Successfully obtained CRM auth token from ${authResult.endpoint}`
        );

        // Step 2: Fetch medical profile data from CRM
        // Uses the medical profile endpoint: /api/user/{crmUserID}/medical-profile
        const medicalProfileUrl = `${crmHost}/api/user/${crmUserID}/medical-profile`;
        console.log(`[MEDICAL_PROFILE] Fetching medical profile data from: ${medicalProfileUrl}`);

        const medicalProfileResponse = await fetch(medicalProfileUrl, {
            method: "GET",
            headers: {
                Authorization: `Bearer ${authToken}`,
                "Content-Type": "application/json",
            },
        });

        if (!medicalProfileResponse.ok) {
            const errorText = await medicalProfileResponse.text();
            console.error(
                `[MEDICAL_PROFILE] Failed to fetch medical profile data: ${medicalProfileResponse.status} ${medicalProfileResponse.statusText}`
            );
            console.error(`[MEDICAL_PROFILE] Error details: ${errorText}`);
            return {
                crmUserID: crmUserID,
                error: `Failed to fetch: ${medicalProfileResponse.status} ${medicalProfileResponse.statusText}`,
            };
        }

        const responseData = await medicalProfileResponse.json();
        console.log("[MEDICAL_PROFILE] CRM response received");
        console.log("[MEDICAL_PROFILE] Full CRM response:", JSON.stringify(responseData, null, 2));

        console.log(`[MEDICAL_PROFILE] ✓ Successfully fetched medical profile data for user: ${crmUserID}`);
        return responseData;
    } catch (error) {
        console.error("[MEDICAL_PROFILE] Error fetching medical profile data from CRM:", error);
        return {
            crmUserID: crmUserID,
            error: error.message,
        };
    }
}

