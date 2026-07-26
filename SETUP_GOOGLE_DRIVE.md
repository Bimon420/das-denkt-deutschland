# Canon Google Drive Backup Setup Guide

This guide walks you through setting up automatic Canon backup to Google Drive.

## Prerequisites

- Google account
- Access to Google Cloud Console
- A Google Drive folder for backups

## Step 1: Create Google Cloud Project

1. Go to [Google Cloud Console](https://console.cloud.google.com)
2. Create a new project (name it `DasDenktDeutschland`)
3. Wait for it to initialize

## Step 2: Enable Google Drive API

1. In the Cloud Console, go to **APIs & Services** → **Library**
2. Search for "Google Drive API"
3. Click on it and press **ENABLE**
4. Wait for API to be enabled

## Step 3: Create OAuth 2.0 Credentials

1. Go to **APIs & Services** → **Credentials**
2. Click **+ CREATE CREDENTIALS** → **OAuth client ID**
3. You may need to create an "OAuth consent screen" first
   - Click **CONFIGURE CONSENT SCREEN**
   - User type: **External**
   - Add required info (app name, user support email, developer email)
   - Add scopes: `https://www.googleapis.com/auth/drive.file`
   - Save
4. Back to Credentials → **+ CREATE CREDENTIALS** → **OAuth client ID**
5. Application type: **Web application**
6. Add authorized redirect URI: `http://localhost:5173/auth/callback` (dev) and your production URL
7. Click **CREATE**
8. Copy your **CLIENT_ID** (you'll need this)

## Step 4: Create Google Drive Folder

1. Go to [Google Drive](https://drive.google.com)
2. Create a new folder: `Canon-Backups` (or whatever you prefer)
3. Right-click → **Share**
4. Share with your project's service account (or keep private if using personal OAuth)
5. Copy the folder ID from the URL:
   ```
   https://drive.google.com/drive/folders/FOLDER_ID_HERE
   ```

## Step 5: Configure in Application

### Option A: Manual Configuration (Admin Panel)

1. Start dev server: `npm run dev`
2. Go to `/admin` page
3. Find "Canon Backup Settings" section
4. Click "Link Google Drive"
5. Paste your Google Cloud Client ID
6. Click "Authenticate with Google"
7. Grant permissions when prompted
8. Paste your folder ID
9. Click "Save"

**Backups now automatically save to Google Drive!**

### Option B: Environment Variables

Create a `.env.local` file (never commit to git):

```bash
VITE_GOOGLE_CLIENT_ID=YOUR_CLIENT_ID_HERE
VITE_GOOGLE_DRIVE_FOLDER_ID=YOUR_FOLDER_ID_HERE
VITE_CANON_BACKUP_ENABLED=true
```

Then in your app initialization:

```typescript
import CanonBackupManager from '@/lib/canonBackup';

const manager = new CanonBackupManager({
  googleDriveFolderId: import.meta.env.VITE_GOOGLE_DRIVE_FOLDER_ID,
  enableBackup: import.meta.env.VITE_CANON_BACKUP_ENABLED === 'true',
  backupOnSave: true,
  maxVersions: 50,
});
```

## Step 6: Test Backup

1. Edit `canon.md` in the app
2. Click "Save"
3. Check that "Backing up..." appears briefly
4. Go to your Google Drive folder
5. You should see a new file: `canon-YYYY-MM-DD-HASH.md`

If backup fails, check browser console (F12) for error messages.

## Troubleshooting

### "Google Drive access token not found"
- You haven't authenticated yet
- Click "Link Google Drive" in admin panel
- Or check that `google_drive_access_token` is in localStorage

### "Failed to verify Google Drive access"
- Your OAuth token has expired (valid for ~1 hour)
- Your folder ID is wrong
- Your account doesn't have access to the folder
- Re-authenticate in admin panel

### "Failed to upload to Google Drive"
- You're out of Google Drive storage
- The folder was deleted
- Your account lost access
- The API rate limit was exceeded

**Solution:** Check Google Cloud Console logs, or re-link the folder.

### Backups not appearing in Google Drive
- Check browser console for errors
- Verify `enableBackup: true` in config
- Make sure you're authenticated
- Check that folder ID is correct

## Security Considerations

⚠️ **Important:**

1. **Never commit credentials to git**
   - `.env.local` should be in `.gitignore`
   - Keep CLIENT_ID private (technically it's public, but folder ID should be protected)

2. **Folder Access**
   - Only share the backup folder with your team
   - Consider making it read-only for non-admins

3. **Token Storage**
   - Tokens are stored in browser localStorage
   - Not secure for sensitive apps
   - For production, use a backend OAuth flow instead

4. **Audit Trail**
   - Google Drive maintains version history
   - Check revision history to see who/when backups were made
   - Each backup includes metadata with timestamp and hash

## Advanced: Backend OAuth Flow (Production)

For production, use a backend to exchange OAuth codes for tokens:

1. **Frontend** → User clicks "Link Drive" → Redirects to Google OAuth
2. **Google** → User grants permission → Redirects to `YOUR_BACKEND/auth/callback?code=...`
3. **Backend** → Exchanges code for long-lived tokens → Stores securely
4. **Frontend** → Calls your backend to trigger backups
5. **Backend** → Uses stored token to upload to Google Drive

This prevents tokens from being stored in browser localStorage.

See documentation in `API.md` for implementing this.

## Monitoring Backups

### View All Backups

In admin panel or via code:

```typescript
import { canonApi } from '@/integrations/canonApiService';

const snapshots = await canonApi.getCanonSnapshots();
snapshots.forEach(s => {
  console.log(s.created_at, s.gdrive_backup_id, s.backup_url);
});
```

### Auto-Cleanup Old Backups

Configure `maxVersions: 50` in CanonBackupManager to keep only the 50 most recent versions.

To manually delete old backups in Google Drive:
1. Go to folder
2. Sort by date (oldest first)
3. Select old files
4. Delete

## Backup Retention Policy

Suggested policy:
- Keep **last 30 days** in Google Drive
- Archive older versions to cold storage (Google Drive Archive)
- Keep Supabase snapshots indefinitely (for SQL queries)

---

**Questions?** Check `canon.md` and `API.md` for architectural details.
