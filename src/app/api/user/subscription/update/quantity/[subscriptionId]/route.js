import { NextResponse } from "next/server";
import { getTokenFromCookie } from "../../../../../utils/getTokenFromCookie";

/**
 * PUT /api/user/subscription/update/quantity/[subscriptionId]
 *
 * Updates the quantity for a subscription line item by calling the CRM API.
 * Uses wp_user_id from cookies.
 *
 * Request Body:
 * {
 *   "line_item_id": 805590,
 *   "quantity": 2
 * }
 *
 * Expected Response:
 * {
 *   "success": true,
 *   "data": { ... }
 * }
 */
export async function PUT(request, { params }) {
  try {
    const { subscriptionId } = await params;

    if (!subscriptionId) {
      return NextResponse.json(
        {
          success: false,
          error: "Missing subscription ID in route",
        },
        { status: 400 }
      );
    }

    const cookieHeader = request.headers.get("cookie") || "";
    let wpUserID = null;

    if (cookieHeader) {
      const match = cookieHeader.match(/wp_user_id=([^;]+)/);
      if (match) {
        wpUserID = decodeURIComponent(match[1].trim());
      }
    }

    console.log(
      `[UPDATE_QUANTITY] Cookie header: ${cookieHeader.substring(0, 100)}...`
    );
    console.log(
      `[UPDATE_QUANTITY] Extracted wp_user_id: ${wpUserID || "not found"}`
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
    const { line_item_id, quantity } = body;

    if (!line_item_id) {
      return NextResponse.json(
        {
          success: false,
          error: "Missing required field: line_item_id",
        },
        { status: 400 }
      );
    }

    if (quantity === undefined || quantity === null) {
      return NextResponse.json(
        {
          success: false,
          error: "Missing required field: quantity",
        },
        { status: 400 }
      );
    }

    const quantityNum = parseInt(quantity, 10);
    if (isNaN(quantityNum) || quantityNum <= 0) {
      return NextResponse.json(
        {
          success: false,
          error: "Quantity must be a positive number",
        },
        { status: 400 }
      );
    }

    console.log(
      `[UPDATE_QUANTITY] Updating quantity for subscription ${subscriptionId}, line_item ${line_item_id} to ${quantityNum}`
    );

    const result = await updateQuantityInCRM(
      wpUserID,
      subscriptionId,
      line_item_id,
      quantityNum,
      request
    );

    return NextResponse.json({
      success: true,
      data: result,
    });
  } catch (error) {
    console.error("[UPDATE_QUANTITY] Error:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Failed to update quantity",
        details: error.message,
      },
      { status: 500 }
    );
  }
}

/**
 * Update quantity in CRM API
 * @param {string} wpUserID - WordPress user ID
 * @param {string} subscriptionId - Subscription ID
 * @param {number} lineItemId - Line item ID
 * @param {number} quantity - New quantity
 * @param {Request} request - The request object to get token from cookie
 */
async function updateQuantityInCRM(
  wpUserID,
  subscriptionId,
  lineItemId,
  quantity,
  request
) {
  const crmHost = process.env.CRM_HOST;

  if (!crmHost) {
    console.error("[UPDATE_QUANTITY] Missing CRM_HOST");
    return {
      status: false,
      message: "CRM configuration missing",
    };
  }

  console.log(`[UPDATE_QUANTITY] CRM Host: ${crmHost}`);

  try {
    const authToken = getTokenFromCookie(request);
    
    if (!authToken) {
      console.error("[UPDATE_QUANTITY] No token found in cookie");
      return {
        status: false,
        message: "Authentication token not found",
      };
    }

    console.log("[UPDATE_QUANTITY] Using token from cookie");

    const updateQuantityUrl = `${crmHost}/api/user/subscription/update/quantity/${subscriptionId}`;
    console.log(
      `[UPDATE_QUANTITY] Calling CRM endpoint: ${updateQuantityUrl}`
    );

    const payload = {
      line_item_id: parseInt(lineItemId, 10),
      quantity: quantity,
    };

    console.log(
      `[UPDATE_QUANTITY] Request payload:`,
      JSON.stringify(payload, null, 2)
    );

    const crmResponse = await fetch(updateQuantityUrl, {
      method: "PUT",
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
        `[UPDATE_QUANTITY] Failed to update quantity: ${crmResponse.status} ${crmResponse.statusText}`
      );
      console.error(`[UPDATE_QUANTITY] Error details: ${errorText}`);
      return {
        status: false,
        message: `Failed to update quantity: ${crmResponse.status} ${crmResponse.statusText}`,
        error: errorText,
      };
    }

    const responseData = await crmResponse.json();
    console.log("[UPDATE_QUANTITY] CRM response received");
    console.log(
      "[UPDATE_QUANTITY] Full CRM response:",
      JSON.stringify(responseData, null, 2)
    );

    console.log(
      `[UPDATE_QUANTITY] ✓ Successfully updated quantity for subscription ${subscriptionId}`
    );
    return responseData;
  } catch (error) {
    console.error(
      "[UPDATE_QUANTITY] Error updating quantity in CRM:",
      error
    );
    return {
      status: false,
      message: error.message || "Failed to update quantity",
    };
  }
}

