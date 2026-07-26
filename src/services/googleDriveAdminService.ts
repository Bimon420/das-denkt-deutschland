/**
 * Google Drive Admin Service
 * UI-based Google Drive configuration and authentication
 */

export interface GoogleDriveConfig {
  clientId: string;
  folderId: string;
  folderName: string;
  connectedAt: string;
  isLinked: boolean;
}

class GoogleDriveAdminService {
  private readonly LOCAL_STORAGE_KEY = 'canon_gdrive_config';
  private readonly TOKEN_KEY = 'google_drive_access_token';
  private readonly FOLDER_KEY = 'canon_gdrive_folder';

  /**
   * Get current configuration
   */
  getConfig(): GoogleDriveConfig | null {
    try {
      const stored = localStorage.getItem(this.LOCAL_STORAGE_KEY);
      return stored ? JSON.parse(stored) : null;
    } catch {
      return null;
    }
  }

  /**
   * Check if Google Drive is linked
   */
  isLinked(): boolean {
    const token = localStorage.getItem(this.TOKEN_KEY);
    const folder = localStorage.getItem(this.FOLDER_KEY);
    return !!(token && folder);
  }

  /**
   * Start OAuth flow
   */
  startOAuthFlow(clientId: string, redirectUri: string) {
    const scope = 'https://www.googleapis.com/auth/drive.file';
    const state = this.generateState();
    const nonce = Math.random().toString(36).substring(7);

    sessionStorage.setItem('oauth_state', state);
    sessionStorage.setItem('oauth_nonce', nonce);

    const authUrl = new URL('https://accounts.google.com/o/oauth2/v2/auth');
    authUrl.searchParams.set('client_id', clientId);
    authUrl.searchParams.set('redirect_uri', redirectUri);
    authUrl.searchParams.set('response_type', 'code');
    authUrl.searchParams.set('scope', scope);
    authUrl.searchParams.set('state', state);
    authUrl.searchParams.set('access_type', 'offline');
    authUrl.searchParams.set('prompt', 'consent');

    window.location.href = authUrl.toString();
  }

  /**
   * Handle OAuth callback (call from callback page)
   */
  async handleOAuthCallback(code: string, state: string): Promise<{ success: boolean; error?: string }> {
    const storedState = sessionStorage.getItem('oauth_state');

    if (state !== storedState) {
      return { success: false, error: 'Invalid state parameter' };
    }

    try {
      // Exchange code for token (requires backend)
      // For now, store the code and let backend exchange it
      localStorage.setItem('oauth_code', code);
      return { success: true };
    } catch (e) {
      return {
        success: false,
        error: e instanceof Error ? e.message : 'OAuth exchange failed',
      };
    }
  }

  /**
   * Test Google Drive connection
   */
  async testConnection(folderId: string, accessToken: string): Promise<boolean> {
    try {
      const response = await fetch(
        `https://www.googleapis.com/drive/v3/files/${folderId}?fields=id,name`,
        {
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
        }
      );

      return response.ok;
    } catch {
      return false;
    }
  }

  /**
   * Save Google Drive configuration
   */
  async saveConfig(
    clientId: string,
    folderId: string,
    folderName: string,
    accessToken: string
  ): Promise<GoogleDriveConfig> {
    // Test connection first
    const isValid = await this.testConnection(folderId, accessToken);
    if (!isValid) {
      throw new Error('Failed to connect to Google Drive folder. Check folder ID and token.');
    }

    const config: GoogleDriveConfig = {
      clientId,
      folderId,
      folderName,
      connectedAt: new Date().toISOString(),
      isLinked: true,
    };

    localStorage.setItem(this.LOCAL_STORAGE_KEY, JSON.stringify(config));
    localStorage.setItem(this.TOKEN_KEY, accessToken);
    localStorage.setItem(this.FOLDER_KEY, folderId);

    return config;
  }

  /**
   * Disconnect Google Drive
   */
  disconnect() {
    localStorage.removeItem(this.LOCAL_STORAGE_KEY);
    localStorage.removeItem(this.TOKEN_KEY);
    localStorage.removeItem(this.FOLDER_KEY);
    localStorage.removeItem('oauth_code');
    sessionStorage.removeItem('oauth_state');
    sessionStorage.removeItem('oauth_nonce');
  }

  /**
   * Get access token
   */
  getAccessToken(): string | null {
    return localStorage.getItem(this.TOKEN_KEY);
  }

  /**
   * Get folder ID
   */
  getFolderId(): string | null {
    return localStorage.getItem(this.FOLDER_KEY);
  }

  /**
   * Refresh token (if needed)
   */
  async refreshToken(refreshToken: string): Promise<string> {
    // This requires backend support
    // For now, throw error prompting re-authentication
    throw new Error('Token expired. Please re-authenticate with Google Drive.');
  }

  /**
   * List backups in folder
   */
  async listBackups(): Promise<any[]> {
    const token = this.getAccessToken();
    const folderId = this.getFolderId();

    if (!token || !folderId) {
      throw new Error('Google Drive not connected');
    }

    try {
      const response = await fetch(
        `https://www.googleapis.com/drive/v3/files?q=parents='${folderId}'&fields=id,name,createdTime,modifiedTime&orderBy=createdTime desc`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (!response.ok) {
        throw new Error('Failed to list backups');
      }

      const data = await response.json();
      return data.files || [];
    } catch (e) {
      throw new Error(`Failed to list backups: ${e}`);
    }
  }

  /**
   * Delete backup file
   */
  async deleteBackup(fileId: string): Promise<boolean> {
    const token = this.getAccessToken();

    if (!token) {
      throw new Error('Google Drive not connected');
    }

    try {
      const response = await fetch(
        `https://www.googleapis.com/drive/v3/files/${fileId}`,
        {
          method: 'DELETE',
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      return response.ok;
    } catch {
      return false;
    }
  }

  /**
   * Generate random state for OAuth
   */
  private generateState(): string {
    return Math.random().toString(36).substring(2, 15) +
           Math.random().toString(36).substring(2, 15);
  }
}

export const googleDriveAdminService = new GoogleDriveAdminService();
export default googleDriveAdminService;
