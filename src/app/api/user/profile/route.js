import { NextResponse } from "next/server";
import { authenticateWithCRM } from "../../utils/crmAuth";
import FormData from "form-data";

/**
 * GET /api/user/profile
 *
 * Fetches user profile data from CRM.
 * Returns user information from the CRM personal profile endpoint.
 *
 * Expected Response:
 * {
 *   "success": true,
 *   "userData": {
 *     "id": "123",
 *     "name": "John Doe",
 *     "email": "user@example.com",
 *     ...
 *   }
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
      `[USER_PROFILE] Cookie header: ${cookieHeader.substring(0, 100)}...`
    );
    console.log(`[USER_PROFILE] Extracted userId: ${userId || "not found"}`);

    if (!userId) {
      return NextResponse.json(
        {
          success: false,
          error: "User not authenticated",
        },
        { status: 401 }
      );
    }

    console.log(`[USER_PROFILE] Fetching profile for user: ${userId}`);

    // Fetch user data from CRM
    const userData = await fetchUserData(userId);

    return NextResponse.json({
      success: true,
      userData,
    });
  } catch (error) {
    console.error("Error fetching user profile:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Failed to fetch user profile",
        details: error.message,
      },
      { status: 500 }
    );
  }
}

/**
 * Fetch user data from CRM API
 * Uses the personal profile endpoint: /api/crm-users/{userId}/edit/personal-profile
 */
async function fetchUserData(userId) {
  const crmHost = process.env.CRM_HOST;
  const apiUsername = process.env.CRM_API_USERNAME;
  const apiPasswordEncoded = process.env.CRM_API_PASSWORD;

  if (!crmHost || !apiUsername || !apiPasswordEncoded) {
    console.error("[USER_PROFILE] Missing CRM credentials:");
    console.error({
      crmHost: crmHost || "MISSING",
      apiUsername: apiUsername ? "SET" : "MISSING",
      apiPasswordEncoded: apiPasswordEncoded ? "SET" : "MISSING",
    });
    return {
      id: userId,
    };
  }

  console.log(`[USER_PROFILE] CRM Host: ${crmHost}`);
  console.log(`[USER_PROFILE] CRM Username: ${apiUsername}`);

  try {
    // Decode the password - try base64 first, fallback to plain text
    let apiPassword;
    try {
      // Try to decode as base64
      const decoded = Buffer.from(apiPasswordEncoded, "base64").toString(
        "utf8"
      );
      // Check if decoded value is valid and reasonable
      // If the decoded string is the same as input or contains many non-printable chars, use plain text
      const hasNonPrintable = /[\x00-\x08\x0E-\x1F\x7F-\x9F]/.test(decoded);
      const isSameAsInput = decoded === apiPasswordEncoded;

      if (!hasNonPrintable && !isSameAsInput && decoded.length > 0) {
        apiPassword = decoded;
        console.log("[USER_PROFILE] Password decoded from base64");
      } else {
        apiPassword = apiPasswordEncoded;
        console.log("[USER_PROFILE] Using password as plain text");
      }
    } catch (decodeError) {
      // If base64 decode fails, use as plain text
      apiPassword = apiPasswordEncoded;
      console.log(
        "[USER_PROFILE] Base64 decode failed, using password as plain text"
      );
    }

    // Step 1: Authenticate with CRM to get auth token
    console.log("[USER_PROFILE] Authenticating with CRM...");
    const authResult = await authenticateWithCRM(
      crmHost,
      apiUsername,
      apiPassword
    );

    if (!authResult.success) {
      console.error(
        `[USER_PROFILE] CRM authentication failed: ${authResult.error}`
      );
      if (authResult.endpoint) {
        console.error(`[USER_PROFILE] Failed endpoint: ${authResult.endpoint}`);
      }
      return {
        id: userId,
      };
    }

    const authToken = authResult.token;
    console.log(
      `[USER_PROFILE] Successfully obtained CRM auth token from ${authResult.endpoint}`
    );

    // Step 2: Fetch user profile from CRM
    const profileUrl = `${crmHost}/api/crm-users/${userId}/edit/personal-profile`;
    console.log(`[USER_PROFILE] Fetching user profile from: ${profileUrl}`);

    const profileResponse = await fetch(profileUrl, {
      method: "GET",
      headers: {
        Authorization: `Bearer ${authToken}`,
        "Content-Type": "application/json",
      },
    });

    if (!profileResponse.ok) {
      console.error(
        `[USER_PROFILE] Failed to fetch user profile: ${profileResponse.status} ${profileResponse.statusText}`
      );
      const errorText = await profileResponse.text();
      console.error(`[USER_PROFILE] Error details: ${errorText}`);
      return {
        id: userId,
      };
    }

    const responseData = await profileResponse.json();
    console.log("[USER_PROFILE] CRM response received");
    console.log("[USER_PROFILE] Response status:", responseData.status);
    console.log("[USER_PROFILE] Response keys:", Object.keys(responseData));

    if (responseData.data) {
      console.log(
        "[USER_PROFILE] Response.data keys:",
        Object.keys(responseData.data)
      );
    }

    // Extract user data from the CRM response structure
    // CRM returns: { status: true, message: "...", data: { user: {...} } }
    if (responseData.status && responseData.data) {
      if (responseData.data.user) {
        const userData = responseData.data.user;
        console.log("[USER_PROFILE] ✓ Extracted user data from CRM response");
        console.log(
          "[USER_PROFILE] User data keys:",
          Object.keys(userData).slice(0, 10)
        );
        console.log(
          "[USER_PROFILE] User name:",
          userData.name || userData.first_name
        );
        console.log("[USER_PROFILE] User email:", userData.email);
        return userData;
      } else {
        console.error("[USER_PROFILE] Response has data but no user object");
        console.error(
          "[USER_PROFILE] Data keys:",
          Object.keys(responseData.data)
        );
      }
    }

    // Fallback: return the response as-is if structure is different
    console.error("[USER_PROFILE] ✗ Unexpected response structure");
    console.error(
      "[USER_PROFILE] Full response:",
      JSON.stringify(responseData, null, 2).substring(0, 500)
    );

    // Try to return data if it exists, otherwise return the whole response
    if (responseData.data) {
      return responseData.data;
    }

    return responseData;
  } catch (error) {
    console.error("[USER_PROFILE] Error fetching user data from CRM:", error);
    return {
      id: userId,
    };
  }
}

/**
 * POST /api/user/profile
 *
 * Updates user profile data in CRM.
 * Accepts profile updates and sends them to the CRM profile-update endpoint.
 *
 * Expected Request Body:
 * {
 *   "field": "fullName" | "email" | "phoneNumber" | etc.,
 *   "value": "new value" | { firstName: "...", lastName: "..." }
 * }
 */
export async function POST(request) {
  try {
    // Get userId from cookies
    const cookieHeader = request.headers.get("cookie") || "";
    let userId = null;

    if (cookieHeader) {
      const match = cookieHeader.match(/userId=([^;]+)/);
      if (match) {
        userId = decodeURIComponent(match[1].trim());
      }
    }

    console.log(
      `[USER_PROFILE_UPDATE] Extracted userId: ${userId || "not found"}`
    );

    if (!userId) {
      return NextResponse.json(
        {
          success: false,
          error: "User not authenticated",
        },
        { status: 401 }
      );
    }

    // Parse request body
    const body = await request.json();
    const { field, value } = body;

    console.log(`[USER_PROFILE_UPDATE] Updating field: ${field}`);

    // Map profile field names to CRM API field names
    const fieldMapping = {
      fullName: (val) => {
        // Handle name as object with firstName and lastName
        if (typeof val === "object" && val.firstName !== undefined) {
          return {
            first_name: val.firstName,
            last_name: val.lastName || "",
          };
        }
        return null;
      },
      email: (val) => ({ email: val }),
      phoneNumber: (val) => ({ phone_number: val }),
      dateOfBirth: (val) => ({ date_of_birth: val }),
      address: (val) => ({ address: val }),
      city: (val) => ({ city: val }),
      province: (val) => ({ province: val }),
      postalCode: (val) => ({ postal_code: val }),
      photoId: (val) => ({ photo_id: val }),
      insuranceCard: (val) => ({ insurance_card_image: val }),
    };

    const mapper = fieldMapping[field];
    if (!mapper) {
      return NextResponse.json(
        {
          success: false,
          error: `Unknown field: ${field}`,
        },
        { status: 400 }
      );
    }

    const updateData = mapper(value);
    if (!updateData) {
      return NextResponse.json(
        {
          success: false,
          error: `Invalid value for field: ${field}`,
        },
        { status: 400 }
      );
    }

    console.log(`[USER_PROFILE_UPDATE] Update data:`, updateData);

    // Update profile in CRM
    const updateResult = await updateUserProfile(userId, updateData);

    if (!updateResult.success) {
      return NextResponse.json(
        {
          success: false,
          error: updateResult.error || "Failed to update profile",
          details: updateResult.details,
        },
        { status: updateResult.status || 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: "Profile updated successfully",
      data: updateResult.data,
    });
  } catch (error) {
    console.error("[USER_PROFILE_UPDATE] Error updating profile:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Failed to update profile",
        details: error.message,
      },
      { status: 500 }
    );
  }
}

/**
 * Update user profile in CRM API
 * Uses the profile-update endpoint: /api/crm-users/profile-update
 */
async function updateUserProfile(userId, updateData) {
  const crmHost = process.env.CRM_HOST;
  const apiUsername = process.env.CRM_API_USERNAME;
  const apiPasswordEncoded = process.env.CRM_API_PASSWORD;

  if (!crmHost || !apiUsername || !apiPasswordEncoded) {
    console.error("[USER_PROFILE_UPDATE] Missing CRM credentials");
    return {
      success: false,
      error: "CRM configuration missing",
      status: 500,
    };
  }

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
        console.log("[USER_PROFILE_UPDATE] Password decoded from base64");
      } else {
        apiPassword = apiPasswordEncoded;
        console.log("[USER_PROFILE_UPDATE] Using password as plain text");
      }
    } catch (decodeError) {
      apiPassword = apiPasswordEncoded;
      console.log(
        "[USER_PROFILE_UPDATE] Using password as plain text (base64 decode failed)"
      );
    }

    // Step 1: Authenticate with CRM to get auth token
    console.log("[USER_PROFILE_UPDATE] Authenticating with CRM...");
    const authResult = await authenticateWithCRM(
      crmHost,
      apiUsername,
      apiPassword
    );

    if (!authResult.success) {
      console.error(
        `[USER_PROFILE_UPDATE] CRM authentication failed: ${authResult.error}`
      );
      return {
        success: false,
        error: `CRM authentication failed: ${authResult.error}`,
        status: 500,
      };
    }

    const authToken = authResult.token;
    console.log(
      `[USER_PROFILE_UPDATE] Successfully obtained CRM auth token from ${authResult.endpoint}`
    );

    // Step 2: Update user profile in CRM
    const updateUrl = `${crmHost}/api/crm-users/profile-update`;
    console.log(`[USER_PROFILE_UPDATE] Updating profile at: ${updateUrl}`);
    console.log(`[USER_PROFILE_UPDATE] User ID: ${userId}`);
    console.log(`[USER_PROFILE_UPDATE] Update data:`, updateData);

    // Create form-data payload using form-data package (multipart/form-data)
    const formData = new FormData();

    // Ensure user_id is a string
    formData.append("user_id", String(userId));
    console.log(`[USER_PROFILE_UPDATE] Added user_id to formData: ${userId}`);

    // Append all update data fields to form-data
    Object.keys(updateData).forEach((key) => {
      const value = updateData[key];
      if (value !== null && value !== undefined) {
        const stringValue = String(value);
        formData.append(key, stringValue);
        console.log(`[USER_PROFILE_UPDATE] Added ${key} = ${stringValue}`);
      }
    });

    console.log(
      `[USER_PROFILE_UPDATE] Total form data fields: user_id + ${
        Object.keys(updateData).length
      } fields`
    );

    // Get the headers from form-data (includes Content-Type with boundary)
    const formHeaders = formData.getHeaders();
    console.log(`[USER_PROFILE_UPDATE] Form headers:`, formHeaders);

    // Use form-data's stream directly with proper handling
    // form-data needs to be used as a stream, but fetch in Node.js can handle it
    // Try using formData.getLength() to trigger the stream preparation
    try {
      const length = await new Promise((resolve, reject) => {
        formData.getLength((err, length) => {
          if (err) reject(err);
          else resolve(length);
        });
      });
      console.log(`[USER_PROFILE_UPDATE] Form data length: ${length} bytes`);
    } catch (lengthError) {
      console.warn(
        `[USER_PROFILE_UPDATE] Could not get form data length:`,
        lengthError
      );
    }

    // Note: Using POST method to match Postman (works in Postman)
    // Pass formData directly as body - Node.js fetch should handle the stream
    const updateResponse = await fetch(updateUrl, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${authToken}`,
        ...formHeaders, // This includes Content-Type with boundary
      },
      body: formData, // Pass the stream directly
    });

    if (!updateResponse.ok) {
      const errorText = await updateResponse.text();
      console.error(
        `[USER_PROFILE_UPDATE] Failed to update profile: ${updateResponse.status} ${updateResponse.statusText}`
      );
      console.error(`[USER_PROFILE_UPDATE] Error details: ${errorText}`);

      let errorDetails;
      try {
        errorDetails = JSON.parse(errorText);
      } catch {
        errorDetails = errorText;
      }

      return {
        success: false,
        error: `Failed to update profile: ${updateResponse.status} ${updateResponse.statusText}`,
        details: errorDetails,
        status: updateResponse.status,
      };
    }

    const responseData = await updateResponse.json();
    console.log("[USER_PROFILE_UPDATE] Profile update response received");
    console.log("[USER_PROFILE_UPDATE] Response:", responseData);

    return {
      success: true,
      data: responseData,
    };
  } catch (error) {
    console.error("[USER_PROFILE_UPDATE] Error updating user profile:", error);
    return {
      success: false,
      error: `Error updating profile: ${error.message}`,
      status: 500,
    };
  }
}
