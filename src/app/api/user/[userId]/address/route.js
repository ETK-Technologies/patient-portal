import { NextResponse } from "next/server";
import { authenticateWithCRM } from "@/app/api/utils/crmAuth";

export async function GET(request, { params }) {
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

        const addressData = await fetchAddressData(userId);

        return NextResponse.json({
            success: true,
            data: addressData,
        });
    } catch (error) {
        console.error("Error fetching address data:", error);
        return NextResponse.json(
            {
                success: false,
                error: "Failed to fetch address data",
                details: error.message,
            },
            { status: 500 }
        );
    }
}

async function fetchAddressData(crmUserID) {
    const crmHost = process.env.CRM_HOST;
    const apiUsername = process.env.CRM_API_USERNAME;
    const apiPasswordEncoded = process.env.CRM_API_PASSWORD;

    if (!crmHost || !apiUsername || !apiPasswordEncoded) {
        return {
            id: crmUserID,
            error: "Missing CRM credentials",
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
            return {
                id: crmUserID,
                error: `CRM authentication failed: ${authResult.error}`,
            };
        }

        const authToken = authResult.token;
        const addressUrl = `${crmHost}/api/user/${crmUserID}/address`;

        const response = await fetch(addressUrl, {
            method: "GET",
            headers: {
                Authorization: `Bearer ${authToken}`,
                "Content-Type": "application/json",
                "is-patient-portal": "true",
            },
        });

        if (!response.ok) {
            const errorText = await response.text();
            return {
                id: crmUserID,
                error: `Failed to fetch: ${response.status} ${response.statusText}`,
            };
        }

        const responseData = await response.json();
        return responseData;
    } catch (error) {
        console.error("[USER_ADDRESS] Error fetching address data from CRM:", error);
        return {
            id: crmUserID,
            error: error.message,
        };
    }
}
