/**
 * CRM Authentication Utility
 * Handles authentication with CRM API, trying multiple endpoint paths
 */

/**
 * Try to authenticate with CRM using multiple possible endpoint paths
 * @param {string} crmHost - The CRM host URL
 * @param {string} email - API username/email
 * @param {string} password - API password
 * @returns {Promise<{success: boolean, token?: string, error?: string, endpoint?: string}>}
 */
export async function authenticateWithCRM(crmHost, email, password) {
  // Common login endpoint paths to try
  // Note: /api/crm-user/login is the correct endpoint for staging CRM
  const loginEndpoints = [
    "/api/crm-user/login",
    "/api/login",
    "/api/auth/login",
    "/api/user/login",
    "/auth/login",
    "/login",
  ];

  console.log(`[CRM_AUTH] Attempting to authenticate with CRM: ${crmHost}`);
  console.log(`[CRM_AUTH] Will try ${loginEndpoints.length} endpoint paths`);

  for (const endpoint of loginEndpoints) {
    try {
      const url = `${crmHost}${endpoint}`;
      console.log(`[CRM_AUTH] Trying endpoint: ${url}`);

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

      console.log(
        `[CRM_AUTH] Response from ${endpoint}: ${response.status} ${response.statusText}`
      );

      // If we get a 404, try the next endpoint
      if (response.status === 404) {
        console.log(
          `[CRM_AUTH] Endpoint ${endpoint} returned 404, trying next...`
        );
        continue;
      }

      // If we get any other status, check if it's successful
      if (!response.ok) {
        const errorText = await response.text();
        console.error(
          `[CRM_AUTH] Authentication failed at ${endpoint}:`,
          errorText
        );

        // If it's not 404, this might be the right endpoint but wrong credentials
        // Return error so caller can handle it
        return {
          success: false,
          error: `Authentication failed: ${response.status} ${response.statusText}`,
          details: errorText,
          endpoint: endpoint,
        };
      }

      // Success! Parse the response
      try {
        const data = await response.json();

        if (data.success && data.data?.token) {
          console.log(
            `[CRM_AUTH] ✓ Successfully authenticated using ${endpoint}`
          );
          return {
            success: true,
            token: data.data.token,
            endpoint: endpoint,
          };
        } else if (data.token) {
          // Some APIs return token directly
          console.log(
            `[CRM_AUTH] ✓ Successfully authenticated using ${endpoint}`
          );
          return {
            success: true,
            token: data.token,
            endpoint: endpoint,
          };
        } else {
          console.error(
            `[CRM_AUTH] Response from ${endpoint} missing token:`,
            data
          );
          return {
            success: false,
            error: "Response missing authentication token",
            details: data,
            endpoint: endpoint,
          };
        }
      } catch (jsonError) {
        console.error(
          `[CRM_AUTH] Failed to parse JSON from ${endpoint}:`,
          jsonError
        );
        return {
          success: false,
          error: `Failed to parse response: ${jsonError.message}`,
          endpoint: endpoint,
        };
      }
    } catch (fetchError) {
      // Network error - try next endpoint
      console.error(
        `[CRM_AUTH] Network error with ${endpoint}:`,
        fetchError.message
      );
      continue;
    }
  }

  // If we get here, all endpoints failed
  console.error(`[CRM_AUTH] ✗ All ${loginEndpoints.length} endpoints failed`);
  return {
    success: false,
    error: `All login endpoints returned 404 or failed. Tried: ${loginEndpoints.join(
      ", "
    )}`,
    triedEndpoints: loginEndpoints,
  };
}
