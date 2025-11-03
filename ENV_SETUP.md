# Environment Variables Setup

This document explains how to configure environment variables for the patient portal to work with the main website.

## Patient Portal Environment Variables

Create a `.env.local` file in the root of the patient portal project with the following:

```env
# CRM Configuration - Used for authentication with the main website
CRM_HOST=https://crm.myrocky.ca
CRM_API_TOKEN=your_shared_secret_token_here

# Patient Portal Configuration
PORTAL_HOST=https://account.myrocky.ca
# For local development: PORTAL_HOST=http://localhost:3000
```

## Main Website Environment Variables

For the main website to integrate with the patient portal, add these variables to the main website's environment:

```env
# Patient Portal Integration
PATIENT_PORTAL_HOST=https://account.myrocky.ca
PATIENT_PORTAL_API_TOKEN=your_shared_secret_token_here

# Existing CRM credentials (from your current .env)
CRM_HOST=https://crm.myrocky.ca
CRM_API_USERNAME=mayuresh@myrocky.ca
CRM_API_PASSWORD=VW1ScCpWNFchRG44KUww
```

## Important Notes

### Shared Secret Token

The `CRM_API_TOKEN` in the patient portal and `PATIENT_PORTAL_API_TOKEN` in the main website **must match**. This is the shared secret used for secure communication between the two systems.

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
PORTAL_HOST=https://stg-account.myrocky.ca
CRM_API_TOKEN=staging_token_here

# Main Website Staging
PATIENT_PORTAL_HOST=https://stg-account.myrocky.ca
PATIENT_PORTAL_API_TOKEN=staging_token_here  # Must match above
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
CRM_HOST=https://crm.myrocky.ca
CRM_API_TOKEN=dev_abc123def456ghi789jkl012mno345pqr678stu901vwx234yz

# Patient Portal Configuration
PORTAL_HOST=http://localhost:3000
```

### Patient Portal - Production

```env
# CRM Configuration
CRM_HOST=https://crm.myrocky.ca
CRM_API_TOKEN=prod_secure_token_min_128_chars_for_strong_security_xyz789abc123def456ghi789jkl012mno345pqr678stu901vwx234yz567abc890def123

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
