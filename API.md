# Das Denkt Deutschland: API Documentation

---

## Canon System API

The Canon system provides versioning, backup, and audit trail management for `canon.md` — the single source of truth for the project architecture.

### Overview

```
Local Backup (localStorage)
    ↓
CanonBackupManager (in-memory)
    ↓
Google Drive (optional)
    ↓
Supabase (database)
```

### Core Services

#### 1. `CanonBackupManager` (`src/lib/canonBackup.ts`)

Low-level backup and versioning engine. Manages in-memory version history and Google Drive uploads.

**Methods:**

```typescript
// Save a new version of canon.md
saveCanonVersion(content: string): Promise<CanonVersion>

// Get all versions
getVersions(): CanonVersion[]

// Get specific version by hash
getVersion(hash: string): CanonVersion | undefined

// Get latest version
getLatestVersion(): CanonVersion | undefined

// Restore to previous version
restoreVersion(hash: string): Promise<string>

// Initialize Google Drive authentication
authenticateGoogleDrive(clientId: string, redirectUri: string): Promise<void>
```

**Example Usage:**

```typescript
import CanonBackupManager from '@/lib/canonBackup';

const manager = new CanonBackupManager({
  googleDriveFolderId: 'YOUR_FOLDER_ID',
  enableBackup: true,
  backupOnSave: true,
  maxVersions: 50,
});

// Save new version
const version = await manager.saveCanonVersion(canonContent);
console.log(version.timestamp, version.hash);

// Get all versions
const allVersions = manager.getVersions();

// Restore
const restored = await manager.restoreVersion(version.hash);
```

---

#### 2. `useCanonBackup()` Hook (`src/hooks/useCanonBackup.ts`)

React hook for managing canon versioning in components. Automatically handles state and error management.

**Returns:**

```typescript
{
  saveVersion: (content: string) => Promise<CanonVersion>;
  getVersions: () => CanonVersion[];
  getLatestVersion: () => CanonVersion | undefined;
  restoreVersion: (hash: string) => Promise<string>;
  authenticateGoogleDrive: (clientId: string, redirectUri: string) => Promise<void>;
  versions: CanonVersion[];
  isBackingUp: boolean;
  error: string | null;
  manager: CanonBackupManager | null;
}
```

**Example Usage:**

```typescript
import { useCanonBackup } from '@/hooks/useCanonBackup';

export function CanonEditor() {
  const { saveVersion, versions, isBackingUp, error } = useCanonBackup({
    enabled: true,
    maxVersions: 50,
    backupOnSave: true,
  });

  const handleSave = async (content: string) => {
    try {
      const version = await saveVersion(content);
      console.log('Saved:', version.hash);
    } catch (e) {
      console.error('Failed to save:', error);
    }
  };

  return (
    <div>
      {isBackingUp && <p>Backing up...</p>}
      {error && <p style={{ color: 'red' }}>Error: {error}</p>}
      {versions.map(v => (
        <div key={v.hash}>{v.timestamp}</div>
      ))}
    </div>
  );
}
```

---

#### 3. `CanonApiService` (`src/integrations/canonApiService.ts`)

High-level RESTful service layer for canon management. Integrates with Supabase for persistence.

**Methods:**

```typescript
// Fetch current canon.md
getCanon(): Promise<string>

// Get canon metadata
getCanonMetadata(): Promise<CanonMetadata>

// Save snapshot to Supabase
saveCanonSnapshot(content: string, hash: string): Promise<CanonSnapshot>

// Get all snapshots
getCanonSnapshots(): Promise<CanonSnapshot[]>

// Get specific snapshot
getCanonSnapshot(hash: string): Promise<CanonSnapshot | null>

// Link Google Drive folder
linkGoogleDriveFolder(folderId: string, accessToken: string): Promise<void>

// Unlink Google Drive
unlinkGoogleDrive(): Promise<void>

// Check if linked
isGoogleDriveLinked(): boolean

// Restore from snapshot
restoreFromSnapshot(hash: string): Promise<string>

// Delete snapshot
deleteSnapshot(hash: string): Promise<void>
```

**Example Usage:**

```typescript
import { canonApi } from '@/integrations/canonApiService';

// Get current canon
const canon = await canonApi.getCanon();

// Save snapshot
await canonApi.saveCanonSnapshot(canon, 'hash123');

// Get metadata
const meta = await canonApi.getCanonMetadata();
console.log(meta.totalSnapshots);

// Link Google Drive
await canonApi.linkGoogleDriveFolder(folderId, accessToken);
```

---

### Data Models

#### `CanonVersion`

```typescript
interface CanonVersion {
  timestamp: string;      // ISO 8601 timestamp
  hash: string;          // Content hash
  content: string;       // Full markdown content
  backup?: {
    googleDriveId?: string;
    backed_up_at?: string;
    url?: string;
  };
}
```

#### `CanonSnapshot` (Supabase)

```typescript
interface CanonSnapshot {
  id: string;
  version: string;
  content: string;
  hash: string;
  created_at: string;
  gdrive_backup_id?: string;
  gdrive_backed_up_at?: string;
  backup_url?: string;
}
```

#### `CanonMetadata`

```typescript
interface CanonMetadata {
  currentVersion: string;
  lastUpdated: string;
  totalSnapshots: number;
  gdriveFolderLinked: boolean;
}
```

---

### Database Schema (Supabase)

#### Table: `canon_snapshots`

```sql
CREATE TABLE canon_snapshots (
  id BIGINT PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
  version TEXT NOT NULL,
  content TEXT NOT NULL,
  hash TEXT UNIQUE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  gdrive_backup_id TEXT,
  gdrive_backed_up_at TIMESTAMP WITH TIME ZONE,
  backup_url TEXT
);

CREATE INDEX idx_canon_hash ON canon_snapshots(hash);
CREATE INDEX idx_canon_created ON canon_snapshots(created_at DESC);
```

---

### Google Drive Integration

#### Setup

1. Create a Google Cloud project at https://console.cloud.google.com
2. Enable Google Drive API
3. Create OAuth 2.0 credentials (Desktop/Web app)
4. Get your `CLIENT_ID` and `FOLDER_ID`

#### Authentication Flow

```typescript
// Step 1: User clicks "Link Google Drive"
const manager = new CanonBackupManager(config);
await manager.authenticateGoogleDrive(
  'YOUR_CLIENT_ID',
  'https://yourapp.com/auth/callback'
);

// Step 2: User grants permissions in popup
// Step 3: Callback page exchanges code for token
await manager.handleOAuthRedirect(code);

// Step 4: Automatic backups enabled
```

#### Backup Process

When `enableBackup: true`:

1. Content hash is computed
2. If hash changed, new version created
3. File uploaded to Google Drive folder as:
   - `canon-YYYY-MM-DD-HASH.md`
   - With metadata (hash, timestamp)
   - In specified folder

#### Restore from Google Drive

```typescript
// Get all backups from folder
const snapshots = await canonApi.getCanonSnapshots();

// Find backup by date/hash
const backup = snapshots.find(s => s.hash === 'abc123');

// Restore content
const content = await canonApi.restoreFromSnapshot(backup.hash);
```

---

### Environment Variables

```bash
# Supabase
VITE_SUPABASE_URL=https://...supabase.co
VITE_SUPABASE_PROJECT_ID=...
VITE_SUPABASE_PUBLISHABLE_KEY=...

# Google Drive (optional, set via UI)
# Stored in localStorage after authentication
```

---

### Common Use Cases

#### Save Canon After Edit

```typescript
async function handleCanonEdit(newContent: string) {
  const { saveVersion } = useCanonBackup();
  
  try {
    const version = await saveVersion(newContent);
    toast.success(`Saved! Version: ${version.hash.slice(0, 8)}`);
  } catch (e) {
    toast.error('Failed to save canon');
  }
}
```

#### View Version History

```typescript
function CanonHistory() {
  const { getVersions } = useCanonBackup();
  const versions = getVersions();

  return (
    <ul>
      {versions.map(v => (
        <li key={v.hash}>
          {new Date(v.timestamp).toLocaleString('de-DE')}
          {v.backup?.url && <a href={v.backup.url}>📎 GDrive</a>}
        </li>
      ))}
    </ul>
  );
}
```

#### Restore Previous Version

```typescript
async function rollbackToVersion(hash: string) {
  const { restoreVersion, saveVersion } = useCanonBackup();
  
  try {
    const oldContent = await restoreVersion(hash);
    // Apply back to file
    await saveVersion(oldContent);
    toast.success('Rolled back!');
  } catch (e) {
    toast.error('Rollback failed');
  }
}
```

#### Link Google Drive

```typescript
async function setupGoogleDrive() {
  const { authenticateGoogleDrive } = useCanonBackup();
  
  await authenticateGoogleDrive(
    process.env.REACT_APP_GOOGLE_CLIENT_ID,
    `${window.location.origin}/auth/google/callback`
  );
}
```

---

### Error Handling

All methods throw on failure. Wrap with try-catch:

```typescript
try {
  await saveVersion(content);
} catch (e) {
  if (e instanceof Error) {
    console.error('Error:', e.message);
    // Handle: network error, auth failure, quota exceeded, etc.
  }
}
```

Common errors:
- `"Google Drive access token not found"` → User not authenticated
- `"Version not found"` → Hash doesn't match any snapshot
- `"Failed to verify Google Drive access"` → Token expired, revoked, or invalid folder

---

### Migration from Previous System

If canon.md was previously managed elsewhere:

```typescript
// Import old content
const oldCanon = await fetch('/canon-old.md').then(r => r.text());

// Save as first version
const manager = new CanonBackupManager(config);
const version = await manager.saveCanonVersion(oldCanon);

// Backup to Supabase + GDrive
await canonApi.saveCanonSnapshot(oldCanon, version.hash);
```

---

### Best Practices

1. **Always use `useCanonBackup()` in React components** — handles state/errors automatically
2. **Call `saveVersion()` on blur/save** — avoid excessive backups, check hash first
3. **Keep Google Drive folder separate** — don't mix with other files
4. **Review snapshots monthly** — delete old backups if quota is tight
5. **Export snapshots periodically** — create offline archive in Supabase backup

---

### Monitoring & Debugging

Check browser localStorage:
```javascript
// View all canon versions
JSON.parse(localStorage.getItem('canon_versions'))

// Check Google Drive status
localStorage.getItem('canon_gdrive_folder')
localStorage.getItem('google_drive_access_token')
```

Check Supabase:
```sql
SELECT hash, created_at, gdrive_backup_id 
FROM canon_snapshots 
ORDER BY created_at DESC 
LIMIT 20;
```

---

**Next:** Configure Supabase table, set up Google Cloud project, link admin panel to Canon system.
