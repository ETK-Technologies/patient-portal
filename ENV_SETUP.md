# Environment Variables Setup

This document explains how to configure environment variables for the patient portal to work with the main website.

## Patient Portal Environment Variables

Create a `.env.local` file in the root of the patient portal project with the following:

```env
# CRM Configuration - Used for authentication with the main website
# Staging: https://crm-stg.myrocky.ca
# Production: https://crm.myrocky.ca
CRM_HOST=https://crm-stg.myrocky.ca

# CRM API Credentials (for fetching user data from CRM)
CRM_API_USERNAME=abhishek.tester@w3mg.in
# Password can be plain text or base64 encoded (will auto-detect)
CRM_API_PASSWORD=qwert

# Optional: Shared secret token for backward compatibility
# If not set, tokens will be verified via CRM API
CRM_API_TOKEN=your_shared_secret_token_here

# Patient Portal Configuration
PORTAL_HOST=http://localhost:3001
# For production: PORTAL_HOST=https://account.myrocky.ca
# For staging: PORTAL_HOST=https://stg-account.myrocky.ca
```

## Main Website Environment Variables

For the main website to integrate with the patient portal, add these variables to the main website's environment:

```env
# Patient Portal Integration
PATIENT_PORTAL_HOST=http://localhost:3001
# For production: PATIENT_PORTAL_HOST=https://account.myrocky.ca
# For staging: PATIENT_PORTAL_HOST=https://stg-account.myrocky.ca

# Optional: Shared secret token (if using shared secret auth)
PATIENT_PORTAL_API_TOKEN=your_shared_secret_token_here

# CRM credentials (for authenticating with CRM to get bearer token)
CRM_HOST=https://crm-stg.myrocky.ca
# For production: CRM_HOST=https://crm.myrocky.ca

CRM_API_USERNAME=abhishek.tester@w3mg.in
# Password can be plain text or base64 encoded (will auto-detect)
CRM_API_PASSWORD=qwert
```

## Important Notes

### Authentication Methods

The patient portal supports two authentication methods:

1. **CRM API Token Verification (Recommended)**: The main website authenticates with CRM to get a bearer token, then uses that token to call the patient portal. The portal verifies the token by making a request to the CRM API.

2. **Shared Secret Token (Fallback)**: If `CRM_API_TOKEN` is set in the patient portal and `PATIENT_PORTAL_API_TOKEN` is set in the main website, they **must match**. This is used as a fallback if CRM API verification fails.

**Note**: With the new CRM host (`https://crm-stg.myrocky.ca`), the CRM API token verification method is recommended and should work automatically.

### Generating a Secure Token

To generate a secure token, you can use Node.js:

```javascript
const crypto = require("crypto");
const token = crypto.randomBytes(64).toString("hex");
console.log(token);
```

Or use an online generator. The token should be at least 128 characters for security.

### Environment-Specific Configuration

#### Staging Environment

```env
# Patient Portal Staging
CRM_HOST=https://crm-stg.myrocky.ca
CRM_API_USERNAME=abhishek.tester@w3mg.in
CRM_API_PASSWORD=qwert
PORTAL_HOST=http://localhost:3001
# For deployed staging: PORTAL_HOST=https://stg-account.myrocky.ca
# Optional: CRM_API_TOKEN=staging_token_here

# Main Website Staging
PATIENT_PORTAL_HOST=http://localhost:3001
# For deployed staging: PATIENT_PORTAL_HOST=https://stg-account.myrocky.ca
CRM_HOST=https://crm-stg.myrocky.ca
CRM_API_USERNAME=abhishek.tester@w3mg.in
CRM_API_PASSWORD=qwert
# Optional: PATIENT_PORTAL_API_TOKEN=staging_token_here  # Must match above if using shared secret
```

#### Production Environment

```env
# Patient Portal Production
PORTAL_HOST=https://account.myrocky.ca
CRM_API_TOKEN=production_token_here

# Main Website Production
PATIENT_PORTAL_HOST=https://account.myrocky.ca
PATIENT_PORTAL_API_TOKEN=production_token_here  # Must match above
```

## Integration Flow

1. **Main Website** receives request with user's `userId` cookie
2. **Main Website** authenticates with CRM using existing credentials
3. **Main Website** calls Patient Portal API:
   ```
   GET ${PATIENT_PORTAL_HOST}/api/user/auto-login-link?wp_user_id=${userId}
   Headers:
     Authorization: Bearer ${PATIENT_PORTAL_API_TOKEN}
   ```
4. **Patient Portal** verifies the bearer token matches `CRM_API_TOKEN`
5. **Patient Portal** generates secure auto-login link and returns it
6. **Main Website** redirects user to the auto-login link

## Security Considerations

1. **Never commit `.env.local` to version control**
2. **Use different tokens for staging and production**
3. **Rotate tokens periodically (recommend every 90 days)**
4. **Use HTTPS in production for all API calls**
5. **Restrict API access by IP whitelist if possible**

## Troubleshooting

### "Missing authorization header" Error

- Check that main website is sending `Authorization: Bearer ...` header
- Verify header name is exactly `authorization` (case-insensitive)

### "Invalid authorization token" Error

- Verify `CRM_API_TOKEN` in patient portal matches `PATIENT_PORTAL_API_TOKEN` in main website
- Check for extra spaces or line breaks in environment variables
- Ensure no quotes around the token value

### "Missing required environment variables" Error

- Verify all required variables are set in `.env.local`
- Check file is in the correct location (root of project)
- Restart development server after changing environment variables

## Example .env.local Files

### Patient Portal - Development

```env
# CRM Configuration
CRM_HOST=https://crm-stg.myrocky.ca
CRM_API_USERNAME=abhishek.tester@w3mg.in
CRM_API_PASSWORD=qwert
# Optional: CRM_API_TOKEN=dev_abc123def456ghi789jkl012mno345pqr678stu901vwx234yz

# Patient Portal Configuration
PORTAL_HOST=http://localhost:3001
```

### Patient Portal - Production

```env
# CRM Configuration
CRM_HOST=https://crm.myrocky.ca
CRM_API_USERNAME=your_production_username@example.com
CRM_API_PASSWORD=your_base64_encoded_password
# Optional: CRM_API_TOKEN=prod_secure_token_min_128_chars_for_strong_security_xyz789abc123def456ghi789jkl012mno345pqr678stu901vwx234yz567abc890def123

# Patient Portal Configuration
PORTAL_HOST=https://account.myrocky.ca
```

## Next Steps

1. Generate a secure token for your environment
2. Add the token to patient portal `.env.local`
3. Add the matching token to main website environment
4. Test the integration with a test user account
5. Deploy to staging for further testing
6. Roll out to production

## Support

For issues or questions about environment setup, contact the development team.

