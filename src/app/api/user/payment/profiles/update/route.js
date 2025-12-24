import { NextResponse } from "next/server";
import { authenticateWithCRM } from "@/app/api/utils/crmAuth";

/**
 * PATCH /api/user/payment/profiles/update
 *
 * Updates payment profile in CRM for the authenticated user.
 *
 * Expected Request Body:
 * {
 *   "profile_id": "Bb27b63C4e304Ef8b814B26fD479ACA9",
 *   "customer_id": "107913",
 *   "name_on_card": "Test Card 1",
 *   "card_number": "5123456789012346",
 *   "expiry_month": "11",
 *   "expiry_year": "33",
 *   "cvc": "111"
 * }
 */
export async function PATCH(request) {
  try {
    const body = await request.json();
    const {
      profile_id,
      customer_id,
      name_on_card,
      card_number,
      expiry_month,
      expiry_year,
      cvc,
    } = body;

    if (!profile_id || !customer_id || !name_on_card || !card_number || !expiry_month || !expiry_year || !cvc) {
      return NextResponse.json(
        {
          status: false,
          message: "Please provide all required payment information.",
          error: "Missing required fields",
        },
        { status: 400 }
      );
    }

    console.log(
      `[PAYMENT_PROFILE_UPDATE] Updating payment profile for customer: ${customer_id}, profile: ${profile_id}`
    );

    const updateResult = await updatePaymentProfile(
      profile_id,
      customer_id,
      name_on_card,
      card_number,
      expiry_month,
      expiry_year,
      cvc
    );

    if (updateResult.error) {
      return NextResponse.json(
        {
          status: false,
          message: updateResult.error,
          error: updateResult.error,
        },
        { status: 500 }
      );
    }

    return NextResponse.json({
      status: true,
      message: "Payment profile updated successfully.",
      data: updateResult.data || updateResult,
    });
  } catch (error) {
    console.error("Error updating payment profile:", error);
    return NextResponse.json(
      {
        status: false,
        message: "Unable to save your changes. Please try again later.",
        error: "Unable to save your changes. Please try again later.",
      },
      { status: 500 }
    );
  }
}

/**
 * Update payment profile in CRM API
 * Uses the payment profile endpoint: PATCH /api/user/payment/profiles/update
 */
async function updatePaymentProfile(
  profile_id,
  customer_id,
  name_on_card,
  card_number,
  expiry_month,
  expiry_year,
  cvc
) {
  const crmHost = process.env.CRM_HOST;
  const apiUsername = process.env.CRM_API_USERNAME;
  const apiPasswordEncoded = process.env.CRM_API_PASSWORD;

  if (!crmHost || !apiUsername || !apiPasswordEncoded) {
    console.error("[PAYMENT_PROFILE_UPDATE] Missing CRM credentials");
    return {
      error: "Missing CRM credentials",
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
      } else {
        apiPassword = apiPasswordEncoded;
      }
    } catch (decodeError) {
      apiPassword = apiPasswordEncoded;
    }

    console.log("[PAYMENT_PROFILE_UPDATE] Authenticating with CRM...");
    const authResult = await authenticateWithCRM(
      crmHost,
      apiUsername,
      apiPassword
    );

    if (!authResult.success) {
      console.error(
        `[PAYMENT_PROFILE_UPDATE] CRM authentication failed: ${authResult.error}`
      );
      return {
        error: `CRM authentication failed: ${authResult.error}`,
      };
    }

    const authToken = authResult.token;
    console.log(
      `[PAYMENT_PROFILE_UPDATE] Successfully obtained CRM auth token`
    );

    const updateUrl = `${crmHost}/api/user/payment/profiles/update`;
    console.log(
      `[PAYMENT_PROFILE_UPDATE] Updating payment profile at: ${updateUrl}`
    );

    const requestBody = {
      "_method": "patch",
      "profile_id": profile_id,
      "customer_id": customer_id,
      "name_on_card": name_on_card,
      "card_id": "1",
      "card_priority": "Primary",
      "card_number": card_number,
      "expiry_month": expiry_month,
      "expiry_year": expiry_year,
      "cvc": cvc,
    };

    console.log(`[PAYMENT_PROFILE_UPDATE] Request body:`, {
      ...requestBody,
      cvc: "***",
    });

    const updateResponse = await fetch(updateUrl, {
      method: "PATCH",
      headers: {
        Authorization: `Bearer ${authToken}`,
        "Content-Type": "application/json",
        "is-patient-portal": "true",
      },
      body: JSON.stringify(requestBody),
    });

    if (!updateResponse.ok) {
      let errorMessage = "Unable to save your changes. Please try again.";

      try {
        const errorText = await updateResponse.text();
        console.error(
          `[PAYMENT_PROFILE_UPDATE] Failed to update payment profile: ${updateResponse.status} ${updateResponse.statusText}`
        );
        console.error(`[PAYMENT_PROFILE_UPDATE] Error details: ${errorText}`);

        try {
          const errorData = JSON.parse(errorText);
          if (errorData.message) {
            errorMessage = errorData.message;
          } else if (errorData.error) {
            errorMessage = errorData.error;
          }
        } catch (jsonError) {
          switch (updateResponse.status) {
            case 400:
              errorMessage =
                "Invalid data provided. Please check your input and try again.";
              break;
            case 401:
              errorMessage =
                "Authentication failed. Please refresh the page and try again.";
              break;
            case 403:
              errorMessage =
                "You don't have permission to perform this action.";
              break;
            case 404:
              errorMessage = "The requested resource was not found.";
              break;
            case 422:
              errorMessage =
                "The data you entered is invalid or incomplete. Please check your input and try again.";
              break;
            case 500:
              errorMessage = "A server error occurred. Please try again later.";
              break;
            default:
              errorMessage = "Unable to save your changes. Please try again.";
          }
        }
      } catch (e) {
        switch (updateResponse.status) {
          case 400:
            errorMessage =
              "Invalid data provided. Please check your input and try again.";
            break;
          case 401:
            errorMessage =
              "Authentication failed. Please refresh the page and try again.";
            break;
          case 403:
            errorMessage = "You don't have permission to perform this action.";
            break;
          case 404:
            errorMessage = "The requested resource was not found.";
            break;
          case 422:
            errorMessage =
              "The data you entered is invalid or incomplete. Please check your input and try again.";
            break;
          case 500:
            errorMessage = "A server error occurred. Please try again later.";
            break;
          default:
            errorMessage = "Unable to save your changes. Please try again.";
        }
      }

      return {
        success: false,
        error: errorMessage,
      };
    }

    const responseData = await updateResponse.json();
    console.log(
      `[PAYMENT_PROFILE_UPDATE] ✓ Successfully updated payment profile for customer: ${customer_id}`
    );
    console.log(
      `[PAYMENT_PROFILE_UPDATE] Full Response:`,
      JSON.stringify(responseData, null, 2)
    );

    let updateData = responseData;
    if (responseData.status && responseData.data) {
      updateData = responseData.data;
      console.log(
        "[PAYMENT_PROFILE_UPDATE] ✓ Extracted data from CRM response (data property)"
      );
    } else if (responseData.data) {
      updateData = responseData.data;
      console.log(
        "[PAYMENT_PROFILE_UPDATE] ✓ Using data property from response"
      );
    }

    return {
      data: updateData,
    };
  } catch (error) {
    console.error(
      "[PAYMENT_PROFILE_UPDATE] Error updating payment profile from CRM:",
      error
    );
    return {
      error: "Unable to save your changes. Please try again later.",
    };
  }
}


