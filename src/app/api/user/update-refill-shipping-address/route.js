import { NextResponse } from "next/server";
import { authenticateWithCRM } from "../../utils/crmAuth";

/**
 * POST /api/user/update-refill-shipping-address
 *
 * Updates the shipping address for a subscription refill by calling the CRM API.
 * Uses wp_user_id from cookies.
 *
 * Request Body:
 * {
 *   "subscription_id": 401204,
 *   "shipping_address": {
 *     "first_name": "John",
 *     "last_name": "Doe",
 *     "email": "john@example.com",
 *     "address_1": "123 Main St",
 *     "address_2": "Apt 4",
 *     "city": "Toronto",
 *     "state": "ON",
 *     "postcode": "M5H 2N2",
 *     "country": "CA"
 *   }
 * }
 *
 * Expected Response:
 * {
 *   "success": true,
 *   "data": { ... }
 * }
 */
export async function POST(request) {
  try {
    // Get wp_user_id from cookies
    const cookieHeader = request.headers.get("cookie") || "";
    let wpUserID = null;

    if (cookieHeader) {
      const match = cookieHeader.match(/wp_user_id=([^;]+)/);
      if (match) {
        wpUserID = decodeURIComponent(match[1].trim());
      }
    }

    console.log(
      `[UPDATE_REFILL_SHIPPING] Cookie header: ${cookieHeader.substring(0, 100)}...`
    );
    console.log(
      `[UPDATE_REFILL_SHIPPING] Extracted wp_user_id: ${wpUserID || "not found"}`
    );

    if (!wpUserID) {
      return NextResponse.json(
        {
          success: false,
          error: "User not authenticated",
          message: "wp_user_id not found in cookies",
        },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { subscription_id, shipping_address } = body;

    if (!subscription_id) {
      return NextResponse.json(
        {
          success: false,
          error: "Missing required field: subscription_id",
        },
        { status: 400 }
      );
    }

    if (!shipping_address) {
      return NextResponse.json(
        {
          success: false,
          error: "Missing required field: shipping_address",
        },
        { status: 400 }
      );
    }

    console.log(
      `[UPDATE_REFILL_SHIPPING] Updating shipping address for subscription ${subscription_id}`
    );

    const result = await updateRefillShippingAddressInCRM(
      wpUserID,
      subscription_id,
      shipping_address
    );

    return NextResponse.json({
      success: true,
      data: result,
    });
  } catch (error) {
    console.error("[UPDATE_REFILL_SHIPPING] Error:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Failed to update refill shipping address",
        details: error.message,
      },
      { status: 500 }
    );
  }
}

/**
 * Update refill shipping address in CRM API
 * @param {string} wpUserID - WordPress user ID
 * @param {number} subscriptionId - Subscription ID
 * @param {object} shippingAddress - Shipping address data
 */
async function updateRefillShippingAddressInCRM(
  wpUserID,
  subscriptionId,
  shippingAddress
) {
  const crmHost = process.env.CRM_HOST;
  const apiUsername = process.env.CRM_API_USERNAME;
  const apiPasswordEncoded = process.env.CRM_API_PASSWORD;

  if (!crmHost || !apiUsername || !apiPasswordEncoded) {
    console.error("[UPDATE_REFILL_SHIPPING] Missing CRM credentials:");
    console.error({
      crmHost: crmHost || "MISSING",
      apiUsername: apiUsername ? "SET" : "MISSING",
      apiPasswordEncoded: apiPasswordEncoded ? "SET" : "MISSING",
    });
    return {
      status: false,
      message: "CRM configuration missing",
    };
  }

  console.log(`[UPDATE_REFILL_SHIPPING] CRM Host: ${crmHost}`);

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
        console.log("[UPDATE_REFILL_SHIPPING] Password decoded from base64");
      } else {
        apiPassword = apiPasswordEncoded;
        console.log("[UPDATE_REFILL_SHIPPING] Using password as plain text");
      }
    } catch (decodeError) {
      apiPassword = apiPasswordEncoded;
      console.log(
        "[UPDATE_REFILL_SHIPPING] Base64 decode failed, using password as plain text"
      );
    }

    console.log("[UPDATE_REFILL_SHIPPING] Authenticating with CRM...");
    const authResult = await authenticateWithCRM(
      crmHost,
      apiUsername,
      apiPassword
    );

    if (!authResult.success) {
      console.error(
        `[UPDATE_REFILL_SHIPPING] CRM authentication failed: ${authResult.error}`
      );
      if (authResult.endpoint) {
        console.error(
          `[UPDATE_REFILL_SHIPPING] Failed endpoint: ${authResult.endpoint}`
        );
      }
      return {
        status: false,
        message: "CRM authentication failed",
      };
    }

    const authToken = authResult.token;
    console.log(
      `[UPDATE_REFILL_SHIPPING] Successfully obtained CRM auth token from ${authResult.endpoint}`
    );

    const updateShippingUrl = `${crmHost}/api/user/update-refill-shipping-address`;
    console.log(
      `[UPDATE_REFILL_SHIPPING] Calling CRM endpoint: ${updateShippingUrl}`
    );

    const payload = {
      wp_user_id: parseInt(wpUserID, 10),
      subscription_id: parseInt(subscriptionId, 10),
      shipping_address: {
        first_name: shippingAddress.first_name || "",
        last_name: shippingAddress.last_name || "",
        email: shippingAddress.email || "",
        address_1: shippingAddress.address_1 || "",
        address_2: shippingAddress.address_2 || "",
        city: shippingAddress.city || "",
        state: shippingAddress.state || "",
        postcode: shippingAddress.postcode || "",
        country: shippingAddress.country || "CA",
      },
    };

    console.log(
      `[UPDATE_REFILL_SHIPPING] Request payload:`,
      JSON.stringify(payload, null, 2)
    );

    const crmResponse = await fetch(updateShippingUrl, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${authToken}`,
        "Content-Type": "application/json",
        "is-patient-portal": "true",
      },
      body: JSON.stringify(payload),
    });

    if (!crmResponse.ok) {
      const errorText = await crmResponse.text();
      console.error(
        `[UPDATE_REFILL_SHIPPING] Failed to update shipping address: ${crmResponse.status} ${crmResponse.statusText}`
      );
      console.error(`[UPDATE_REFILL_SHIPPING] Error details: ${errorText}`);
      return {
        status: false,
        message: `Failed to update shipping address: ${crmResponse.status} ${crmResponse.statusText}`,
        error: errorText,
      };
    }

    const responseData = await crmResponse.json();
    console.log("[UPDATE_REFILL_SHIPPING] CRM response received");
    console.log(
      "[UPDATE_REFILL_SHIPPING] Full CRM response:",
      JSON.stringify(responseData, null, 2)
    );

    console.log(
      `[UPDATE_REFILL_SHIPPING] ✓ Successfully updated shipping address for subscription ${subscriptionId}`
    );
    return responseData;
  } catch (error) {
    console.error(
      "[UPDATE_REFILL_SHIPPING] Error updating shipping address in CRM:",
      error
    );
    return {
      status: false,
      message: error.message || "Failed to update shipping address",
    };
  }
}


