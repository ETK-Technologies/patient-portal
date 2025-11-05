# Patient Portal Auto-Login Implementation

This document explains the auto-login implementation for the new patient portal, which receives redirects from the main website.

## Overview

When a logged-in user clicks "My Account" on the main website, they are redirected to the patient portal with a secure auto-login token. The portal verifies the token and logs the user in automatically.

## Architecture

```
Main Website              Patient Portal
     |                          |
     |  1. User clicks         |
     |     "My Account"         |
     |                          |
     |  2. Fetch auto-login     |
     |     URL from API         |
     |                          |
     |  3. GET /api/my-account-url
     |     (Main website API)   |
     |                          |
     |  4. GET /api/user/auto-login-link
     |     (Patient portal API) |
     |<------------------------|
     |  5. Return secure URL    |
     |   with auto-login token  |
     |------------------------>|
     |                          |
     |  6. Redirect user to     |
     |     /auto-login?token=.. |
     |------------------------>|
     |                          |
     |  7. Verify token         |
     |     GET /api/user/verify-auto-login
     |                          |
     |  8. Store user session   |
     |     and redirect         |
     |     to dashboard         |
```

## Components

### 1. API Endpoints

#### `/api/user/auto-login-link` (GET)

**Purpose**: Generate secure auto-login tokens for users

**Called by**: Main website's CRM system (via authenticated request)

**Authentication**: Requires `Authorization: Bearer {CRM_API_TOKEN}` header

**Query Parameters**:

- `wp_user_id` (required): WordPress user ID
- `expiration_hour` (optional): Link expiration time in hours (default: 1)
- `redirect` (optional): Page to redirect to after login (default: "dashboard")

**Example Request**:

```
GET /api/user/auto-login-link?wp_user_id=123&expiration_hour=1&redirect=home
Headers:
  Authorization: Bearer {CRM_API_TOKEN}
  Content-Type: application/json
```

**Example Response**:

```json
{
  "success": true,
  "data": {
    "link": "https://portal.myrocky.ca/auto-login?token=abc123...&wp_user_id=123&redirect=home",
    "wp_user_id": "123"
  }
}
```

#### `/api/user/verify-auto-login` (GET)

**Purpose**: Verify auto-login token and authenticate user

**Called by**: Auto-login page

**Query Parameters**:

- `token` (required): Auto-login token
- `wp_user_id` (required): WordPress user ID

**Example Request**:

```
GET /api/user/verify-auto-login?token=abc123...&wp_user_id=123
```

**Example Response**:

```json
{
  "success": true,
  "userData": {
    "id": "123",
    "name": "John Doe",
    "email": "user@example.com"
  }
}
```

### 2. Auto-Login Page

**Path**: `/auto-login`

**Purpose**: Handle the auto-login flow when users are redirected from main website

**Process**:

1. Extract token and user ID from URL parameters
2. Verify token with backend API
3. Store user session (cookies/localStorage)
4. Redirect to dashboard or specified page

**UI States**:

- Loading: Shows spinner while verifying
- Success: Shows checkmark and redirects
- Error: Shows error message and redirects to home

### 3. Storage

**Current Implementation**: In-memory storage (Map)

**Limitations**:

- Not suitable for production with multiple instances
- Tokens are lost on server restart
- Not shared across servers

**Production Recommendation**:

- Use Redis for distributed caching
- Set TTL (Time To Live) equal to token expiration
- Use atomic operations for token verification

**Example Redis Implementation**:

```javascript
import Redis from "ioredis";

const redis = new Redis(process.env.REDIS_URL);

async function storeAutoLoginToken(userId, token, expirationHour) {
  const ttl = expirationHour * 60 * 60; // Convert to seconds
  await redis.setex(`auto_login:${token}`, ttl, userId);
}

async function verifyAutoLoginToken(token) {
  const userId = await redis.getdel(`auto_login:${token}`);
  return userId;
}
```

## Environment Variables

Create a `.env.local` file with the following variables:

```env
# CRM Configuration
# Staging: https://crm-stg.myrocky.ca
# Production: https://crm.myrocky.ca
CRM_HOST=https://crm-stg.myrocky.ca

# CRM API Credentials (for fetching user data from CRM)
CRM_API_USERNAME=abhishek.tester@w3mg.in
# Password can be plain text or base64 encoded (will auto-detect)
CRM_API_PASSWORD=qwert

# Optional: Shared secret token for backward compatibility
# If not set, tokens will be verified via CRM API (recommended)
CRM_API_TOKEN=your_secure_token_here

# Patient Portal Configuration
# For local development:
PORTAL_HOST=http://localhost:3001
# For staging: PORTAL_HOST=https://stg-account.myrocky.ca
# For production: PORTAL_HOST=https://account.myrocky.ca
```

## Security Considerations

### 1. Token Generation

- Uses cryptographically secure random bytes
- 64-character hexadecimal token (256 bits of entropy)
- One-time use (deleted after verification)

### 2. Token Validation

- Time-limited expiration (default: 1 hour)
- Server-side verification only
- User ID must match token data

### 3. API Authentication

- CRM API requires bearer token authentication
- Token stored in environment variables
- Never exposed to client-side code

### 4. Session Management

- User ID stored in secure HTTP-only cookie
- Max age: 7 days
- SameSite protection recommended

### 5. HTTPS

- Always use HTTPS in production
- Auto-login tokens should never be sent over HTTP

## Integration with Main Website

The main website must implement the following API route:

**File**: `app/api/my-account-url/route.js`

**Implementation**:

1. Check if user is logged in (userId cookie)
2. Authenticate with CRM API to get bearer token
3. Call patient portal's `/api/user/auto-login-link` endpoint
4. Return the secure auto-login URL

**Example Code**:

```javascript
import { NextResponse } from "next/server";
import { cookies } from "next/headers";

export async function GET(request) {
  const cookieStore = await cookies();
  const userId = cookieStore.get("userId")?.value;

  if (!userId) {
    return NextResponse.json(
      { success: false, error: "User not logged in" },
      { status: 401 }
    );
  }

  // Authenticate with CRM
  const crmResponse = await fetch(`${process.env.CRM_HOST}/api/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      email: process.env.CRM_API_USERNAME,
      password: process.env.CRM_API_PASSWORD,
    }),
  });

  const crmData = await crmResponse.json();
  const bearerToken = crmData.data.token;

  // Get auto-login link from portal
  const portalResponse = await fetch(
    `${process.env.PORTAL_HOST}/api/user/auto-login-link?wp_user_id=${userId}&expiration_hour=1&redirect=dashboard`,
    {
      method: "GET",
      headers: {
        Authorization: `Bearer ${process.env.CRM_API_TOKEN}`,
        "Content-Type": "application/json",
      },
    }
  );

  const portalData = await portalResponse.json();

  return NextResponse.json({
    success: true,
    url: portalData.data.link,
  });
}
```

## Testing

### Manual Testing

1. **Test Token Generation**:

   ```bash
   curl -X GET "http://localhost:3000/api/user/auto-login-link?wp_user_id=123&expiration_hour=1" \
     -H "Authorization: Bearer YOUR_TOKEN" \
     -H "Content-Type: application/json"
   ```

2. **Test Token Verification**:

   ```bash
   curl -X GET "http://localhost:3000/api/user/verify-auto-login?token=YOUR_TOKEN&wp_user_id=123"
   ```

3. **Test Auto-Login Flow**:
   - Visit: `http://localhost:3000/auto-login?token=YOUR_TOKEN&wp_user_id=123&redirect=home`
   - Should redirect to `/home` after successful authentication

### Automated Testing

**TODO**: Add unit tests for:

- Token generation and storage
- Token verification
- Expiration handling
- Error scenarios

## Deployment Checklist

- [ ] Set all required environment variables
- [ ] Configure Redis or alternative storage for production
- [ ] Enable HTTPS
- [ ] Set secure cookie flags (httpOnly, secure, sameSite)
- [ ] Configure CORS if needed
- [ ] Set up monitoring and logging
- [ ] Test end-to-end flow in staging
- [ ] Document CRM API token rotation process
- [ ] Set up alerts for authentication failures
- [ ] Configure rate limiting on auto-login endpoints

## Troubleshooting

### Common Issues

1. **"Invalid or expired auto-login token"**

   - Token has expired (default: 1 hour)
   - Token already used (one-time use)
   - Server restart cleared in-memory storage

2. **"Missing authorization header"**

   - CRM API not sending bearer token
   - Check Authorization header format

3. **"User ID mismatch"**

   - Token user ID doesn't match request
   - Possible security issue

4. **Multiple server instances**
   - Tokens stored on one instance not accessible from others
   - **Solution**: Use Redis or shared cache

## Future Enhancements

1. **Database Storage**: Store tokens in database for persistence
2. **Refresh Tokens**: Implement refresh token mechanism
3. **Audit Logging**: Log all auto-login attempts
4. **Rate Limiting**: Prevent brute force attacks
5. **Device Fingerprinting**: Track devices for security
6. **Multi-Factor Authentication**: Optional 2FA for sensitive operations
7. **Token Rotation**: Regular rotation of API tokens

## Support

For issues or questions, contact the development team.
