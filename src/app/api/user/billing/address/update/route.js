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

        const billingUpdateUrl = `${crmHost}/api/user/billing/address/update`;

        console.log("[BILLING_ADDRESS_UPDATE] Billing address payload being sent to CRM:", JSON.stringify(updateData, null, 2));

        const billingResponse = await fetch(billingUpdateUrl, {
            method: "PATCH",
            headers: {
                Authorization: `Bearer ${authToken}`,
                "Content-Type": "application/json",
                "is-patient-portal": "true",
            },
            body: JSON.stringify(updateData),
        });

        if (!billingResponse.ok) {
            const errorText = await billingResponse.text();
            let errorDetails;
            try {
                errorDetails = JSON.parse(errorText);
            } catch {
                errorDetails = errorText;
            }

            return {
                success: false,
                error: `Failed to update billing address: ${billingResponse.status} ${billingResponse.statusText}`,
                details: errorDetails,
                status: billingResponse.status,
            };
        }

        const billingResponseData = await billingResponse.json();

        if (updateData.shipping_first_name !== undefined || 
            updateData.shipping_last_name !== undefined ||
            updateData.shipping_email !== undefined ||
            updateData.shipping_address_1 !== undefined) {
            
            const shippingPayload = {
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
            };

            console.log("[BILLING_ADDRESS_UPDATE] Shipping address payload being sent to CRM (from billing update):", JSON.stringify(shippingPayload, null, 2));

            const shippingUpdateUrl = `${crmHost}/api/user/shipping/address/update`;

            const shippingResponse = await fetch(shippingUpdateUrl, {
                method: "PATCH",
                headers: {
                    Authorization: `Bearer ${authToken}`,
                    "Content-Type": "application/json",
                    "is-patient-portal": "true",
                },
                body: JSON.stringify(shippingPayload),
            });

            if (!shippingResponse.ok) {
                const errorText = await shippingResponse.text();
                let errorDetails;
                try {
                    errorDetails = JSON.parse(errorText);
                } catch {
                    errorDetails = errorText;
                }

                return {
                    success: false,
                    error: `Billing address updated but failed to update shipping address: ${shippingResponse.status} ${shippingResponse.statusText}`,
                    details: errorDetails,
                    status: shippingResponse.status,
                };
            }

            const shippingResponseData = await shippingResponse.json();
            console.log("[BILLING_ADDRESS_UPDATE] Both billing and shipping addresses updated successfully");
        }

        return {
            success: true,
            data: billingResponseData,
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

