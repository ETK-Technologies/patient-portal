import { NextResponse } from "next/server";
import { getTokenFromCookie } from "@/app/api/utils/getTokenFromCookie";

export async function PATCH(request) {
    try {
        const body = await request.json();
        const userId = body.id;

        if (!userId) {
            return NextResponse.json(
                {
                    success: false,
                    error: "User ID is required",
                },
                { status: 400 }
            );
        }

        const updateResult = await updateBillingAddress(userId, body, request);

        if (!updateResult.success) {
            return NextResponse.json(
                {
                    success: false,
                    error: updateResult.error || "Failed to update billing address",
                    details: updateResult.details,
                },
                { status: updateResult.status || 500 }
            );
        }

        return NextResponse.json({
            success: true,
            message: "Billing address updated successfully",
            data: updateResult.data,
        });
    } catch (error) {
        console.error("Error updating billing address:", error);
        return NextResponse.json(
            {
                success: false,
                error: "Failed to update billing address",
                details: error.message,
            },
            { status: 500 }
        );
    }
}

async function updateBillingAddress(userId, updateData, request) {
    const crmHost = process.env.CRM_HOST;

    if (!crmHost) {
        return {
            success: false,
            error: "CRM configuration missing",
            status: 500,
        };
    }

    try {
        const authToken = getTokenFromCookie(request);

        if (!authToken) {
            return {
                success: false,
                error: "Authentication token not found",
                status: 401,
            };
        }

        const updateUrl = `${crmHost}/api/user/billing/address/update`;

        const response = await fetch(updateUrl, {
            method: "PATCH",
            headers: {
                Authorization: `Bearer ${authToken}`,
                "Content-Type": "application/json",
                "is-patient-portal": "true",
            },
            body: JSON.stringify(updateData),
        });

        if (!response.ok) {
            const errorText = await response.text();
            let errorDetails;
            try {
                errorDetails = JSON.parse(errorText);
            } catch {
                errorDetails = errorText;
            }

            return {
                success: false,
                error: `Failed to update billing address: ${response.status} ${response.statusText}`,
                details: errorDetails,
                status: response.status,
            };
        }

        const responseData = await response.json();
        return {
            success: true,
            data: responseData,
        };
    } catch (error) {
        console.error("[BILLING_ADDRESS_UPDATE] Error updating billing address:", error);
        return {
            success: false,
            error: `Error updating billing address: ${error.message}`,
            status: 500,
        };
    }
}

