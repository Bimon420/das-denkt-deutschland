/**
 * Canon Backup System
 * Manages versioning and Google Drive backup of canon.md
 */

export interface CanonBackupConfig {
  googleDriveFolderId: string;
  enableBackup: boolean;
  backupOnSave: boolean;
  maxVersions: number;
}

export interface CanonVersion {
  timestamp: string;
  hash: string;
  content: string;
  backup?: {
    googleDriveId?: string;
    backed_up_at?: string;
    url?: string;
  };
}

const CANONICAL_PATH = '/canon.md';
const BACKUP_STORAGE_KEY = 'canon_versions';

export class CanonBackupManager {
  private config: CanonBackupConfig;
  private versions: CanonVersion[] = [];

  constructor(config: CanonBackupConfig) {
    this.config = config;
    this.loadVersionsFromStorage();
  }

  /**
   * Load version history from localStorage
   */
  private loadVersionsFromStorage() {
    try {
      const stored = localStorage.getItem(BACKUP_STORAGE_KEY);
      if (stored) {
        this.versions = JSON.parse(stored);
      }
    } catch (e) {
      console.error('Failed to load canon versions:', e);
      this.versions = [];
    }
  }

  /**
   * Save versions to localStorage
   */
  private saveVersionsToStorage() {
    try {
      const toStore = this.versions.slice(-this.config.maxVersions);
      localStorage.setItem(BACKUP_STORAGE_KEY, JSON.stringify(toStore));
    } catch (e) {
      console.error('Failed to save canon versions:', e);
    }
  }

  /**
   * Generate hash of canon content (simple implementation)
   */
  private generateHash(content: string): string {
    let hash = 0;
    for (let i = 0; i < content.length; i++) {
      const char = content.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash;
    }
    return Math.abs(hash).toString(16);
  }

  /**
   * Create a new version of canon.md
   */
  async saveCanonVersion(content: string): Promise<CanonVersion> {
    const timestamp = new Date().toISOString();
    const hash = this.generateHash(content);

    const version: CanonVersion = {
      timestamp,
      hash,
      content,
    };

    // Check if content actually changed
    const lastVersion = this.versions[this.versions.length - 1];
    if (lastVersion && lastVersion.hash === hash) {
      return lastVersion;
    }

    this.versions.push(version);
    this.saveVersionsToStorage();

    // Backup to Google Drive if enabled
    if (this.config.enableBackup && this.config.googleDriveFolderId) {
      try {
        await this.backupToGoogleDrive(version);
      } catch (e) {
        console.error('Failed to backup to Google Drive:', e);
        // Don't throw - local backup succeeded even if cloud failed
      }
    }

    return version;
  }

  /**
   * Backup version to Google Drive
   */
  private async backupToGoogleDrive(version: CanonVersion): Promise<void> {
    const accessToken = localStorage.getItem('google_drive_access_token');
    if (!accessToken) {
      throw new Error('Google Drive access token not found. Run authenticateGoogleDrive() first.');
    }

    const timestamp = new Date(version.timestamp).toLocaleString('de-DE');
    const filename = `canon-${version.timestamp.split('T')[0]}-${version.hash.slice(0, 8)}.md`;
    const mimeType = 'text/markdown';

    const metadata = {
      name: filename,
      mimeType,
      parents: [this.config.googleDriveFolderId],
      description: `Canon backup from ${timestamp}`,
      properties: {
        hash: version.hash,
        originalTimestamp: version.timestamp,
      },
    };

    const form = new FormData();
    form.append(
      'metadata',
      new Blob([JSON.stringify(metadata)], { type: 'application/json' })
    );
    form.append('file', new Blob([version.content], { type: mimeType }));

    const response = await fetch(
      'https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart',
      {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
        body: form,
      }
    );

    if (!response.ok) {
      throw new Error(`Google Drive upload failed: ${response.statusText}`);
    }

    const result = await response.json();
    version.backup = {
      googleDriveId: result.id,
      backed_up_at: new Date().toISOString(),
      url: `https://drive.google.com/file/d/${result.id}/view`,
    };

    this.saveVersionsToStorage();
  }

  /**
   * Get all versions
   */
  getVersions(): CanonVersion[] {
    return [...this.versions];
  }

  /**
   * Get specific version by hash
   */
  getVersion(hash: string): CanonVersion | undefined {
    return this.versions.find(v => v.hash === hash);
  }

  /**
   * Get latest version
   */
  getLatestVersion(): CanonVersion | undefined {
    return this.versions[this.versions.length - 1];
  }

  /**
   * Restore to previous version
   */
  async restoreVersion(hash: string): Promise<string> {
    const version = this.getVersion(hash);
    if (!version) {
      throw new Error(`Version ${hash} not found`);
    }
    return version.content;
  }

  /**
   * Initialize Google Drive authentication
   * Must be called once per session
   */
  async authenticateGoogleDrive(clientId: string, redirectUri: string): Promise<void> {
    const scope = 'https://www.googleapis.com/auth/drive.file';
    const state = Math.random().toString(36).substring(7);

    sessionStorage.setItem('google_oauth_state', state);

    const authUrl = new URL('https://accounts.google.com/o/oauth2/v2/auth');
    authUrl.searchParams.set('client_id', clientId);
    authUrl.searchParams.set('redirect_uri', redirectUri);
    authUrl.searchParams.set('response_type', 'code');
    authUrl.searchParams.set('scope', scope);
    authUrl.searchParams.set('state', state);
    authUrl.searchParams.set('access_type', 'offline');

    window.location.href = authUrl.toString();
  }

  /**
   * Handle OAuth redirect (call from callback page)
   */
  async handleOAuthRedirect(code: string): Promise<void> {
    // This would exchange the code for tokens
    // Implementation depends on backend support
    console.log('OAuth redirect handling requires backend exchange');
  }
}

export default CanonBackupManager;
