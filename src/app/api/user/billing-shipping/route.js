import { NextResponse } from "next/server";
import { authenticateWithCRM } from "../../utils/crmAuth";

/**
 * GET /api/user/billing-shipping
 *
 * Fetches billing and shipping data from CRM for the authenticated user.
 * Returns user data including billing, shipping, and payment profile information.
 *
 * Uses test ID (33237) for testing purposes.
 *
 * Expected Response:
 * {
 *   "status": true,
 *   "message": "User billing and shipping data retrieved successfully.",
 *   "data": {
 *     "user": {
 *       "billing": { ... },
 *       "shipping": { ... },
 *       "payment_profile": [ ... ]
 *     }
 *   }
 * }
 */
export async function GET(request) {
  try {
    // Get userId from cookies (set during auto-login)
    const cookieHeader = request.headers.get("cookie") || "";
    let userId = null;

    if (cookieHeader) {
      const match = cookieHeader.match(/userId=([^;]+)/);
      if (match) {
        userId = decodeURIComponent(match[1].trim());
      }
    }

    // Check if CRM user ID is passed as query parameter (from frontend context)
    const searchParams = request.nextUrl.searchParams;
    const crmUserIDFromQuery =
      searchParams.get("crmUserID") || searchParams.get("id");

    // Use CRM user ID from query parameter if available (from userData.id in context),
    // otherwise fall back to userId from cookies
    const crmUserID = crmUserIDFromQuery || userId;

    if (!crmUserID) {
      return NextResponse.json(
        {
          success: false,
          error: "User not authenticated",
        },
        { status: 401 }
      );
    }

    if (crmUserIDFromQuery) {
      console.log(
        `[BILLING_SHIPPING] Using CRM user ID from query parameter (userData.id): ${crmUserID}`
      );
    } else {
      console.log(
        `[BILLING_SHIPPING] Using userId from cookies as CRM user ID: ${crmUserID}`
      );
    }

    console.log(
      `[BILLING_SHIPPING] Fetching billing and shipping data for user: ${crmUserID}`
    );

    // Fetch billing and shipping data from CRM
    const billingShippingData = await fetchBillingShippingData(crmUserID);

    if (billingShippingData.error) {
      return NextResponse.json(
        {
          success: false,
          error: billingShippingData.error,
        },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      status: billingShippingData.status || true,
      message:
        billingShippingData.message ||
        "User billing and shipping data retrieved successfully.",
      data: billingShippingData.data || billingShippingData,
    });
  } catch (error) {
    console.error("Error fetching billing and shipping data:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Failed to fetch billing and shipping data",
        details: error.message,
      },
      { status: 500 }
    );
  }
}

/**
 * Fetch billing and shipping data from CRM API
 * Uses the user endpoint: /api/user/{crmUserID}
 */
async function fetchBillingShippingData(crmUserID) {
  const crmHost = process.env.CRM_HOST;
  const apiUsername = process.env.CRM_API_USERNAME;
  const apiPasswordEncoded = process.env.CRM_API_PASSWORD;

  if (!crmHost || !apiUsername || !apiPasswordEncoded) {
    console.error("[BILLING_SHIPPING] Missing CRM credentials");
    return {
      error: "CRM configuration missing",
    };
  }

  console.log(`[BILLING_SHIPPING] CRM Host: ${crmHost}`);

  try {
    // Decode the password - try base64 first, fallback to plain text
    let apiPassword;
    try {
      const decoded = Buffer.from(apiPasswordEncoded, "base64").toString(
        "utf8"
      );
      const hasNonPrintable = /[\x00-\x08\x0E-\x1F\x7F-\x9F]/.test(decoded);
      const isSameAsInput = decoded === apiPasswordEncoded;

      if (!hasNonPrintable && !isSameAsInput && decoded.length > 0) {
        apiPassword = decoded;
        console.log("[BILLING_SHIPPING] Password decoded from base64");
      } else {
        apiPassword = apiPasswordEncoded;
        console.log("[BILLING_SHIPPING] Using password as plain text");
      }
    } catch (decodeError) {
      apiPassword = apiPasswordEncoded;
      console.log(
        "[BILLING_SHIPPING] Using password as plain text (base64 decode failed)"
      );
    }

    // Step 1: Authenticate with CRM to get auth token
    console.log("[BILLING_SHIPPING] Authenticating with CRM...");
    const authResult = await authenticateWithCRM(
      crmHost,
      apiUsername,
      apiPassword
    );

    if (!authResult.success) {
      console.error(
        `[BILLING_SHIPPING] CRM authentication failed: ${authResult.error}`
      );
      return {
        error: `CRM authentication failed: ${authResult.error}`,
      };
    }

    const authToken = authResult.token;
    console.log(`[BILLING_SHIPPING] Successfully obtained CRM auth token`);

    // Step 2: Fetch billing and shipping data from CRM
    // Try the main user endpoint first - if it doesn't exist, we'll fetch from separate endpoints
    // Based on Postman: the endpoint might be different or need query parameters
    const billingShippingUrl = `${crmHost}/api/user/${crmUserID}/shipping-address`;
    console.log(
      `[BILLING_SHIPPING] Fetching billing and shipping data from: ${billingShippingUrl}`
    );
    console.log(
      `[BILLING_SHIPPING] Note: If this endpoint doesn't exist, we may need to use separate endpoints for billing/shipping/payment`
    );

    const response = await fetch(billingShippingUrl, {
      method: "GET",
      headers: {
        Authorization: `Bearer ${authToken}`,
        "Content-Type": "application/json",
        is_patient_portal: "true",
      },
    });

    if (!response.ok) {
      let errorText = "";
      try {
        errorText = await response.text();
      } catch (e) {
        errorText = "Unable to read error response";
      }
      console.error(
        `[BILLING_SHIPPING] Failed to fetch billing and shipping data: ${response.status} ${response.statusText}`
      );
      console.error(`[BILLING_SHIPPING] Error details: ${errorText}`);
      console.error(`[BILLING_SHIPPING] Request URL: ${billingShippingUrl}`);

      // Try to parse error as JSON for more details
      let errorDetails = errorText;
      try {
        const parsedError = JSON.parse(errorText);
        errorDetails = parsedError.message || parsedError.error || errorText;
      } catch (e) {
        // Not JSON, use as is
      }

      return {
        error: `Failed to fetch: ${response.status} ${response.statusText}`,
        details: errorDetails,
      };
    }

    let responseData;
    try {
      const responseText = await response.text();
      console.log(
        `[BILLING_SHIPPING] Response text length: ${responseText.length}`
      );

      if (!responseText || responseText.trim() === "") {
        console.error(`[BILLING_SHIPPING] Empty response from CRM`);
        return {
          error: "Empty response from CRM API",
        };
      }

      responseData = JSON.parse(responseText);
    } catch (parseError) {
      console.error(
        `[BILLING_SHIPPING] Failed to parse JSON response:`,
        parseError
      );
      return {
        error: "Invalid JSON response from CRM API",
        details: parseError.message,
      };
    }

    console.log(
      `[BILLING_SHIPPING] ✓ Successfully fetched billing and shipping data for user: ${crmUserID}`
    );
    console.log(`[BILLING_SHIPPING] Response structure:`, {
      hasStatus: !!responseData.status,
      hasMessage: !!responseData.message,
      hasData: !!responseData.data,
      hasUser: !!(responseData.data && responseData.data.user),
    });
    return responseData;
  } catch (error) {
    console.error(
      "[BILLING_SHIPPING] Error fetching billing and shipping data from CRM:",
      error
    );
    return {
      error: error.message,
    };
  }
}
