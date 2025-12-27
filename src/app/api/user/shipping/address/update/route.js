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

        const updateResult = await updateShippingAddress(userId, body, request);

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

async function updateShippingAddress(userId, updateData, request) {
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

        const payload = {
            id: userId,
            shipping_first_name: updateData.shipping_first_name || "",
            shipping_last_name: updateData.shipping_last_name || "",
            shipping_email: updateData.shipping_email || "",
            shipping_country: updateData.shipping_country || "",
            shipping_address_1: updateData.shipping_address_1 || "",
            shipping_address_2: updateData.shipping_address_2 || "",
            shipping_city: updateData.shipping_city || "",
            shipping_state: updateData.shipping_state || "",
            shipping_postcode: updateData.shipping_postcode || "",
            // Billing address fields from request body
            billing_first_name: updateData.billing_first_name || "",
            billing_last_name: updateData.billing_last_name || "",
            billing_email: updateData.billing_email || "",
            billing_phone: updateData.billing_phone || "",
            billing_country: updateData.billing_country || "",
            billing_address_1: updateData.billing_address_1 || "",
            billing_address_2: updateData.billing_address_2 || "",
            billing_city: updateData.billing_city || "",
            billing_state: updateData.billing_state || "",
            billing_postcode: updateData.billing_postcode || "",
        };

        const updateUrl = `${crmHost}/api/user/shipping/address/update`;

        const response = await fetch(updateUrl, {
            method: "PATCH",
            headers: {
                Authorization: `Bearer ${authToken}`,
                "Content-Type": "application/json",
                "is-patient-portal": "true",
            },
            body: JSON.stringify(payload),
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

