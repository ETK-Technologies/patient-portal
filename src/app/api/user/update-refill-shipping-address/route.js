import { NextResponse } from "next/server";
import { getTokenFromCookie } from "../../utils/getTokenFromCookie";

/**
 * POST /api/user/update-refill-shipping-address
 *
 * Updates the shipping address for a subscription refill by calling the CRM API.
 * Uses wp_user_id from cookies.
 *
 * Request Body (from frontend):
 * {
 *   "subscription_id": 401204,
 *   "shipping_address": {
 *     "address_1": "123 New Street",
 *     "address_2": "Unit 4B",
 *     "city": "Toronto",
 *     "state": "ON",
 *     "postcode": "M5V 2T6",
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

    if (!shipping_address.address_1) {
      return NextResponse.json(
        {
          success: false,
          error: "Missing required field: shipping_address.address_1",
        },
        { status: 400 }
      );
    }

    console.log(
      `[UPDATE_REFILL_SHIPPING] Updating shipping address for subscription ${subscription_id}`
    );

    const flattenedAddress = {
      shipping_address_1: shipping_address.address_1 || "",
      shipping_address_2: shipping_address.address_2 || "",
      shipping_city: shipping_address.city || "",
      shipping_state: shipping_address.state || "",
      shipping_postcode: shipping_address.postcode || "",
      shipping_country: shipping_address.country || "CA",
    };

    const result = await updateRefillShippingAddressInCRM(
      wpUserID,
      subscription_id,
      flattenedAddress,
      request
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
 * @param {object} shippingAddress - Shipping address data with flattened fields
 * @param {Request} request - The incoming request object to extract token from cookie
 */
async function updateRefillShippingAddressInCRM(
  wpUserID,
  subscriptionId,
  shippingAddress,
  request
) {
  const crmHost = process.env.CRM_HOST;

  if (!crmHost) {
    console.error("[UPDATE_REFILL_SHIPPING] Missing CRM_HOST");
    return {
      status: false,
      message: "CRM configuration missing",
    };
  }

  console.log(`[UPDATE_REFILL_SHIPPING] CRM Host: ${crmHost}`);

  try {
    const authToken = getTokenFromCookie(request);
    
    if (!authToken) {
      console.error("[UPDATE_REFILL_SHIPPING] No token found in cookie");
      return {
        status: false,
        message: "Authentication token not found",
      };
    }

    console.log("[UPDATE_REFILL_SHIPPING] Using token from cookie");

    const updateShippingUrl = `${crmHost}/api/user/update-refill-shipping-address`;
    console.log(
      `[UPDATE_REFILL_SHIPPING] Calling CRM endpoint: ${updateShippingUrl}`
    );

    const payload = {
      wp_user_id: parseInt(wpUserID, 10),
      subscription_id: parseInt(subscriptionId, 10),
      shipping_address_1: shippingAddress.shipping_address_1 || "",
      shipping_address_2: shippingAddress.shipping_address_2 || "",
      shipping_city: shippingAddress.shipping_city || "",
      shipping_state: shippingAddress.shipping_state || "",
      shipping_postcode: shippingAddress.shipping_postcode || "",
      shipping_country: shippingAddress.shipping_country || "CA",
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

