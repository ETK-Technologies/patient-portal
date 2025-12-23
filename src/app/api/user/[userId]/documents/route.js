import { NextResponse } from "next/server";
import { getTokenFromCookie } from "@/app/api/utils/getTokenFromCookie";

/**
 * GET /api/user/[userId]/documents
 *
 * Fetches user documents data from CRM for the specified user.
 * Returns documents information from the CRM documents endpoint.
 */
export async function GET(request, { params }) {
    console.log("!!! [API] GET /api/user/[userId]/documents HIT !!!");
    try {
        const { userId } = await params;
        console.log("[API] Request params userId:", userId);

        if (!userId) {
            return NextResponse.json(
                {
                    success: false,
                    error: "User ID is required",
                },
                { status: 400 }
            );
        }

        console.log(`[USER_DOCUMENTS] Fetching documents for user ID: ${userId}`);

        const documentsData = await fetchDocuments(userId, request);

        return NextResponse.json({
            success: true,
            data: documentsData,
        });
    } catch (error) {
        console.error("Error fetching documents:", error);
        return NextResponse.json(
            {
                success: false,
                error: "Failed to fetch documents",
                details: error.message,
            },
            { status: 500 }
        );
    }
}

/**
 * POST /api/user/[userId]/documents
 *
 * Creates or updates user documents data in CRM for the specified user.
 */
export async function POST(request, { params }) {
    try {
        const { userId } = await params;

        if (!userId) {
            return NextResponse.json(
                {
                    success: false,
                    error: "User ID is required",
                },
                { status: 400 }
            );
        }

        const body = await request.json();
        console.log(
            `[USER_DOCUMENTS_UPDATE] Updating documents for user: ${userId}`
        );

        const updateResult = await updateDocuments(userId, body, request);

        if (!updateResult.success) {
            return NextResponse.json(
                {
                    success: false,
                    error: updateResult.error || "Failed to update documents",
                    details: updateResult.details,
                },
                { status: updateResult.status || 500 }
            );
        }

        return NextResponse.json({
            success: true,
            message: "Documents updated successfully",
            data: updateResult.data,
        });
    } catch (error) {
        console.error("Error updating documents:", error);
        return NextResponse.json(
            {
                success: false,
                error: "Failed to update documents",
                details: error.message,
            },
            { status: 500 }
        );
    }
}

/**
 * PUT /api/user/[userId]/documents
 *
 * Updates user documents data in CRM for the specified user.
 */
export async function PUT(request, { params }) {
    return POST(request, { params });
}

/**
 * Fetch documents from CRM API
 * Uses the documents endpoint: /api/user/{crmUserID}/documents
 * @param {string} crmUserID - CRM User ID
 * @param {Request} request - The request object to get token from cookie
 */
async function fetchDocuments(crmUserID, request) {
    const crmHost = process.env.CRM_HOST;

    if (!crmHost) {
        console.error("[USER_DOCUMENTS] Missing CRM_HOST");
        return {
            id: crmUserID,
            error: "Missing CRM configuration",
        };
    }

    console.log(`[USER_DOCUMENTS] CRM Host: ${crmHost}`);

    try {
        const authToken = getTokenFromCookie(request);
        
        if (!authToken) {
            console.error("[USER_DOCUMENTS] No token found in cookie");
            return {
                id: crmUserID,
                error: "Authentication token not found",
            };
        }

        console.log("[USER_DOCUMENTS] Using token from cookie");

        const documentsUrl = `${crmHost}/api/user/${crmUserID}/documents`;
        console.log(`[USER_DOCUMENTS] Fetching documents from: ${documentsUrl}`);

        const documentsResponse = await fetch(documentsUrl, {
            method: "GET",
            headers: {
                Authorization: `Bearer ${authToken}`,
                "Content-Type": "application/json",
                "is-patient-portal": "true",
            },
        });

        if (!documentsResponse.ok) {
            const errorText = await documentsResponse.text();
            console.error(
                `[USER_DOCUMENTS] Failed to fetch documents: ${documentsResponse.status} ${documentsResponse.statusText}`
            );
            console.error(`[USER_DOCUMENTS] Error details: ${errorText}`);
            return {
                id: crmUserID,
                error: `Failed to fetch: ${documentsResponse.status} ${documentsResponse.statusText}`,
            };
        }

        const responseData = await documentsResponse.json();
        console.log("[USER_DOCUMENTS] CRM response received");
        console.log(
            "[USER_DOCUMENTS] Full CRM response:",
            JSON.stringify(responseData, null, 2)
        );

        console.log(
            `[USER_DOCUMENTS] ✓ Successfully fetched documents for user: ${crmUserID}`
        );
        return responseData;
    } catch (error) {
        console.error("[USER_DOCUMENTS] Error fetching documents from CRM:", error);
        return {
            id: crmUserID,
            error: error.message,
        };
    }
}

/**
 * Update documents in CRM API
 * Uses the documents endpoint: /api/user/{crmUserID}/documents
 * @param {string} crmUserID - CRM User ID
 * @param {object} updateData - Data to update
 * @param {Request} request - The request object to get token from cookie
 */
async function updateDocuments(crmUserID, updateData, request) {
    const crmHost = process.env.CRM_HOST;

    if (!crmHost) {
        console.error("[USER_DOCUMENTS_UPDATE] Missing CRM_HOST");
        return {
            success: false,
            error: "Missing CRM configuration",
            status: 500,
        };
    }

    try {
        const authToken = getTokenFromCookie(request);
        
        if (!authToken) {
            console.error("[USER_DOCUMENTS_UPDATE] No token found in cookie");
            return {
                success: false,
                error: "Authentication token not found",
                status: 401,
            };
        }

        console.log("[USER_DOCUMENTS_UPDATE] Using token from cookie");

        const updateUrl = `${crmHost}/api/user/${crmUserID}/documents`;
        console.log(`[USER_DOCUMENTS_UPDATE] Updating documents at: ${updateUrl}`);
        console.log(`[USER_DOCUMENTS_UPDATE] User ID: ${crmUserID}`);
        console.log(`[USER_DOCUMENTS_UPDATE] Update data:`, updateData);

        const updateResponse = await fetch(updateUrl, {
            method: "POST",
            headers: {
                Authorization: `Bearer ${authToken}`,
                "Content-Type": "application/json",
                "is-patient-portal": "true",
            },
            body: JSON.stringify(updateData),
        });

        if (!updateResponse.ok) {
            const errorText = await updateResponse.text();
            console.error(
                `[USER_DOCUMENTS_UPDATE] Failed to update documents: ${updateResponse.status} ${updateResponse.statusText}`
            );
            console.error(`[USER_DOCUMENTS_UPDATE] Error details: ${errorText}`);

            let errorDetails;
            try {
                errorDetails = JSON.parse(errorText);
            } catch {
                errorDetails = errorText;
            }

            return {
                success: false,
                error: `Failed to update documents: ${updateResponse.status} ${updateResponse.statusText}`,
                details: errorDetails,
                status: updateResponse.status,
            };
        }

        const responseData = await updateResponse.json();
        console.log("[USER_DOCUMENTS_UPDATE] Documents update response received");
        console.log("[USER_DOCUMENTS_UPDATE] Response:", responseData);

        return {
            success: true,
            data: responseData,
        };
    } catch (error) {
        console.error("[USER_DOCUMENTS_UPDATE] Error updating documents:", error);
        return {
            success: false,
            error: `Error updating documents: ${error.message}`,
            status: 500,
        };
    }
}
