# Main Site Route Fix - Quick Update

The correct CRM login endpoint is `/api/crm-user/login` (not `/api/login`).

## Quick Fix - Replace the Authentication Section

Replace this section in your main site route:

```javascript
// OLD CODE - REMOVE THIS
logger.log("API: Attempting CRM authentication");
logger.log(`API: CRM endpoint: ${crmHostUrl}/api/login`);

// Step 1: Authenticate with CRM API
let loginResponse;
try {
  loginResponse = await fetch(`${crmHostUrl}/api/login`, {
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
```

## With This - NEW CODE

```javascript
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
```

## Change Summary

**1. Change the endpoint:**

```javascript
// OLD
loginResponse = await fetch(`${crmHostUrl}/api/login`, {

// NEW
loginResponse = await fetch(`${crmHostUrl}/api/crm-user/login`, {
```

**2. Update the log line:**

```javascript
logger.log(`API: CRM endpoint: ${crmHostUrl}/api/crm-user/login`);
```

**3. Fix password handling (IMPORTANT!):**

Replace the password decoding section:

```javascript
// OLD CODE - REMOVE THIS
// Decode the base64 encoded password
let apiPassword;
try {
  apiPassword = Buffer.from(apiPasswordEncoded, "base64").toString();
  logger.log("API: Successfully decoded the base64 password");
} catch (decodeError) {
  logger.error("API: Failed to decode base64 password:", decodeError);
  return NextResponse.json(
    { success: false, error: "Failed to decode API password" },
    { status: 500 }
  );
}
```

**With this:**

```javascript
// Decode the password - try base64 first, fallback to plain text
let apiPassword;

// Check if password looks like base64 (contains only base64 chars and possibly padding)
const base64Regex = /^[A-Za-z0-9+/]*={0,2}$/;
const looksLikeBase64 =
  base64Regex.test(apiPasswordEncoded) && apiPasswordEncoded.length > 4;

if (looksLikeBase64) {
  try {
    // Try to decode as base64
    const decoded = Buffer.from(apiPasswordEncoded, "base64").toString("utf8");
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
  logger.log("API: Using password as plain text (doesn't look like base64)");
}
```

This intelligently detects if the password is base64-encoded or plain text and handles both automatically.

## Alternative: Multi-Endpoint Approach

If you want to be more robust (tries multiple endpoints), see `MAIN_SITE_INTEGRATION.md` for the full implementation with the `authenticateWithCRM` helper function.
