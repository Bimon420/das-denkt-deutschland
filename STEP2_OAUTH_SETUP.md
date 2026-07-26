# Step 2: Google OAuth Callback Setup

This document guides you through setting up the Google OAuth token exchange endpoint.

---

## What This Step Does

Creates an OAuth callback endpoint that:
1. Receives `code` from Google after user consents
2. Exchanges `code` for `access_token` using Google API
3. Returns token to frontend
4. Frontend saves token → Google Drive backups enabled

---

## Choose Your Backend

You have **two options:**

### Option A: Supabase Edge Functions (Recommended)
- **Pros:** No infrastructure, auto-scales, integrated with Supabase
- **Cons:** Requires Supabase CLI
- **File:** `supabase/functions/auth-google-callback/index.ts`
- **URL:** `https://YOUR_PROJECT.supabase.co/functions/v1/auth-google-callback`

### Option B: Vercel Functions
- **Pros:** Integrated with Vercel deployment
- **Cons:** Only works if deploying to Vercel
- **File:** `api/auth/google/callback.ts`
- **URL:** `https://your-domain.vercel.app/api/auth/google/callback`

**→ Use both if uncertain. Frontend will auto-detect which to use.**

---

## Setup: Option A (Supabase Functions)

### 1. Install Supabase CLI

```bash
npm install -g supabase
```

Verify installation:
```bash
supabase --version
```

### 2. Login to Supabase

```bash
supabase login
```

You'll be prompted to create a token in Supabase Dashboard.

### 3. Link Your Project

```bash
supabase link --project-ref YOUR_PROJECT_ID
```

Find `YOUR_PROJECT_ID` in your Supabase dashboard URL:
```
https://app.supabase.com/project/YOUR_PROJECT_ID/...
```

### 4. Set Environment Secrets

```bash
# Set Client ID
supabase secrets set GOOGLE_CLIENT_ID=YOUR_CLIENT_ID

# Set Client Secret
supabase secrets set GOOGLE_CLIENT_SECRET=YOUR_CLIENT_SECRET

# Set Redirect URI (for local dev)
supabase secrets set GOOGLE_REDIRECT_URI=http://localhost:5173/auth/google/callback
```

### 5. Deploy Function

```bash
supabase functions deploy auth-google-callback
```

Output will show:
```
✓ Function deployed successfully
  URL: https://YOUR_PROJECT.supabase.co/functions/v1/auth-google-callback
```

### 6. Test Locally

```bash
# Start dev environment
npm run dev

# In another terminal, test the function
curl "http://localhost:54321/functions/v1/auth-google-callback?code=test&state=test"
```

---

## Setup: Option B (Vercel Functions)

### 1. Install Vercel CLI

```bash
npm install -g vercel
```

### 2. Link Project to Vercel

```bash
vercel link
```

### 3. Add Environment Variables

Create `.env.production.local` in project root:

```bash
GOOGLE_CLIENT_ID=YOUR_CLIENT_ID
GOOGLE_CLIENT_SECRET=YOUR_CLIENT_SECRET
GOOGLE_REDIRECT_URI=https://YOUR_DOMAIN.vercel.app/auth/google/callback
```

Or set in Vercel Dashboard:
- Go to **Settings** → **Environment Variables**
- Add the 3 variables above

### 4. Deploy

```bash
vercel deploy --prod
```

Function automatically available at:
```
https://YOUR_DOMAIN.vercel.app/api/auth/google/callback
```

### 5. Test

```bash
curl "https://YOUR_DOMAIN.vercel.app/api/auth/google/callback?code=test&state=test"
```

---

## Google Cloud Setup (Required for Both)

### 1. Create Google Cloud Project

1. Go to https://console.cloud.google.com
2. Create new project: "Das Denkt Deutschland"
3. Wait for initialization

### 2. Enable Google Drive API

1. Go to **APIs & Services** → **Library**
2. Search "Google Drive API"
3. Click it and press **ENABLE**

### 3. Create OAuth Credentials

1. Go to **APIs & Services** → **Credentials**
2. Click **+ CREATE CREDENTIALS** → **OAuth client ID**
3. If prompted, configure OAuth consent screen first:
   - Type: **External**
   - App name: "Das Denkt Deutschland"
   - User support email: your-email@example.com
   - Developer email: your-email@example.com
   - Scopes: Add `https://www.googleapis.com/auth/drive.file`
   - Save and go back

4. Now create OAuth credentials:
   - Application type: **Web application**
   - Name: "Das Denkt Deutschland Web"
   - Authorized JavaScript origins:
     - `http://localhost:5173` (local dev)
     - `https://YOUR_DOMAIN.vercel.app` (production)
   - Authorized redirect URIs:
     - `http://localhost:5173/auth/google/callback` (local)
     - `https://YOUR_DOMAIN.vercel.app/auth/google/callback` (Vercel)
     - `https://YOUR_PROJECT.supabase.co/auth-google-callback` (Supabase)
   - Click **CREATE**

5. You'll see your credentials:
   ```
   Client ID: YOUR_CLIENT_ID
   Client Secret: YOUR_CLIENT_SECRET
   ```

Copy these values for the steps above.

---

## Environment Variables: All Platforms

### Local Development (`.env.local`)

```bash
# Frontend (these are Vite env vars, prefix with VITE_)
VITE_SUPABASE_URL=https://YOUR_PROJECT.supabase.co
VITE_SUPABASE_PROJECT_ID=YOUR_PROJECT_ID
VITE_SUPABASE_PUBLISHABLE_KEY=YOUR_PUBLIC_KEY

# Backend will use function secrets, not these
# But for local testing, you may need:
GOOGLE_CLIENT_ID=YOUR_CLIENT_ID
GOOGLE_CLIENT_SECRET=YOUR_CLIENT_SECRET
GOOGLE_REDIRECT_URI=http://localhost:5173/auth/google/callback
```

### Production (Supabase)

Set via Supabase CLI:
```bash
supabase secrets set GOOGLE_CLIENT_ID=...
supabase secrets set GOOGLE_CLIENT_SECRET=...
supabase secrets set GOOGLE_REDIRECT_URI=https://your-domain/auth/google/callback
```

### Production (Vercel)

Set in Vercel Dashboard → Settings → Environment Variables:
```
GOOGLE_CLIENT_ID=...
GOOGLE_CLIENT_SECRET=...
GOOGLE_REDIRECT_URI=https://your-domain.vercel.app/auth/google/callback
```

---

## Test the Flow

### 1. Start Dev Server

```bash
npm run dev
```

### 2. Go to Admin Panel

```
http://localhost:5173/admin
```

### 3. Click "Link Google Drive"

Paste your Google Client ID when prompted.

### 4. You'll be redirected to Google consent screen

Grant "Drive File API" access.

### 5. Redirects to `/auth/google/callback`

This page:
- Calls your callback endpoint
- Exchanges code for token
- Prompts for Google Drive Folder ID
- Saves everything to localStorage

### 6. Folder ID Prompt

Get a Google Drive Folder ID:
1. Create a folder in Google Drive: "Canon Backups"
2. Open it
3. Copy ID from URL: `https://drive.google.com/drive/folders/FOLDER_ID`
4. Paste into prompt

### 7. Success!

You should see: "✅ Google Drive linked successfully!"

Canon auto-syncs now back up to your Google Drive folder.

---

## Troubleshooting

### "Invalid Client ID"
- Check Google Cloud Console → Credentials
- Copy exact Client ID from OAuth 2.0 Client
- Make sure it's a "Web application" type

### "Redirect URI mismatch"
- Google expects exact redirect URI match
- Check in Google Cloud Console → Credentials
- All redirect URIs must be listed
- If testing locally, add `http://localhost:5173/auth/google/callback`

### "Token exchange failed"
- Check function logs:
  - Supabase: Dashboard → Functions → auth-google-callback
  - Vercel: Dashboard → Deployments → Logs
- Verify secrets are set correctly
- Check network tab (F12) for actual error response

### "No code received"
- Google consent screen not showing
- Check browser console for OAuth errors
- Verify JavaScript origins are correct in Google Cloud

### Function not deployed
```bash
# Supabase
supabase functions list
supabase functions deploy auth-google-callback --no-verify-jwt

# Vercel
vercel ls api/auth/google/callback.ts
vercel deploy --prod
```

---

## Architecture: How It Works

```
1. Admin clicks "Link Google Drive" in AdminPanel
   └─> Calls googleDriveAdminService.startOAuthFlow()
   
2. Redirects to Google consent screen
   └─> User grants permissions
   
3. Google redirects to /auth/google/callback?code=...&state=...
   └─> AuthGoogleCallback page loads
   
4. Page calls backend endpoint:
   GET /auth/google/callback?code=...&state=...
   
5. Backend (Supabase or Vercel):
   ├─> Extracts code from query
   ├─> Calls Google OAuth API with code + secret
   └─> Gets back access_token
   
6. Returns token to frontend
   └─> AuthGoogleCallback saves to localStorage
   
7. Prompts for Google Drive Folder ID
   └─> Saves config to localStorage
   
8. ✅ Google Drive linked!
   └─> canonSyncService auto-backs up on every sync
```

---

## What's Next

Once this is working:

**Step 3:** Integrate AdminPanel component into `/admin` route and test the full flow:
1. Create topic
2. Publish topic
3. Canon auto-syncs to Supabase + Google Drive
4. Verify backup in Google Drive folder

---

## Files Created

```
✅ supabase/functions/auth-google-callback/index.ts
   - Supabase Edge Function
   
✅ api/auth/google/callback.ts
   - Vercel Function

✅ src/pages/AuthGoogleCallback.tsx
   - OAuth callback page
   
✅ src/pages/AuthError.tsx
   - Error page
   
✅ src/App.tsx (updated)
   - Added routes
```

---

**Questions?** Check the INTEGRATION_GUIDE.md for architecture overview or Google's OAuth documentation.
