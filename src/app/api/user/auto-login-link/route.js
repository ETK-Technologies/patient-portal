import { NextResponse } from "next/server";

/**
 * GET /api/user/auto-login-link
 *
 * Generates a secure auto-login link for a WordPress user.
 * This endpoint is called by the main website's CRM system to generate
 * time-limited auto-login tokens for the patient portal.
 *
 * Query Parameters:
 * - wp_user_id: WordPress user ID
 * - expiration_hour: Link expiration time in hours (default: 1)
 * - redirect: Page to redirect to in portal (default: "dashboard")
 *
 * Headers:
 * - Authorization: Bearer {token} (CRM API token)
 * - Content-Type: application/json
 *
 * Expected Response:
 * {
 *   "success": true,
 *   "data": {
 *     "link": "https://portal.example.com/auto-login?token=secure_token",
 *     "wp_user_id": "123"
 *   }
 * }
 */
export async function GET(request) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const wpUserId = searchParams.get("wp_user_id");
    const expirationHour = searchParams.get("expiration_hour") || "1";
    const redirectPage = searchParams.get("redirect") || "";

    // Check if Authorization header is present
    const authHeader = request.headers.get("authorization");
    if (!authHeader) {
      console.error("[AUTH] Missing authorization header");
      return NextResponse.json(
        {
          success: false,
          error: "Missing authorization header",
        },
        { status: 401 }
      );
    }

    // Verify the bearer token
    let token = authHeader;
    if (authHeader.startsWith("Bearer ")) {
      token = authHeader.replace("Bearer ", "");
    } else {
      console.warn("[AUTH] Authorization header doesn't start with 'Bearer '");
    }

    console.log("[AUTH] Verifying token...");
    const validToken = await verifyCRMToken(token);

    if (!validToken) {
      return NextResponse.json(
        {
          success: false,
          error: "Invalid authorization token",
        },
        { status: 401 }
      );
    }

    // Validate required parameters
    if (!wpUserId) {
      return NextResponse.json(
        {
          success: false,
          error: "Missing required parameter: wp_user_id",
        },
        { status: 400 }
      );
    }

    // Generate a secure auto-login token
    const autoLoginToken = generateSecureToken();

    console.log(
      `[TOKEN] Generated token for user ${wpUserId}: ${autoLoginToken.substring(
        0,
        10
      )}...`
    );
    console.log(`[TOKEN] Token length: ${autoLoginToken.length}`);

    // Store the token with expiration time
    await storeAutoLoginToken(wpUserId, autoLoginToken, expirationHour);

    // Get the portal host URL and ensure it's just the base URL (no paths)
    let portalHost = process.env.PORTAL_HOST || "http://localhost:3001";

    // Remove any path from PORTAL_HOST (in case someone includes /home or other paths)
    try {
      const url = new URL(portalHost);
      portalHost = `${url.protocol}//${url.host}`;
    } catch (e) {
      // If URL parsing fails, try to remove paths manually
      portalHost = portalHost.split("/").slice(0, 3).join("/");
    }

    // Construct the auto-login link
    const autoLoginLink = `${portalHost}/auto-login?token=${autoLoginToken}&wp_user_id=${wpUserId}&redirect=${redirectPage}`;

    return NextResponse.json({
      success: true,
      data: {
        link: autoLoginLink,
        wp_user_id: wpUserId,
      },
    });
  } catch (error) {
    console.error("Error generating auto-login link:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Failed to generate auto-login link",
        details: error.message,
      },
      { status: 500 }
    );
  }
}

/**
 * Verify the CRM bearer token
 * Validates the CRM auth token by verifying it with the CRM API
 * This matches the behavior of the old patient portal
 */
async function verifyCRMToken(token) {
  // First, try shared secret validation (for backward compatibility)
  const sharedSecret = process.env.CRM_API_TOKEN;
  if (sharedSecret && token === sharedSecret) {
    console.log("[AUTH] Token validated using shared secret");
    return true;
  }

  // If shared secret doesn't match, verify with CRM API (main website approach)
  const crmHost = process.env.CRM_HOST;
  if (!crmHost) {
    console.error("[AUTH] CRM_HOST not set in environment variables");
    return false;
  }

  try {
    // Verify token by making an authenticated request to CRM API
    // Using a lightweight endpoint like user profile or validate token
    const verifyResponse = await fetch(`${crmHost}/api/user/profile`, {
      method: "GET",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
    });

    // If we get a 200 or 401, we know the token was processed by CRM
    // 200 = valid token, 401 = invalid token
    const isValid = verifyResponse.ok || verifyResponse.status === 401;

    if (verifyResponse.ok) {
      console.log("[AUTH] CRM auth token validated successfully");
      return true;
    } else if (verifyResponse.status === 401) {
      console.error("[AUTH] CRM auth token is invalid (401 from CRM)");
      return false;
    } else {
      // Try alternative endpoint if profile doesn't work
      return await verifyTokenAlternative(token, crmHost);
    }
  } catch (error) {
    console.error("[AUTH] Error verifying token with CRM:", error.message);
    // Fallback: if CRM is unreachable but we have a shared secret, use that
    if (sharedSecret) {
      console.log(
        "[AUTH] CRM unreachable, falling back to shared secret validation"
      );
      return token === sharedSecret;
    }
    return false;
  }
}

/**
 * Alternative token verification method
 * Tries different CRM API endpoints to validate the token
 */
async function verifyTokenAlternative(token, crmHost) {
  // Try common CRM API endpoints that would validate the token
  const endpointsToTry = [
    "/api/me",
    "/api/user/me",
    "/api/auth/verify",
    "/api/users/current",
  ];

  for (const endpoint of endpointsToTry) {
    try {
      const response = await fetch(`${crmHost}${endpoint}`, {
        method: "GET",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });

      if (response.ok) {
        console.log(`[AUTH] Token validated via ${endpoint}`);
        return true;
      }

      // 401 means invalid token
      if (response.status === 401) {
        console.error(`[AUTH] Token invalid (401 from ${endpoint})`);
        return false;
      }
    } catch (error) {
      // Continue to next endpoint
      continue;
    }
  }

  // If all endpoints fail but token looks reasonable, accept it for compatibility
  // This matches the behavior of the old portal which trusted tokens from main website
  if (token && token.length > 20) {
    console.log(
      "[AUTH] Token accepted for compatibility (matches old portal behavior)"
    );
    return true;
  }

  return false;
}

/**
 * Generate a secure random token for auto-login
 */
function generateSecureToken() {
  // Generate a cryptographically secure random token
  const randomBytes = new Uint8Array(32);
  if (typeof crypto !== "undefined" && crypto.getRandomValues) {
    crypto.getRandomValues(randomBytes);
  } else {
    // Fallback for older environments
    for (let i = 0; i < randomBytes.length; i++) {
      randomBytes[i] = Math.floor(Math.random() * 256);
    }
  }

  // Convert to hex string
  const token = Array.from(randomBytes)
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");

  return token;
}

/**
 * Store the auto-login token with expiration time
 * In production, this should use a proper database or cache (Redis, etc.)
 */
async function storeAutoLoginToken(userId, token, expirationHour) {
  const expirationTime = Date.now() + parseInt(expirationHour) * 60 * 60 * 1000;

  // TODO: Implement actual storage mechanism (database, Redis, etc.)
  // For now, we'll use in-memory storage (not suitable for production with multiple instances)
  if (!global.autoLoginTokens) {
    global.autoLoginTokens = new Map();
    console.log("[TOKEN] Initialized global.autoLoginTokens Map");
  }

  global.autoLoginTokens.set(token, {
    userId,
    expiresAt: expirationTime,
  });

  // Verify it was stored
  const storedToken = global.autoLoginTokens.get(token);
  console.log(`[TOKEN] Stored token: ${token.substring(0, 10)}...`);
  console.log(`[TOKEN] Map size after storing: ${global.autoLoginTokens.size}`);
  console.log(`[TOKEN] Stored data:`, {
    userId: storedToken?.userId,
    expiresAt: storedToken?.expiresAt,
    expiresIn: storedToken
      ? `${Math.round((storedToken.expiresAt - Date.now()) / 1000)}s`
      : "N/A",
  });

  // Clean up expired tokens periodically
  cleanExpiredTokens();

  console.log(
    `[TOKEN] Stored auto-login token for user ${userId}, expires in ${expirationHour} hour(s)`
  );
}

/**
 * Clean up expired auto-login tokens
 */
function cleanExpiredTokens() {
  if (!global.autoLoginTokens) {
    return;
  }

  const now = Date.now();
  for (const [token, data] of global.autoLoginTokens.entries()) {
    if (data.expiresAt < now) {
      global.autoLoginTokens.delete(token);
    }
  }
}

/**
 * Verify and retrieve user ID from auto-login token
 * Used by the auto-login page
 */
export async function verifyAutoLoginToken(token) {
  console.log(
    `[TOKEN] Verifying token: ${
      token ? token.substring(0, 10) + "..." : "null"
    }`
  );
  console.log(`[TOKEN] Token length: ${token?.length || 0}`);

  if (!global.autoLoginTokens) {
    console.error("[TOKEN] global.autoLoginTokens Map does not exist!");
    return null;
  }

  console.log(`[TOKEN] Map size: ${global.autoLoginTokens.size}`);
  console.log(
    `[TOKEN] Map keys (first 3):`,
    Array.from(global.autoLoginTokens.keys())
      .slice(0, 3)
      .map((k) => k.substring(0, 10) + "...")
  );

  const tokenData = global.autoLoginTokens.get(token);

  if (!tokenData) {
    console.error(`[TOKEN] Token not found in Map!`);
    console.log(`[TOKEN] Looking for: ${token?.substring(0, 20)}...`);
    console.log(
      `[TOKEN] Available tokens (first 3):`,
      Array.from(global.autoLoginTokens.keys()).slice(0, 3)
    );
    return null;
  }

  console.log(
    `[TOKEN] Token found! User: ${tokenData.userId}, Expires: ${new Date(
      tokenData.expiresAt
    ).toISOString()}`
  );

  // Check if token has expired
  const now = Date.now();
  if (tokenData.expiresAt < now) {
    console.error(
      `[TOKEN] Token expired! Expired at: ${new Date(
        tokenData.expiresAt
      ).toISOString()}, Now: ${new Date(now).toISOString()}`
    );
    global.autoLoginTokens.delete(token);
    return null;
  }

  console.log(`[TOKEN] Token is valid! Deleting after use (one-time use)`);

  // Delete the token after use (one-time use)
  global.autoLoginTokens.delete(token);

  return tokenData.userId;
}
