import { NextResponse } from "next/server";
import { getTokenFromCookie } from "../../utils/getTokenFromCookie";

/**
 * GET /api/user/medical-profile
 *
 * Fetches medical profile data from CRM for the authenticated user.
 * Returns medical history information from the CRM medical profile endpoint.
 *
 * User ID can be provided in two ways:
 * 1. Query parameter: ?id={userData.id} or ?crmUserID={userData.id} (from UserContext)
 * 2. Cookies: userId from cookies (set during auto-login) - used as fallback
 *
 * Since userData is already available in UserContext on the frontend,
 * the frontend can pass userData.id as a query parameter.
 *
 * Expected Response:
 * {
 *   "success": true,
 *   "data": { ... }
 * }
 */
export async function GET(request) {
  try {
    // Get userId from cookies (set during auto-login)
    // Parse cookie header manually for compatibility
    const cookieHeader = request.headers.get("cookie") || "";
    let userId = null;

    if (cookieHeader) {
      // Parse cookies from header string
      const match = cookieHeader.match(/userId=([^;]+)/);
      if (match) {
        userId = decodeURIComponent(match[1].trim());
      }
    }

    console.log(
      `[MEDICAL_PROFILE] Cookie header: ${cookieHeader.substring(0, 100)}...`
    );
    console.log(`[MEDICAL_PROFILE] Extracted userId: ${userId || "not found"}`);

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
        `[MEDICAL_PROFILE] Using CRM user ID from query parameter (userData.id): ${crmUserID}`
      );
    } else {
      console.log(
        `[MEDICAL_PROFILE] Using userId from cookies as CRM user ID: ${crmUserID}`
      );
    }

    // Fetch medical profile data from CRM
    const medicalProfileData = await fetchMedicalProfile(crmUserID, request);

    // Ensure we always return a valid structure, even if there's an error
    if (medicalProfileData.error) {
      return NextResponse.json(
        {
          status: false,
          message:
            medicalProfileData.error || "Failed to fetch medical profile",
          error: medicalProfileData.error,
          data: medicalProfileData,
        },
        { status: 500 }
      );
    }

    // Ensure data structure is valid - match expected format
    // Expected: { status: true, message: "...", data: {...} }
    const responseData = {
      status: true,
      message: "User medical profile fetched successfully.",
      data: medicalProfileData || {},
    };

    return NextResponse.json(responseData);
  } catch (error) {
    console.error("Error fetching medical profile data:", error);
    return NextResponse.json(
      {
        status: false,
        message: "Failed to fetch medical profile data",
        error: "Failed to fetch medical profile data",
        details: error.message,
      },
      { status: 500 }
    );
  }
}

/**
 * Fetch medical profile data from CRM API
 * Uses the medical profile endpoint: /api/user/{crmUserID}/medical-profile
 * @param {string} crmUserID - CRM User ID
 * @param {Request} request - The request object to get token from cookie
 */
async function fetchMedicalProfile(crmUserID, request) {
  const crmHost = process.env.CRM_HOST;

  if (!crmHost) {
    console.error("[MEDICAL_PROFILE] Missing CRM_HOST");
    return {
      crmUserID: crmUserID,
      medicalProfile: [],
      medicalProfiles: [],
      error: "Missing CRM configuration",
    };
  }

  console.log(`[MEDICAL_PROFILE] CRM Host: ${crmHost}`);

  try {
    const authToken = getTokenFromCookie(request);
    
    if (!authToken) {
      console.error("[MEDICAL_PROFILE] No token found in cookie");
      return {
        crmUserID: crmUserID,
        medicalProfile: [],
        medicalProfiles: [],
        error: "Authentication token not found",
      };
    }

    console.log("[MEDICAL_PROFILE] Using token from cookie");

    // Step 2: Fetch medical profile data from CRM
    // Uses the medical profile endpoint: /api/user/{crmUserID}/medical-profile
    const medicalProfileUrl = `${crmHost}/api/user/${crmUserID}/medical-profile`;
    console.log(
      `[MEDICAL_PROFILE] Fetching medical profile data from: ${medicalProfileUrl}`
    );

    const medicalProfileResponse = await fetch(medicalProfileUrl, {
      method: "GET",
      headers: {
        Authorization: `Bearer ${authToken}`,
        "Content-Type": "application/json",
        "is-patient-portal": "true",
      },
    });

    if (!medicalProfileResponse.ok) {
      const errorText = await medicalProfileResponse.text();
      console.error(
        `[MEDICAL_PROFILE] Failed to fetch medical profile data: ${medicalProfileResponse.status} ${medicalProfileResponse.statusText}`
      );
      console.error(`[MEDICAL_PROFILE] Error details: ${errorText}`);
      return {
        crmUserID: crmUserID,
        error: `Failed to fetch: ${medicalProfileResponse.status} ${medicalProfileResponse.statusText}`,
      };
    }

    let responseData;
    try {
      responseData = await medicalProfileResponse.json();
      console.log("[MEDICAL_PROFILE] CRM response received");
      console.log(
        "[MEDICAL_PROFILE] Full CRM response:",
        JSON.stringify(responseData, null, 2)
      );
    } catch (jsonError) {
      console.error(
        "[MEDICAL_PROFILE] Failed to parse JSON response:",
        jsonError
      );
      return {
        crmUserID: crmUserID,
        error: "Invalid JSON response from CRM",
        medicalProfile: [],
        medicalProfiles: [],
      };
    }

    // Ensure response has the expected structure
    if (!responseData || typeof responseData !== "object") {
      console.error("[MEDICAL_PROFILE] Invalid response structure");
      return {
        crmUserID: crmUserID,
        error: "Invalid response structure from CRM",
        medicalProfile: [],
        medicalProfiles: [],
      };
    }

    // Extract data from the CRM response structure
    // CRM returns: { status: true, message: "...", data: {...} }
    let medicalProfileData = responseData;
    if (responseData.status && responseData.data) {
      medicalProfileData = responseData.data;
      console.log(
        "[MEDICAL_PROFILE] ✓ Extracted data from CRM response (data property)"
      );
    } else if (responseData.data) {
      medicalProfileData = responseData.data;
      console.log("[MEDICAL_PROFILE] ✓ Using data property from response");
    }

    console.log(
      `[MEDICAL_PROFILE] ✓ Successfully fetched medical profile data for user: ${crmUserID}`
    );
    return medicalProfileData;
  } catch (error) {
    console.error(
      "[MEDICAL_PROFILE] Error fetching medical profile data from CRM:",
      error
    );
    return {
      crmUserID: crmUserID,
      error: error.message,
    };
  }
}

/**
 * POST /api/user/medical-profile
 *
 * Updates medical profile data in CRM for the authenticated user.
 *
 * Expected Request Body:
 * {
 *   "id": 194761, // Optional: Use this field only during update
 *   "crm_user_id": 115961, // Required: CRM User ID
 *   "slug": "medication", // Required: Type of medical data
 *   "meta_value": "test1,test2" // Required: Comma-separated values
 * }
 *
 * Expected Response:
 * {
 *   "status": true,
 *   "message": "Medical profile updated successfully.",
 *   "data": { ... }
 * }
 */
export async function POST(request) {
  try {
    const body = await request.json();
    const { id, crm_user_id, slug, meta_value } = body;

    // Support both old format (crmUserID, medical_profile) and new format
    const crmUserID = crm_user_id || body.crmUserID;
    const metaValue = meta_value || body.medical_profile || "";

    if (!crmUserID || !slug) {
      return NextResponse.json(
        {
          status: false,
          message:
            "Please provide all required information to save your changes.",
          error: "Missing required fields: crm_user_id and slug",
        },
        { status: 400 }
      );
    }

    console.log(
      `[MEDICAL_PROFILE_UPDATE] Updating medical profile for user: ${crmUserID}, slug: ${slug}`
    );
    if (id) {
      console.log(`[MEDICAL_PROFILE_UPDATE] Update ID: ${id}`);
    }

    // Update medical profile data in CRM
    const updateResult = await updateMedicalProfile(
      crmUserID,
      slug,
      metaValue,
      id,
      request
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
      message: "Medical profile updated successfully.",
      data: updateResult.data || updateResult,
    });
  } catch (error) {
    console.error("Error updating medical profile data:", error);
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
 * Update medical profile data in CRM API
 * Uses the medical profile endpoint: PATCH /api/user/medical-profile/update
 * Request body: { id (optional), crm_user_id, slug, meta_value }
 * @param {string} crmUserID - CRM User ID
 * @param {string} slug - Type of medical data
 * @param {string} meta_value - Comma-separated values
 * @param {number|null} id - Optional ID for updates
 * @param {Request} request - The request object to get token from cookie
 */
async function updateMedicalProfile(crmUserID, slug, meta_value, id = null, request) {
  const crmHost = process.env.CRM_HOST;

  if (!crmHost) {
    console.error("[MEDICAL_PROFILE_UPDATE] Missing CRM_HOST");
    return {
      error: "Missing CRM configuration",
    };
  }

  try {
    const authToken = getTokenFromCookie(request);
    
    if (!authToken) {
      console.error("[MEDICAL_PROFILE_UPDATE] No token found in cookie");
      return {
        error: "Authentication token not found",
      };
    }

    console.log("[MEDICAL_PROFILE_UPDATE] Using token from cookie");

    // Step 2: Update medical profile data in CRM
    // Endpoint: PATCH /api/user/medical-profile/update
    const updateUrl = `${crmHost}/api/user/medical-profile/update`;
    console.log(
      `[MEDICAL_PROFILE_UPDATE] Updating medical profile at: ${updateUrl}`
    );

    // Build request body - include id only if provided (for updates)
    const requestBody = {
      crm_user_id: parseInt(crmUserID),
      slug: slug,
      meta_value: meta_value || "",
    };

    // Include id only if provided (for updates, not creation)
    if (id) {
      requestBody.id = parseInt(id);
    }

    console.log(`[MEDICAL_PROFILE_UPDATE] Request body:`, requestBody);

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

      // Try to get error message from response
      try {
        const errorText = await updateResponse.text();
        console.error(
          `[MEDICAL_PROFILE_UPDATE] Failed to update medical profile: ${updateResponse.status} ${updateResponse.statusText}`
        );
        console.error(`[MEDICAL_PROFILE_UPDATE] Error details: ${errorText}`);

        // Try to parse as JSON
        try {
          const errorData = JSON.parse(errorText);
          if (errorData.message) {
            errorMessage = errorData.message;
          } else if (errorData.error) {
            errorMessage = errorData.error;
          }
        } catch (jsonError) {
          // If JSON parsing fails, use status-based messages
          // Provide user-friendly messages based on status code
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
        // Fallback to status-based messages if reading response fails
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
      `[MEDICAL_PROFILE_UPDATE] ✓ Successfully updated medical profile for user: ${crmUserID}, slug: ${slug}`
    );
    console.log(
      `[MEDICAL_PROFILE_UPDATE] Full Response:`,
      JSON.stringify(responseData, null, 2)
    );

    // Extract data from the CRM response structure
    // CRM returns: { status: true, message: "...", data: {...} }
    let updateData = responseData;
    if (responseData.status && responseData.data) {
      updateData = responseData.data;
      console.log(
        "[MEDICAL_PROFILE_UPDATE] ✓ Extracted data from CRM response (data property)"
      );
    } else if (responseData.data) {
      updateData = responseData.data;
      console.log(
        "[MEDICAL_PROFILE_UPDATE] ✓ Using data property from response"
      );
    }

    return {
      data: updateData,
    };
  } catch (error) {
    console.error(
      "[MEDICAL_PROFILE_UPDATE] Error updating medical profile data from CRM:",
      error
    );
    return {
      error: "Unable to save your changes. Please try again later.",
    };
  }
}
