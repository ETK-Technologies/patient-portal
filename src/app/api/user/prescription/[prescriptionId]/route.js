import { NextResponse } from "next/server";
import { getTokenFromCookie } from "../../../utils/getTokenFromCookie";

/**
 * GET /api/user/prescription/[prescriptionId]
 *
 * Fetches a specific prescription by ID from CRM.
 * Uses the prescription endpoint: /api/user/prescription/{prescriptionId}
 *
 * Expected Response:
 * {
 *   "success": true,
 *   "data": {
 *     "status": true,
 *     "message": "Prescription data fetched successfully.",
 *     "data": { ... }
 *   }
 * }
 */
export async function GET(request, { params }) {
  try {
    const { prescriptionId } = await params;

    if (!prescriptionId) {
      return NextResponse.json(
        {
          success: false,
          error: "Prescription ID is required",
        },
        { status: 400 }
      );
    }

    console.log(`[PRESCRIPTION] Fetching prescription with ID: ${prescriptionId}`);
    const prescriptionData = await fetchPrescription(prescriptionId, request);

    if (prescriptionData.error) {
      return NextResponse.json(
        {
          success: false,
          error: prescriptionData.error,
          details: prescriptionData.details,
        },
        { status: prescriptionData.status || 500 }
      );
    }

    return NextResponse.json({
      success: true,
      data: prescriptionData,
    });
  } catch (error) {
    console.error("Error fetching prescription:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Failed to fetch prescription",
        details: error.message,
      },
      { status: 500 }
    );
  }
}

/**
 * Fetch prescription from CRM API
 * Uses the prescription endpoint: /api/user/prescription/{prescriptionId}
 */
async function fetchPrescription(prescriptionId, request) {
  const crmHost = process.env.CRM_HOST;

  if (!crmHost) {
    console.error("[PRESCRIPTION] Missing CRM_HOST");
    return {
      status: false,
      message: "CRM configuration missing",
      error: "Missing CRM credentials",
      status: 500,
    };
  }

  console.log(`[PRESCRIPTION] CRM Host: ${crmHost}`);

  try {
    const authToken = getTokenFromCookie(request);
    
    if (!authToken) {
      console.error("[PRESCRIPTION] No token found in cookie");
      return {
        status: false,
        message: "Authentication failed",
        error: "No authentication token found",
        status: 401,
      };
    }

    console.log("[PRESCRIPTION] Using token from cookie");

    const prescriptionUrl = `${crmHost}/api/user/prescription/${prescriptionId}`;
    console.log(
      `[PRESCRIPTION] Fetching prescription from: ${prescriptionUrl}`
    );

    const prescriptionResponse = await fetch(prescriptionUrl, {
      method: "GET",
      headers: {
        Authorization: `Bearer ${authToken}`,
        "Content-Type": "application/json",
        "is-patient-portal": "true",
      },
    });

    if (!prescriptionResponse.ok) {
      const errorText = await prescriptionResponse.text();
      console.error(
        `[PRESCRIPTION] Failed to fetch prescription: ${prescriptionResponse.status} ${prescriptionResponse.statusText}`
      );
      console.error(`[PRESCRIPTION] Error details: ${errorText}`);

      let errorDetails = errorText;
      try {
        const errorJson = JSON.parse(errorText);
        errorDetails = errorJson.message || errorJson.error || errorText;
      } catch {}

      return {
        status: false,
        message: `Failed to fetch: ${prescriptionResponse.status} ${prescriptionResponse.statusText}`,
        error: errorDetails,
        status: prescriptionResponse.status,
        details: errorText,
      };
    }

    const responseData = await prescriptionResponse.json();
    console.log("[PRESCRIPTION] CRM response received");
    console.log(
      "[PRESCRIPTION] Full CRM response:",
      JSON.stringify(responseData, null, 2)
    );

    let prescription = responseData;
    if (responseData.status && responseData.data) {
      prescription = {
        ...responseData,
        ...responseData.data,
      };
      console.log("[PRESCRIPTION] ✓ Extracted data from nested structure");
    }

    console.log(
      `[PRESCRIPTION] ✓ Successfully fetched prescription: ${prescriptionId}`
    );

    return prescription;
  } catch (error) {
    console.error(
      "[PRESCRIPTION] Error fetching prescription from CRM:",
      error
    );
    return {
      status: false,
      message: error.message || "Failed to fetch prescription",
      error: error.message,
      status: 500,
    };
  }
}





