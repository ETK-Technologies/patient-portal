# Main Site Integration Guide

This document helps you integrate the main site with the new patient portal using the staging CRM host.

## Issue: 404 Error on CRM Login

The staging CRM (`https://crm-stg.myrocky.ca`) may use a different login endpoint path than `/api/login`.

## Solution: Try Multiple Login Endpoints

Update your main site's redirect route to try multiple login endpoint paths. Here's an updated version of your route:

```javascript
import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { logger } from "@/utils/devLogger";

/**
 * Helper function to authenticate with CRM, trying multiple endpoints
 */
async function authenticateWithCRM(crmHost, email, password) {
  // Note: /api/crm-user/login is the correct endpoint for staging CRM
  const loginEndpoints = [
    "/api/crm-user/login",
    "/api/login",
    "/api/auth/login",
    "/api/user/login",
    "/auth/login",
    "/login",
  ];

  for (const endpoint of loginEndpoints) {
    try {
      const url = `${crmHost}${endpoint}`;
      logger.log(`Trying CRM endpoint: ${url}`);

      const response = await fetch(url, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email: email,
          password: password,
        }),
      });

      logger.log(`Response from ${endpoint}: ${response.status}`);

      // If 404, try next endpoint
      if (response.status === 404) {
        continue;
      }

      if (!response.ok) {
        const errorText = await response.text();
        logger.error(`Authentication failed at ${endpoint}:`, errorText);
        return {
          success: false,
          error: `Failed to authenticate: ${response.status} ${response.statusText}`,
          details: errorText,
          endpoint: endpoint,
        };
      }

      const data = await response.json();

      if (data.success && data.data?.token) {
        logger.log(`✓ Successfully authenticated using ${endpoint}`);
        return {
          success: true,
          token: data.data.token,
          endpoint: endpoint,
        };
      } else if (data.token) {
        logger.log(`✓ Successfully authenticated using ${endpoint}`);
        return {
          success: true,
          token: data.token,
          endpoint: endpoint,
        };
      } else {
        return {
          success: false,
          error: "Response missing authentication token",
          details: data,
          endpoint: endpoint,
        };
      }
    } catch (fetchError) {
      logger.error(`Network error with ${endpoint}:`, fetchError.message);
      continue;
    }
  }

  return {
    success: false,
    error: `All login endpoints failed. Tried: ${loginEndpoints.join(", ")}`,
  };
}

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

    // Debug: Print environment variables
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

    // Decode the base64 encoded password
    let apiPassword;
    try {
      apiPassword = Buffer.from(apiPasswordEncoded, "base64").toString();
      logger.log("API: Successfully decoded the base64 password");
    } catch (decodeError) {
      // If base64 decode fails, use as plain text
      apiPassword = apiPasswordEncoded;
      logger.log("API: Using password as plain text (base64 decode failed)");
    }

    // Extract query parameters
    const url = new URL(req.url);
    const redirectPage = url.searchParams.get("redirectPage") || "";
    logger.log("API: Redirect page set to:", redirectPage || "root (empty)");

    logger.log("API: Attempting CRM authentication");

    // Step 1: Authenticate with CRM API (try multiple endpoints)
    const authResult = await authenticateWithCRM(
      crmHostUrl,
      apiUsername,
      apiPassword
    );

    if (!authResult.success) {
      logger.error("API: CRM authentication failed:", authResult.error);
      return NextResponse.json(
        {
          success: false,
          error: `Failed to authenticate with CRM: ${authResult.error}`,
          details: authResult.details || authResult.error,
        },
        { status: 500 }
      );
    }

    const token = authResult.token;
    logger.log(
      `API: Successfully obtained CRM auth token from ${authResult.endpoint}`
    );

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
```

## Key Changes

1. **Added `authenticateWithCRM` helper function** that tries multiple login endpoint paths:

   - `/api/login`
   - `/api/auth/login`
   - `/api/user/login`
   - `/auth/login`
   - `/login`

2. **Improved password handling** - Now tries base64 decode first, falls back to plain text if decode fails

3. **Better error logging** - Shows which endpoint was used or failed

## Testing

After updating your main site route:

1. Check the logs to see which endpoint successfully authenticated
2. The logs will show: `✓ Successfully authenticated using /api/auth/login` (or whichever endpoint works)
3. Once you know the working endpoint, you can optionally optimize the code to use only that endpoint

## Environment Variables

Make sure your main site has these environment variables:

```env
CRM_HOST=https://crm-stg.myrocky.ca
PORTAL_HOST=http://localhost:3001
CRM_API_USERNAME=abhishek.tester@w3mg.in
CRM_API_PASSWORD=qwert
```

## Troubleshooting

If all endpoints return 404:

- Check if the CRM host URL is correct
- Verify the CRM is accessible from your server
- Check if there's a different base path or version in the API (e.g., `/api/v1/login`)

If you get 401 Unauthorized:

- The endpoint is correct, but credentials are wrong
- Check username and password are correct
- Verify password encoding (base64 vs plain text)
