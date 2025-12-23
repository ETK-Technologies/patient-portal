import { NextResponse } from "next/server";
import { getTokenFromCookie } from "@/app/api/utils/getTokenFromCookie";

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

        const addressData = await fetchAddressData(userId, request);

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

async function fetchAddressData(crmUserID, request) {
    const crmHost = process.env.CRM_HOST;

    if (!crmHost) {
        console.error("[USER_ADDRESS] Missing CRM_HOST");
        return {
            id: crmUserID,
            error: "Missing CRM configuration",
        };
    }

    try {
        const authToken = getTokenFromCookie(request);
        
        if (!authToken) {
            console.error("[USER_ADDRESS] No token found in cookie");
            return {
                id: crmUserID,
                error: "Authentication token not found",
            };
        }

        console.log("[USER_ADDRESS] Using token from cookie");
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
