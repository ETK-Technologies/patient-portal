import { NextResponse } from "next/server";
import { authenticateWithCRM } from "../../utils/crmAuth";

/**
 * GET /api/user/documents
 *
 * Fetches user documents data from CRM for the authenticated user.
 * Returns documents information from the CRM documents endpoint.
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
      `[USER_DOCUMENTS] Cookie header: ${cookieHeader.substring(0, 100)}...`
    );
    console.log(`[USER_DOCUMENTS] Extracted userId: ${userId || "not found"}`);

    // Check if CRM user ID is passed as query parameter (from frontend context)
    const searchParams = request.nextUrl.searchParams;
    const crmUserIDFromQuery = searchParams.get("crmUserID") || searchParams.get("id");

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
      console.log(`[USER_DOCUMENTS] Using CRM user ID from query parameter (userData.id): ${crmUserID}`);
    } else {
      console.log(`[USER_DOCUMENTS] Using userId from cookies as CRM user ID: ${crmUserID}`);
    }

    // Fetch documents from CRM
    const documentsData = await fetchDocuments(crmUserID);

    return NextResponse.json({
      success: true,
      data: documentsData,
    });
  } catch (error) {
    console.error("Error fetching documents:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Failed to fetch documents",
        details: error.message,
      },
      { status: 500 }
    );
  }
}

/**
 * POST /api/user/documents
 *
 * Creates or updates user documents data in CRM for the authenticated user.
 * Accepts document data and sends it to the CRM documents endpoint.
 * 
 * User ID can be provided in two ways:
 * 1. Query parameter: ?id={userData.id} or ?crmUserID={userData.id} (from UserContext)
 * 2. Cookies: userId from cookies (set during auto-login) - used as fallback
 *
 * Expected Request Body:
 * {
 *   "document": "...",
 *   ...
 * }
 */
export async function POST(request) {
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
    const crmUserIDFromQuery = searchParams.get("crmUserID") || searchParams.get("id");

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
      console.log(`[USER_DOCUMENTS_UPDATE] Using CRM user ID from query parameter (userData.id): ${crmUserID}`);
    } else {
      console.log(`[USER_DOCUMENTS_UPDATE] Using userId from cookies as CRM user ID: ${crmUserID}`);
    }

    // Parse request body
    const body = await request.json();
    console.log(`[USER_DOCUMENTS_UPDATE] Updating documents for user: ${crmUserID}`);

    // Update documents in CRM
    const updateResult = await updateDocuments(crmUserID, body);

    if (!updateResult.success) {
      return NextResponse.json(
        {
          success: false,
          error: updateResult.error || "Failed to update documents",
          details: updateResult.details,
        },
        { status: updateResult.status || 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: "Documents updated successfully",
      data: updateResult.data,
    });
  } catch (error) {
    console.error("Error updating documents:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Failed to update documents",
        details: error.message,
      },
      { status: 500 }
    );
  }
}

/**
 * PUT /api/user/documents
 *
 * Updates user documents data in CRM for the authenticated user.
 * Same as POST but using PUT method.
 */
export async function PUT(request) {
  // Reuse POST handler logic
  return POST(request);
}

/**
 * Fetch documents from CRM API
 * Uses the documents endpoint: /api/user/{crmUserID}/documents
 */
async function fetchDocuments(crmUserID) {
  const crmHost = process.env.CRM_HOST;
  const apiUsername = process.env.CRM_API_USERNAME;
  const apiPasswordEncoded = process.env.CRM_API_PASSWORD;

  if (!crmHost || !apiUsername || !apiPasswordEncoded) {
    console.error("[USER_DOCUMENTS] Missing CRM credentials:");
    console.error({
      crmHost: crmHost || "MISSING",
      apiUsername: apiUsername ? "SET" : "MISSING",
      apiPasswordEncoded: apiPasswordEncoded ? "SET" : "MISSING",
    });
    return {
      id: crmUserID,
    };
  }

  console.log(`[USER_DOCUMENTS] CRM Host: ${crmHost}`);
  console.log(`[USER_DOCUMENTS] CRM Username: ${apiUsername}`);

  try {
    // Decode the password - try base64 first, fallback to plain text
    let apiPassword;
    try {
      // Try to decode as base64
      const decoded = Buffer.from(apiPasswordEncoded, "base64").toString(
        "utf8"
      );
      // Check if decoded value is valid and reasonable
      const hasNonPrintable = /[\x00-\x08\x0E-\x1F\x7F-\x9F]/.test(decoded);
      const isSameAsInput = decoded === apiPasswordEncoded;

      if (!hasNonPrintable && !isSameAsInput && decoded.length > 0) {
        apiPassword = decoded;
        console.log("[USER_DOCUMENTS] Password decoded from base64");
      } else {
        apiPassword = apiPasswordEncoded;
        console.log("[USER_DOCUMENTS] Using password as plain text");
      }
    } catch (decodeError) {
      // If base64 decode fails, use as plain text
      apiPassword = apiPasswordEncoded;
      console.log(
        "[USER_DOCUMENTS] Base64 decode failed, using password as plain text"
      );
    }

    // Step 1: Authenticate with CRM to get auth token
    console.log("[USER_DOCUMENTS] Authenticating with CRM...");
    const authResult = await authenticateWithCRM(
      crmHost,
      apiUsername,
      apiPassword
    );

    if (!authResult.success) {
      console.error(
        `[USER_DOCUMENTS] CRM authentication failed: ${authResult.error}`
      );
      if (authResult.endpoint) {
        console.error(`[USER_DOCUMENTS] Failed endpoint: ${authResult.endpoint}`);
      }
      return {
        id: crmUserID,
      };
    }

    const authToken = authResult.token;
    console.log(
      `[USER_DOCUMENTS] Successfully obtained CRM auth token from ${authResult.endpoint}`
    );

    // Step 2: Fetch documents from CRM
    const documentsUrl = `${crmHost}/api/user/${crmUserID}/documents`;
    console.log(`[USER_DOCUMENTS] Fetching documents from: ${documentsUrl}`);

    const documentsResponse = await fetch(documentsUrl, {
      method: "GET",
      headers: {
        Authorization: `Bearer ${authToken}`,
        "Content-Type": "application/json",
      },
    });

    if (!documentsResponse.ok) {
      const errorText = await documentsResponse.text();
      console.error(
        `[USER_DOCUMENTS] Failed to fetch documents: ${documentsResponse.status} ${documentsResponse.statusText}`
      );
      console.error(`[USER_DOCUMENTS] Error details: ${errorText}`);
      return {
        id: crmUserID,
        error: `Failed to fetch: ${documentsResponse.status} ${documentsResponse.statusText}`,
      };
    }

    const responseData = await documentsResponse.json();
    console.log("[USER_DOCUMENTS] CRM response received");
    console.log("[USER_DOCUMENTS] Full CRM response:", JSON.stringify(responseData, null, 2));

    console.log(`[USER_DOCUMENTS] ✓ Successfully fetched documents for user: ${crmUserID}`);
    return responseData;
  } catch (error) {
    console.error("[USER_DOCUMENTS] Error fetching documents from CRM:", error);
    return {
      id: crmUserID,
      error: error.message,
    };
  }
}

/**
 * Update documents in CRM API
 * Uses the documents endpoint: /api/user/{crmUserID}/documents
 */
async function updateDocuments(crmUserID, updateData) {
  const crmHost = process.env.CRM_HOST;
  const apiUsername = process.env.CRM_API_USERNAME;
  const apiPasswordEncoded = process.env.CRM_API_PASSWORD;

  if (!crmHost || !apiUsername || !apiPasswordEncoded) {
    console.error("[USER_DOCUMENTS_UPDATE] Missing CRM credentials");
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
        console.log("[USER_DOCUMENTS_UPDATE] Password decoded from base64");
      } else {
        apiPassword = apiPasswordEncoded;
        console.log("[USER_DOCUMENTS_UPDATE] Using password as plain text");
      }
    } catch (decodeError) {
      apiPassword = apiPasswordEncoded;
      console.log(
        "[USER_DOCUMENTS_UPDATE] Using password as plain text (base64 decode failed)"
      );
    }

    // Step 1: Authenticate with CRM to get auth token
    console.log("[USER_DOCUMENTS_UPDATE] Authenticating with CRM...");
    const authResult = await authenticateWithCRM(
      crmHost,
      apiUsername,
      apiPassword
    );

    if (!authResult.success) {
      console.error(
        `[USER_DOCUMENTS_UPDATE] CRM authentication failed: ${authResult.error}`
      );
      return {
        success: false,
        error: `CRM authentication failed: ${authResult.error}`,
        status: 500,
      };
    }

    const authToken = authResult.token;
    console.log(
      `[USER_DOCUMENTS_UPDATE] Successfully obtained CRM auth token from ${authResult.endpoint}`
    );

    // Step 2: Update documents in CRM
    const updateUrl = `${crmHost}/api/user/${crmUserID}/documents`;
    console.log(`[USER_DOCUMENTS_UPDATE] Updating documents at: ${updateUrl}`);
    console.log(`[USER_DOCUMENTS_UPDATE] User ID: ${crmUserID}`);
    console.log(`[USER_DOCUMENTS_UPDATE] Update data:`, updateData);

    const updateResponse = await fetch(updateUrl, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${authToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(updateData),
    });

    if (!updateResponse.ok) {
      const errorText = await updateResponse.text();
      console.error(
        `[USER_DOCUMENTS_UPDATE] Failed to update documents: ${updateResponse.status} ${updateResponse.statusText}`
      );
      console.error(`[USER_DOCUMENTS_UPDATE] Error details: ${errorText}`);

      let errorDetails;
      try {
        errorDetails = JSON.parse(errorText);
      } catch {
        errorDetails = errorText;
      }

      return {
        success: false,
        error: `Failed to update documents: ${updateResponse.status} ${updateResponse.statusText}`,
        details: errorDetails,
        status: updateResponse.status,
      };
    }

    const responseData = await updateResponse.json();
    console.log("[USER_DOCUMENTS_UPDATE] Documents update response received");
    console.log("[USER_DOCUMENTS_UPDATE] Response:", responseData);

    return {
      success: true,
      data: responseData,
    };
  } catch (error) {
    console.error("[USER_DOCUMENTS_UPDATE] Error updating documents:", error);
    return {
      success: false,
      error: `Error updating documents: ${error.message}`,
      status: 500,
    };
  }
}

