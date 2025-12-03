import { NextResponse } from "next/server";
import { authenticateWithCRM } from "@/app/api/utils/crmAuth";

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

        const updateResult = await updateShippingAddress(userId, body);

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

async function updateShippingAddress(userId, updateData) {
    const crmHost = process.env.CRM_HOST;
    const apiUsername = process.env.CRM_API_USERNAME;
    const apiPasswordEncoded = process.env.CRM_API_PASSWORD;

    if (!crmHost || !apiUsername || !apiPasswordEncoded) {
        return {
            success: false,
            error: "CRM configuration missing",
            status: 500,
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
                success: false,
                error: `CRM authentication failed: ${authResult.error}`,
                status: 500,
            };
        }

        const authToken = authResult.token;
        const updateUrl = `${crmHost}/api/user/shipping/address/update`;

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
                error: `Failed to update shipping address: ${response.status} ${response.statusText}`,
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
        console.error("[SHIPPING_ADDRESS_UPDATE] Error updating shipping address:", error);
        return {
            success: false,
            error: `Error updating shipping address: ${error.message}`,
            status: 500,
        };
    }
}

