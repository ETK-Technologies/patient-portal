import { NextResponse } from "next/server";
import { getTokenFromCookie } from "../../utils/getTokenFromCookie";
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
    // Parse cookie header manually for compatibility
    const cookieHeader = request.headers.get("cookie") || "";
    let wpUserID = null;

    console.log(`[USER_PROFILE] Full cookie header: ${cookieHeader}`);
    console.log(`[USER_PROFILE] Cookie header length: ${cookieHeader.length}`);

    if (cookieHeader) {
      const match = cookieHeader.match(/wp_user_id=([^;]+)/);
      if (match) {
        wpUserID = decodeURIComponent(match[1].trim());
        console.log(`[USER_PROFILE] Found wp_user_id via regex: ${wpUserID}`);
      } else {
        const cookies = cookieHeader.split(";").map(c => c.trim());
        console.log(`[USER_PROFILE] All cookies:`, cookies);
        
        for (const cookie of cookies) {
          if (cookie.startsWith("wp_user_id=")) {
            wpUserID = decodeURIComponent(cookie.substring("wp_user_id=".length).trim());
            console.log(`[USER_PROFILE] Found wp_user_id via split: ${wpUserID}`);
            break;
          }
        }
      }
    }

    console.log(`[USER_PROFILE] Final extracted wp_user_id: ${wpUserID || "not found"}`);

    if (!wpUserID) {
      console.error(`[USER_PROFILE] Authentication failed - wp_user_id not found in cookies`);
      console.error(`[USER_PROFILE] Available cookies in header: ${cookieHeader}`);
      return NextResponse.json(
        {
          status: false,
          message: "User not authenticated",
          error: "User not authenticated - wp_user_id cookie not found",
        },
        { status: 401 }
      );
    }

    console.log(`[USER_PROFILE] Fetching profile for user: ${wpUserID}`);

    // Fetch user data from CRM
    const userData = await fetchUserData(wpUserID, request);

    return NextResponse.json({
      status: true,
      message: "User profile fetched successfully.",
      user: userData,
    });
  } catch (error) {
    console.error("Error fetching user profile:", error);
    return NextResponse.json(
      {
        status: false,
        message: "Failed to fetch user profile",
        error: "Failed to fetch user profile",
        details: error.message,
      },
      { status: 500 }
    );
  }
}

/**
 * Fetch user data from CRM API
 * Uses the personal profile endpoint: /api/user/profile?wp_user_id={wpUserID}
 */
async function fetchUserData(wpUserID, request) {
  const crmHost = process.env.CRM_HOST;

  if (!crmHost) {
    console.error("[USER_PROFILE] Missing CRM_HOST");
    return {
      wp_user_id: wpUserID,
    };
  }

  console.log(`[USER_PROFILE] CRM Host: ${crmHost}`);

  try {
    const authToken = getTokenFromCookie(request);
    
    if (!authToken) {
      console.error("[USER_PROFILE] No token found in cookie");
      return {
        wp_user_id: wpUserID,
      };
    }

    console.log("[USER_PROFILE] Using token from cookie");

    // Step 2: Fetch user profile from CRM
    const profileUrl = `${crmHost}/api/user/profile?wp_user_id=${wpUserID}`;
    console.log(`[USER_PROFILE] Fetching user profile from: ${profileUrl}`);

    const profileResponse = await fetch(profileUrl, {
      method: "GET",
      headers: {
        Authorization: `Bearer ${authToken}`,
        "Content-Type": "application/json",
        "is-patient-portal": "true",
      },
    });
    console.log("[USER_PROFILE] Profile response:", profileResponse.data);
    if (!profileResponse.ok) {
      console.error(
        `[USER_PROFILE] Failed to fetch user profile: ${profileResponse.status} ${profileResponse.statusText}`
      );
      const errorText = await profileResponse.text();
      console.error(`[USER_PROFILE] Error details: ${errorText}`);
      return {
        wp_user_id: wpUserID,
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
    // CRM returns: { status: true, message: "...", user: {...} }
    // or: { status: true, message: "...", data: { user: {...} } }
    if (responseData.status) {
      // Check for new structure: { status: true, message: "...", user: {...} }
      if (responseData.user) {
        const userData = responseData.user;
        if (!userData.wp_user_id && wpUserID) {
          userData.wp_user_id = wpUserID;
        }
        console.log(
          "[USER_PROFILE] ✓ Extracted user data from CRM response (top-level user)"
        );
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
      }
      // Check for old structure: { status: true, message: "...", data: { user: {...} } }
      else if (responseData.data) {
        if (responseData.data.user) {
          const userData = responseData.data.user;
          if (!userData.wp_user_id && wpUserID) {
            userData.wp_user_id = wpUserID;
          }
          console.log(
            "[USER_PROFILE] ✓ Extracted user data from CRM response (data.user)"
          );
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
      wp_user_id: wpUserID,
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

    // Parse request body - handle both JSON and FormData
    const contentType = request.headers.get("content-type") || "";
    let field, value, file;

    if (contentType.includes("multipart/form-data")) {
      // Handle FormData (file uploads)
      const formData = await request.formData();
      field = formData.get("field");
      file = formData.get("file");

      console.log(`[USER_PROFILE_UPDATE] File upload for field: ${field}`);
      console.log(`[USER_PROFILE_UPDATE] File name: ${file?.name}`);
      console.log(`[USER_PROFILE_UPDATE] File size: ${file?.size} bytes`);
      console.log(`[USER_PROFILE_UPDATE] File type: ${file?.type}`);

      // For file uploads, we'll handle the file directly
      value = file;
    } else {
      // Handle JSON (regular fields)
      const body = await request.json();
      field = body.field;
      value = body.value;

      console.log(`[USER_PROFILE_UPDATE] Updating field: ${field}`);
      console.log(`[USER_PROFILE_UPDATE] Field value received:`, value);
      console.log(`[USER_PROFILE_UPDATE] Field value type:`, typeof value);
    }

    // Map profile field names to CRM API field names
    // Only phone_number, photo_id, and insurance_card_image can be updated via patient portal
    const fieldMapping = {
      phoneNumber: (val) => ({ phone_number: val }),
      photoId: (val) => {
        // If it's a File object, return it as-is for form-data handling
        if (val instanceof File) {
          return { photo_id: val };
        }
        return { photo_id: val };
      },
      insuranceCard: (val) => {
        // If it's a File object, return it as-is for form-data handling
        if (val instanceof File) {
          return { insurance_card_image: val };
        }
        return { insurance_card_image: val };
      },
    };

    const mapper = fieldMapping[field];
    if (!mapper) {
      return NextResponse.json(
        {
          status: false,
          message: `Field '${field}' cannot be updated via patient portal. Only phone_number, photo_id, and insurance_card_image can be updated.`,
          error: `Field '${field}' is not allowed for update`,
        },
        { status: 400 }
      );
    }

    const updateData = mapper(value);
    if (!updateData) {
      return NextResponse.json(
        {
          status: false,
          message: `Invalid value for field: ${field}`,
          error: `Invalid value for field: ${field}`,
        },
        { status: 400 }
      );
    }

    console.log(`[USER_PROFILE_UPDATE] Update data:`, updateData);

    // Update profile in CRM
    const updateResult = await updateUserProfile(userId, updateData, request);

    if (!updateResult.success) {
      return NextResponse.json(
        {
          status: false,
          message: updateResult.error || "Failed to update profile",
          error: updateResult.error || "Failed to update profile",
          details: updateResult.details,
        },
        { status: updateResult.status || 500 }
      );
    }

    return NextResponse.json({
      status: true,
      message: "Profile updated successfully.",
      user: updateResult.data,
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
 * Uses the profile-update endpoint: /api/user/{userId}/profile/update
 */
async function updateUserProfile(userId, updateData, request) {
  const crmHost = process.env.CRM_HOST;

  if (!crmHost) {
    console.error("[USER_PROFILE_UPDATE] Missing CRM_HOST");
    return {
      success: false,
      error: "CRM configuration missing",
      status: 500,
    };
  }

  try {
    const authToken = getTokenFromCookie(request);
    
    if (!authToken) {
      console.error("[USER_PROFILE_UPDATE] No token found in cookie");
      return {
        success: false,
        error: "Authentication token not found",
        status: 401,
      };
    }

    console.log("[USER_PROFILE_UPDATE] Using token from cookie");

    // Step 2: Update user profile in CRM
    const updateUrl = `${crmHost}/api/user/${userId}/profile/update`;
    console.log(`[USER_PROFILE_UPDATE] Updating profile at: ${updateUrl}`);
    console.log(`[USER_PROFILE_UPDATE] User ID: ${userId}`);
    console.log(`[USER_PROFILE_UPDATE] Update data:`, updateData);

    // Create form-data payload using form-data package (multipart/form-data)
    const formData = new FormData();

    // Ensure user_id is a string
    formData.append("user_id", String(userId));
    console.log(`[USER_PROFILE_UPDATE] Added user_id to formData: ${userId}`);

    // Append all update data fields to form-data
    // Note: We need to handle File objects asynchronously
    for (const key of Object.keys(updateData)) {
      const value = updateData[key];

      // Handle File objects (for photo_id and insurance_card_image)
      if (value instanceof File) {
        // Convert File to Buffer for form-data package
        const arrayBuffer = await value.arrayBuffer();
        const buffer = Buffer.from(arrayBuffer);
        formData.append(key, buffer, {
          filename: value.name,
          contentType: value.type || "application/octet-stream",
        });
        console.log(
          `[USER_PROFILE_UPDATE] Added file ${key} = ${value.name} (size: ${value.size} bytes, type: ${value.type})`
        );
      }
      // For date_of_birth, always send it even if it's an empty string
      else if (key === "date_of_birth") {
        const stringValue =
          value !== null && value !== undefined ? String(value) : "";
        formData.append(key, stringValue);
        console.log(
          `[USER_PROFILE_UPDATE] Added ${key} = "${stringValue}" (always sent for date_of_birth)`
        );
      } else if (value !== null && value !== undefined) {
        const stringValue = String(value);
        formData.append(key, stringValue);
        console.log(
          `[USER_PROFILE_UPDATE] Added ${key} = ${stringValue} (type: ${typeof value})`
        );
      } else {
        console.log(
          `[USER_PROFILE_UPDATE] Skipping ${key} (value is null/undefined)`
        );
      }
    }

    // Log all form-data entries for debugging
    console.log(`[USER_PROFILE_UPDATE] Form-data entries being sent:`);
    console.log(`[USER_PROFILE_UPDATE] - user_id: ${userId}`);
    Object.keys(updateData).forEach((key) => {
      const value = updateData[key];
      if (key === "date_of_birth") {
        console.log(
          `[USER_PROFILE_UPDATE] - ${key}: "${value !== null && value !== undefined ? String(value) : ""
          }"`
        );
      } else if (value !== null && value !== undefined) {
        console.log(`[USER_PROFILE_UPDATE] - ${key}: "${String(value)}"`);
      }
    });

    // Get the headers from form-data (includes Content-Type with boundary)
    const formHeaders = formData.getHeaders();
    console.log(`[USER_PROFILE_UPDATE] Form headers:`, formHeaders);
    console.log(
      `[USER_PROFILE_UPDATE] Content-Type:`,
      formHeaders["content-type"]
    );

    // Convert form-data stream to buffer for Node.js fetch compatibility
    // The form-data package creates a stream that needs to be converted to buffer
    const formDataBuffer = await new Promise((resolve, reject) => {
      const chunks = [];

      // Set up stream handlers before reading
      formData.on("data", (chunk) => {
        chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk));
      });

      formData.on("end", () => {
        try {
          const buffer = Buffer.concat(chunks);
          console.log(
            `[USER_PROFILE_UPDATE] Form data buffer created: ${buffer.length} bytes`
          );
          console.log(
            `[USER_PROFILE_UPDATE] Buffer preview (first 200 chars):`,
            buffer.toString("utf8").substring(0, 200)
          );
          resolve(buffer);
        } catch (err) {
          reject(err);
        }
      });

      formData.on("error", (err) => {
        console.error(`[USER_PROFILE_UPDATE] Form data stream error:`, err);
        reject(err);
      });

      // The form-data stream is already readable, we just need to consume it
      // Reading from the stream will trigger the data/end events
      if (formData.readable) {
        formData.resume();
      }
    });

    console.log(
      `[USER_PROFILE_UPDATE] Form data buffer ready: ${formDataBuffer.length} bytes`
    );

    // Send the form-data buffer to the CRM API
    const updateResponse = await fetch(updateUrl, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${authToken}`,
        "is-patient-portal": "true",
        ...formHeaders, // This includes Content-Type with boundary
      },
      body: formDataBuffer, // Send as buffer
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
    console.log(
      "[USER_PROFILE_UPDATE] Full Response:",
      JSON.stringify(responseData, null, 2)
    );

    // Extract user data from the CRM response structure
    // CRM returns: { status: true, message: "Profile updated successfully.", user: {...} }
    // or: { status: true, message: "...", data: { user: {...} } }
    let userData = null;
    if (responseData.status) {
      if (responseData.user) {
        userData = responseData.user;
        console.log(
          "[USER_PROFILE_UPDATE] ✓ Extracted user data from CRM response (top-level user)"
        );
        console.log(
          "[USER_PROFILE_UPDATE] User data keys:",
          Object.keys(userData)
        );
        console.log(
          "[USER_PROFILE_UPDATE] date_of_birth in response:",
          userData.date_of_birth
        );
      } else if (responseData.data && responseData.data.user) {
        userData = responseData.data.user;
        console.log(
          "[USER_PROFILE_UPDATE] ✓ Extracted user data from CRM response (data.user)"
        );
        console.log(
          "[USER_PROFILE_UPDATE] User data keys:",
          Object.keys(userData)
        );
        console.log(
          "[USER_PROFILE_UPDATE] date_of_birth in response:",
          userData.date_of_birth
        );
      } else if (responseData.data) {
        userData = responseData.data;
        console.log("[USER_PROFILE_UPDATE] ✓ Using data as user data");
        console.log("[USER_PROFILE_UPDATE] Data keys:", Object.keys(userData));
      }
    }

    return {
      success: true,
      data: userData || responseData,
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
