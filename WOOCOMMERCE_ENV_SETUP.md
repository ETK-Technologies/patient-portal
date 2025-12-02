# WooCommerce Environment Variables Setup

## Quick Setup

Create a `.env.local` file in the root of your project with the following:

```env
# WooCommerce API Credentials
BASE_URL=https://myrocky.ca
CONSUMER_KEY=ck_d0a88824e4dc4cde04b4a26ae5f463139b07feeb
CONSUMER_SECRET=cs_f88f1c6d32b72c38743410456c1f109546a808d9
```

## Important Notes

1. **BASE_URL** must be `https://myrocky.ca` (NOT `http://localhost:3001`)

   - This is your WooCommerce store URL
   - No trailing slash
   - Must use `https://` (not `http://`)

2. **CONSUMER_KEY** and **CONSUMER_SECRET** are from your WooCommerce REST API

   - These are the Live API credentials from your other project
   - Keep these secret - never commit to git

3. **Restart your dev server** after creating/updating `.env.local`:
   ```bash
   npm run dev
   ```

## Verification

After setting up, check your server console. You should see:

- `[WooCommerce] Fetching: products/353755`
- `[WooCommerce] URL: https://myrocky.ca/wp-json/wc/v3/products/353755?consumer_key=ck_***&consumer_secret=***`

If you see `localhost:3001` in the URL, your `.env.local` file is not being read correctly.

## Troubleshooting

### Error: "Not Found" (404)

- Check that `BASE_URL=https://myrocky.ca` (not localhost)
- Verify the product IDs exist in WooCommerce
- Check that API credentials are correct

### Error: "Missing required environment variables"

- Make sure `.env.local` exists in the project root
- Restart your dev server after creating the file
- Check for typos in variable names (must be exact: `BASE_URL`, `CONSUMER_KEY`, `CONSUMER_SECRET`)

### Still seeing localhost:3001

- Delete `.env.local` and recreate it
- Make sure there are no spaces around the `=` sign
- Restart your dev server completely (stop and start again)

## For Vercel Deployment

When deploying to Vercel (https://patient-portal-kappa.vercel.app/), add these environment variables in Vercel Dashboard:

1. Go to your project settings
2. Navigate to "Environment Variables"
3. Add:
   - `BASE_URL` = `https://myrocky.ca`
   - `CONSUMER_KEY` = `ck_d0a88824e4dc4cde04b4a26ae5f463139b07feeb`
   - `CONSUMER_SECRET` = `cs_f88f1c6d32b72c38743410456c1f109546a808d9`
4. Redeploy your application
