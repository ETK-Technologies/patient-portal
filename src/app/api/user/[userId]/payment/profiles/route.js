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

        const paymentData = await fetchPaymentProfiles(userId);

        return NextResponse.json({
            success: true,
            data: paymentData,
        });
    } catch (error) {
        console.error("Error fetching payment profiles:", error);
        return NextResponse.json(
            {
                success: false,
                error: "Failed to fetch payment profiles",
                details: error.message,
            },
            { status: 500 }
        );
    }
}

async function fetchPaymentProfiles(crmUserID) {
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
        const paymentProfilesUrl = `${crmHost}/api/user/payment/profiles/${crmUserID}`;

        const response = await fetch(paymentProfilesUrl, {
            method: "GET",
            headers: {
                Authorization: `Bearer ${authToken}`,
                "Content-Type": "application/json",
                "is-patient-portal": "true",
            },
        });

        if (!response.ok) {
            const errorText = await response.text();
            console.error(
                `[USER_PAYMENT_PROFILES] Failed to fetch payment profiles: ${response.status} ${response.statusText}`
            );
            console.error(`[USER_PAYMENT_PROFILES] Error details: ${errorText}`);
            return {
                id: crmUserID,
                error: `Failed to fetch: ${response.status} ${response.statusText}`,
            };
        }

        const responseData = await response.json();
        console.log(
            `[USER_PAYMENT_PROFILES] CRM response received:`,
            JSON.stringify(responseData, null, 2)
        );

        let profiles = [];
        let billingAddress = null;

        if (responseData.status && responseData.profiles) {
            profiles = responseData.profiles;
            billingAddress = responseData.billing_address || null;
            console.log(
                `[USER_PAYMENT_PROFILES] ✓ Extracted ${profiles.length} profile(s) from CRM response`
            );
        } else if (responseData.profiles) {
            profiles = responseData.profiles;
            billingAddress = responseData.billing_address || null;
            console.log(
                `[USER_PAYMENT_PROFILES] ✓ Using profiles from response`
            );
        } else {
            console.error(
                `[USER_PAYMENT_PROFILES] ✗ Unexpected response structure. Response keys:`,
                Object.keys(responseData)
            );
        }

        return {
            profiles: profiles,
            billing_address: billingAddress,
        };
    } catch (error) {
        console.error("[USER_PAYMENT_PROFILES] Error fetching payment profiles from CRM:", error);
        return {
            id: crmUserID,
            error: error.message,
        };
    }
}
