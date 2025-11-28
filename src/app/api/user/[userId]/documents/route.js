import { NextResponse } from "next/server";
import { authenticateWithCRM } from "@/app/api/utils/crmAuth";

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

        const documentsData = await fetchDocuments(userId);

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

        const updateResult = await updateDocuments(userId, body);

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
 */
async function fetchDocuments(crmUserID) {
    const crmHost = process.env.CRM_HOST;
    const apiUsername = process.env.CRM_API_USERNAME;
    const apiPasswordEncoded = process.env.CRM_API_PASSWORD;

    if (!crmHost || !apiUsername || !apiPasswordEncoded) {
        console.error("[USER_DOCUMENTS] Missing CRM credentials:");
        console.error({
            crmHost: crmHost || "MISSING",
            apiUsername: apiUsername ? "SET" : "MISSING",
            apiPasswordEncoded: apiPasswordEncoded ? "SET" : "MISSING",
        });
        return {
            id: crmUserID,
            error: "Missing CRM credentials",
        };
    }

    console.log(`[USER_DOCUMENTS] CRM Host: ${crmHost}`);
    console.log(`[USER_DOCUMENTS] CRM Username: ${apiUsername}`);

    try {
        let apiPassword;
        try {
            const decoded = Buffer.from(apiPasswordEncoded, "base64").toString(
                "utf8"
            );
            const hasNonPrintable = /[\x00-\x08\x0E-\x1F\x7F-\x9F]/.test(decoded);
            const isSameAsInput = decoded === apiPasswordEncoded;

            if (!hasNonPrintable && !isSameAsInput && decoded.length > 0) {
                apiPassword = decoded;
                console.log("[USER_DOCUMENTS] Password decoded from base64");
            } else {
                apiPassword = apiPasswordEncoded;
                console.log("[USER_DOCUMENTS] Using password as plain text");
            }
        } catch (decodeError) {
            apiPassword = apiPasswordEncoded;
            console.log(
                "[USER_DOCUMENTS] Base64 decode failed, using password as plain text"
            );
        }

        console.log("[USER_DOCUMENTS] Authenticating with CRM...");
        const authResult = await authenticateWithCRM(
            crmHost,
            apiUsername,
            apiPassword
        );

        if (!authResult.success) {
            console.error(
                `[USER_DOCUMENTS] CRM authentication failed: ${authResult.error}`
            );
            if (authResult.endpoint) {
                console.error(
                    `[USER_DOCUMENTS] Failed endpoint: ${authResult.endpoint}`
                );
            }
            return {
                id: crmUserID,
                error: `CRM authentication failed: ${authResult.error}`,
            };
        }

        const authToken = authResult.token;
        console.log(
            `[USER_DOCUMENTS] Successfully obtained CRM auth token from ${authResult.endpoint}`
        );

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
 */
async function updateDocuments(crmUserID, updateData) {
    const crmHost = process.env.CRM_HOST;
    const apiUsername = process.env.CRM_API_USERNAME;
    const apiPasswordEncoded = process.env.CRM_API_PASSWORD;

    if (!crmHost || !apiUsername || !apiPasswordEncoded) {
        console.error("[USER_DOCUMENTS_UPDATE] Missing CRM credentials");
        return {
            success: false,
            error: "CRM configuration missing",
            status: 500,
        };
    }

    try {
        let apiPassword;
        try {
            const decoded = Buffer.from(apiPasswordEncoded, "base64").toString(
                "utf8"
            );
            const hasNonPrintable = /[\x00-\x08\x0E-\x1F\x7F-\x9F]/.test(decoded);
            const isSameAsInput = decoded === apiPasswordEncoded;

            if (!hasNonPrintable && !isSameAsInput && decoded.length > 0) {
                apiPassword = decoded;
                console.log("[USER_DOCUMENTS_UPDATE] Password decoded from base64");
            } else {
                apiPassword = apiPasswordEncoded;
                console.log("[USER_DOCUMENTS_UPDATE] Using password as plain text");
            }
        } catch (decodeError) {
            apiPassword = apiPasswordEncoded;
            console.log(
                "[USER_DOCUMENTS_UPDATE] Using password as plain text (base64 decode failed)"
            );
        }

        console.log("[USER_DOCUMENTS_UPDATE] Authenticating with CRM...");
        const authResult = await authenticateWithCRM(
            crmHost,
            apiUsername,
            apiPassword
        );

        if (!authResult.success) {
            console.error(
                `[USER_DOCUMENTS_UPDATE] CRM authentication failed: ${authResult.error}`
            );
            return {
                success: false,
                error: `CRM authentication failed: ${authResult.error}`,
                status: 500,
            };
        }

        const authToken = authResult.token;
        console.log(
            `[USER_DOCUMENTS_UPDATE] Successfully obtained CRM auth token from ${authResult.endpoint}`
        );

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
