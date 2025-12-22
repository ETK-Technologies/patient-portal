import { NextResponse } from "next/server";
import { getTokenFromCookie } from "../../utils/getTokenFromCookie";

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
            const match = cookieHeader.match(/wp_user_id=([^;]+)/);
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
        const consultationsData = await fetchConsultations(wpUserID, request);

        return NextResponse.json({
            status: true,
            message: consultationsData.count > 0 
                ? `Successfully fetched ${consultationsData.count} consultations`
                : "No consultations found",
            data: consultationsData.consultations || [],
            pagination: consultationsData.pagination || null,
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
async function fetchConsultations(userId, request) {
    const crmHost = process.env.CRM_HOST;

    if (!crmHost) {
        console.error("[USER_CONSULTATIONS] Missing CRM_HOST");
        return {
            consultations: [],
            id: userId,
        };
    }

    console.log(`[USER_CONSULTATIONS] CRM Host: ${crmHost}`);

    try {
        const authToken = getTokenFromCookie(request);
        
        if (!authToken) {
            console.error("[USER_CONSULTATIONS] No token found in cookie");
            return {
                consultations: [],
                id: userId,
            };
        }

        console.log("[USER_CONSULTATIONS] Using token from cookie");

        // Step 2: Fetch consultations from CRM
        // Uses the consultations endpoint: /api/user/consultations?wp_user_id={wpUserID}
        const consultationsUrl = `${crmHost}/api/user/consultations?wp_user_id=${userId}`;
        console.log(`[USER_CONSULTATIONS] Fetching consultations from: ${consultationsUrl}`);

        const consultationsResponse = await fetch(consultationsUrl, {
            method: "GET",
            headers: {
                Authorization: `Bearer ${authToken}`,
                "Content-Type": "application/json",
                "is-patient-portal": "true",
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
        console.log("[USER_CONSULTATIONS] Response status:", responseData.status);
        console.log("[USER_CONSULTATIONS] Response keys:", Object.keys(responseData));

        // Extract consultations from the CRM response structure
        // New format: { status: true, message: "...", data: [...], pagination: {...} }
        // data is already an array of consultations
        if (responseData.status && Array.isArray(responseData.data)) {
            console.log(`[USER_CONSULTATIONS] ✓ Found consultations array in data: ${responseData.data.length} consultations`);
            console.log("[USER_CONSULTATIONS] Pagination:", responseData.pagination);
            
            return {
                consultations: responseData.data,
                pagination: responseData.pagination || null,
                count: responseData.data.length,
            };
        }

        // Fallback: if structure is different, try to extract data
        if (responseData.data && Array.isArray(responseData.data)) {
            console.log(`[USER_CONSULTATIONS] ✓ Found consultations array in data (fallback): ${responseData.data.length} consultations`);
            return {
                consultations: responseData.data,
                pagination: responseData.pagination || null,
                count: responseData.data.length,
            };
        }

        console.error("[USER_CONSULTATIONS] ✗ Failed to extract consultations data - unexpected structure");
        console.error("[USER_CONSULTATIONS] Response structure:", JSON.stringify(responseData, null, 2));
        return {
            consultations: [],
            pagination: null,
            count: 0,
        };
    } catch (error) {
        console.error("[USER_CONSULTATIONS] Error fetching consultations from CRM:", error);
        return {
            consultations: [],
            id: userId,
        };
    }
}

