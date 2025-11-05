# Fix: Module Not Found Error

The import paths are correct, but Next.js has cached the old version. Follow these steps:

## Step 1: Stop the Dev Server

Press `Ctrl+C` in the terminal where the dev server is running.

## Step 2: Clear Next.js Cache

Delete the `.next` folder:

**Windows PowerShell:**

```powershell
Remove-Item -Recurse -Force .next
```

**Or manually:**

- Delete the `.next` folder in your project root

## Step 3: Restart the Dev Server

```bash
npm run dev
```

## Alternative: If that doesn't work

Try deleting `node_modules/.cache` as well:

```powershell
Remove-Item -Recurse -Force node_modules\.cache
npm run dev
```

The import paths are correct:

- ✅ `src/app/api/utils/crmAuth.js` exists
- ✅ `export async function authenticateWithCRM` is in the file
- ✅ Import paths use `../../utils/crmAuth` (correct)

The error is just a stale cache issue.
