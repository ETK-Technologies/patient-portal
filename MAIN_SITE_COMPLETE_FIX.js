// Complete fixed version of your main site route
// Replace the authentication section with this code

import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { logger } from "@/utils/devLogger";

export async function GET(req) {
  try {
    logger.log("API: Starting portal URL fetch process");

    // Check if user is logged in
    const cookieStore = await cookies();
    const userId = cookieStore.get("userId")?.value;

    if (!userId) {
      logger.log("API: User not logged in, no userId found in cookies");
      return NextResponse.json(
        { success: false, error: "User not logged in" },
        { status: 401 }
      );
    }

    logger.log("API: User is logged in with ID:", userId);

    // CRM and Portal URLs from environment variables
    const crmHostUrl = process.env.CRM_HOST;
    const portalHostUrl = process.env.PORTAL_HOST;
    const apiUsername = process.env.CRM_API_USERNAME;
    const apiPasswordEncoded = process.env.CRM_API_PASSWORD;

    // Debug: Print environment variables (without exposing the full password)
    logger.log("API: Environment variables check:", {
      crmHostUrl: crmHostUrl ? "✓ Set" : "✗ Missing",
      portalHostUrl: portalHostUrl ? "✓ Set" : "✗ Missing",
      apiUsername: apiUsername ? "✓ Set" : "✗ Missing",
      apiPasswordEncoded: apiPasswordEncoded ? "✓ Set" : "✗ Missing",
    });

    // If environment variables are not set, return an error
    if (!crmHostUrl || !portalHostUrl || !apiUsername || !apiPasswordEncoded) {
      const missingVars = [];
      if (!crmHostUrl) missingVars.push("CRM_HOST");
      if (!portalHostUrl) missingVars.push("PORTAL_HOST");
      if (!apiUsername) missingVars.push("CRM_API_USERNAME");
      if (!apiPasswordEncoded) missingVars.push("CRM_API_PASSWORD");

      const errorMsg = `Missing required environment variables: ${missingVars.join(
        ", "
      )}`;
      logger.error("API:", errorMsg);
      return NextResponse.json(
        { success: false, error: errorMsg },
        { status: 500 }
      );
    }

    // Decode the password - try base64 first, fallback to plain text
    let apiPassword;

    // Check if password looks like base64 (contains only base64 chars and possibly padding)
    const base64Regex = /^[A-Za-z0-9+/]*={0,2}$/;
    const looksLikeBase64 =
      base64Regex.test(apiPasswordEncoded) && apiPasswordEncoded.length > 4;

    if (looksLikeBase64) {
      try {
        // Try to decode as base64
        const decoded = Buffer.from(apiPasswordEncoded, "base64").toString(
          "utf8"
        );
        // Check if decoded value is valid and reasonable
        // If the decoded string is the same as input or contains non-printable chars, use plain text
        const hasNonPrintable = /[\x00-\x08\x0E-\x1F\x7F-\x9F]/.test(decoded);
        const isSameAsInput = decoded === apiPasswordEncoded;

        if (!hasNonPrintable && !isSameAsInput && decoded.length > 0) {
          apiPassword = decoded;
          logger.log("API: Password decoded from base64");
        } else {
          apiPassword = apiPasswordEncoded;
          logger.log(
            "API: Using password as plain text (base64 decode produced invalid result)"
          );
        }
      } catch (decodeError) {
        // If base64 decode fails, use as plain text
        apiPassword = apiPasswordEncoded;
        logger.log("API: Using password as plain text (base64 decode failed)");
      }
    } else {
      // Doesn't look like base64, use as plain text
      apiPassword = apiPasswordEncoded;
      logger.log(
        "API: Using password as plain text (doesn't look like base64)"
      );
    }

    // Extract query parameters
    const url = new URL(req.url);
    const redirectPage = url.searchParams.get("redirectPage") || "";
    logger.log("API: Redirect page set to:", redirectPage || "root (empty)");

    logger.log("API: Attempting CRM authentication");
    logger.log(`API: CRM endpoint: ${crmHostUrl}/api/crm-user/login`);

    // Step 1: Authenticate with CRM API
    let loginResponse;
    try {
      loginResponse = await fetch(`${crmHostUrl}/api/crm-user/login`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email: apiUsername,
          password: apiPassword,
        }),
      });

      logger.log("API: CRM auth response status:", loginResponse.status);

      if (!loginResponse.ok) {
        const errorText = await loginResponse.text();
        logger.error("API: CRM authentication failed:", errorText);
        return NextResponse.json(
          {
            success: false,
            error: `Failed to authenticate with CRM: ${loginResponse.status} ${loginResponse.statusText}`,
            details: errorText,
          },
          { status: 500 }
        );
      }
    } catch (fetchError) {
      logger.error("API: CRM fetch error:", fetchError.message);
      return NextResponse.json(
        {
          success: false,
          error: `Error connecting to CRM: ${fetchError.message}`,
        },
        { status: 500 }
      );
    }

    let loginData;
    try {
      loginData = await loginResponse.json();
      logger.log(
        "API: CRM authentication response received",
        loginData.success ? "successfully" : "with errors"
      );
    } catch (jsonError) {
      logger.error("API: Failed to parse CRM response:", jsonError);
      return NextResponse.json(
        {
          success: false,
          error: `Failed to parse CRM response: ${jsonError.message}`,
        },
        { status: 500 }
      );
    }

    // Check for token in different response formats
    let token = null;
    if (loginData.success && loginData.data?.token) {
      token = loginData.data.token;
    } else if (loginData.token) {
      token = loginData.token;
    } else if (loginData.data?.token) {
      token = loginData.data.token;
    }

    if (!token) {
      logger.error("API: CRM authentication token not found", loginData);
      return NextResponse.json(
        {
          success: false,
          error: "CRM authentication token not found",
          details: loginData,
        },
        { status: 500 }
      );
    }

    logger.log("API: Successfully obtained CRM auth token");

    // Step 2: Get auto-login link for the portal
    logger.log("API: Requesting portal auto-login link");
    logger.log(
      `API: Portal endpoint: ${portalHostUrl}/api/user/auto-login-link`
    );

    let portalResponse;
    try {
      // Construct query parameters for GET request
      const queryParams = new URLSearchParams({
        wp_user_id: userId,
        expiration_hour: 1,
      });

      // Only add redirect parameter if it's not empty
      if (redirectPage) {
        queryParams.set("redirect", redirectPage);
      }

      portalResponse = await fetch(
        `${portalHostUrl}/api/user/auto-login-link?${queryParams.toString()}`,
        {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
        }
      );

      logger.log("API: Portal auth response status:", portalResponse.status);

      if (!portalResponse.ok) {
        const errorText = await portalResponse.text();
        logger.error("API: Portal auto-login failed:", errorText);
        return NextResponse.json(
          {
            success: false,
            error: `Failed to get portal auto-login link: ${portalResponse.status} ${portalResponse.statusText}`,
            details: errorText,
          },
          { status: 500 }
        );
      }
    } catch (fetchError) {
      logger.error("API: Portal fetch error:", fetchError.message);
      return NextResponse.json(
        {
          success: false,
          error: `Error connecting to portal: ${fetchError.message}`,
        },
        { status: 500 }
      );
    }

    let portalData;
    try {
      portalData = await portalResponse.json();
      logger.log(
        "API: Portal auto-login response received",
        portalData.success ? "successfully" : "with errors"
      );
    } catch (jsonError) {
      logger.error("API: Failed to parse portal response:", jsonError);
      return NextResponse.json(
        {
          success: false,
          error: `Failed to parse portal response: ${jsonError.message}`,
        },
        { status: 500 }
      );
    }

    if (!portalData.success || !portalData.data?.link) {
      logger.error("API: Portal auto-login link not found", portalData);
      return NextResponse.json(
        {
          success: false,
          error: "Portal auto-login link not found",
          details: portalData,
        },
        { status: 500 }
      );
    }

    // Verify that the returned user ID matches the current user
    if (
      portalData.data.wp_user_id &&
      portalData.data.wp_user_id.toString() !== userId
    ) {
      logger.error("API: User ID mismatch", {
        expected: userId,
        received: portalData.data.wp_user_id,
      });
      return NextResponse.json(
        {
          success: false,
          error: "User ID mismatch",
          details: {
            expected: userId,
            received: portalData.data.wp_user_id,
          },
        },
        { status: 500 }
      );
    }

    logger.log("API: Successfully obtained portal auto-login URL");

    // Return the auto-login URL
    return NextResponse.json({
      success: true,
      url: portalData.data.link,
    });
  } catch (error) {
    logger.error("API: Error in portal login API:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Internal server error",
        details: error.message,
        stack: error.stack,
      },
      { status: 500 }
    );
  }
}
