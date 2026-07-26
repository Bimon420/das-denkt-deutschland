/**
 * Canon API Service
 * RESTful interface to canon.md versioning and backup
 */

import { supabase } from './supabase';

export interface CanonSnapshot {
  id: string;
  version: string;
  content: string;
  hash: string;
  created_at: string;
  gdrive_backup_id?: string;
  gdrive_backed_up_at?: string;
  backup_url?: string;
}

export interface CanonMetadata {
  currentVersion: string;
  lastUpdated: string;
  totalSnapshots: number;
  gdriveFolderLinked: boolean;
}

class CanonApiService {
  /**
   * Fetch current canon.md content
   */
  async getCanon(): Promise<string> {
    try {
      const response = await fetch('/canon.md');
      if (!response.ok) throw new Error('Failed to fetch canon.md');
      return response.text();
    } catch (e) {
      console.error('Error fetching canon.md:', e);
      throw e;
    }
  }

  /**
   * Get canon metadata from Supabase
   */
  async getCanonMetadata(): Promise<CanonMetadata> {
    try {
      const { data, error } = await supabase
        .from('canon_snapshots')
        .select('created_at, gdrive_backup_id')
        .order('created_at', { ascending: false })
        .limit(1);

      if (error) throw error;

      const lastSnapshot = data?.[0];
      const gdriveFolderLinked = !!localStorage.getItem('canon_gdrive_folder');

      return {
        currentVersion: new Date().toISOString().split('T')[0],
        lastUpdated: lastSnapshot?.created_at || new Date().toISOString(),
        totalSnapshots: (await this.getCanonSnapshots()).length,
        gdriveFolderLinked,
      };
    } catch (e) {
      console.error('Error fetching canon metadata:', e);
      return {
        currentVersion: new Date().toISOString().split('T')[0],
        lastUpdated: new Date().toISOString(),
        totalSnapshots: 0,
        gdriveFolderLinked: false,
      };
    }
  }

  /**
   * Save canon snapshot to Supabase
   */
  async saveCanonSnapshot(content: string, hash: string): Promise<CanonSnapshot> {
    try {
      const { data, error } = await supabase
        .from('canon_snapshots')
        .insert({
          content,
          hash,
          version: new Date().toISOString(),
          created_at: new Date().toISOString(),
        })
        .select()
        .single();

      if (error) throw error;
      return data as CanonSnapshot;
    } catch (e) {
      console.error('Error saving canon snapshot:', e);
      throw e;
    }
  }

  /**
   * Get all canon snapshots
   */
  async getCanonSnapshots(): Promise<CanonSnapshot[]> {
    try {
      const { data, error } = await supabase
        .from('canon_snapshots')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data as CanonSnapshot[];
    } catch (e) {
      console.error('Error fetching canon snapshots:', e);
      return [];
    }
  }

  /**
   * Get specific snapshot by hash
   */
  async getCanonSnapshot(hash: string): Promise<CanonSnapshot | null> {
    try {
      const { data, error } = await supabase
        .from('canon_snapshots')
        .select('*')
        .eq('hash', hash)
        .single();

      if (error && error.code !== 'PGRST116') throw error;
      return data as CanonSnapshot || null;
    } catch (e) {
      console.error('Error fetching canon snapshot:', e);
      return null;
    }
  }

  /**
   * Link Google Drive folder for backups
   */
  async linkGoogleDriveFolder(folderId: string, accessToken: string): Promise<void> {
    try {
      localStorage.setItem('canon_gdrive_folder', folderId);
      localStorage.setItem('google_drive_access_token', accessToken);

      // Test connection
      const response = await fetch(`https://www.googleapis.com/drive/v3/files/${folderId}`, {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      });

      if (!response.ok) {
        localStorage.removeItem('canon_gdrive_folder');
        localStorage.removeItem('google_drive_access_token');
        throw new Error('Failed to verify Google Drive access');
      }
    } catch (e) {
      console.error('Error linking Google Drive:', e);
      throw e;
    }
  }

  /**
   * Unlink Google Drive
   */
  async unlinkGoogleDrive(): Promise<void> {
    localStorage.removeItem('canon_gdrive_folder');
    localStorage.removeItem('google_drive_access_token');
  }

  /**
   * Check if Google Drive is linked
   */
  isGoogleDriveLinked(): boolean {
    return !!localStorage.getItem('canon_gdrive_folder') &&
           !!localStorage.getItem('google_drive_access_token');
  }

  /**
   * Restore from snapshot
   */
  async restoreFromSnapshot(hash: string): Promise<string> {
    try {
      const snapshot = await this.getCanonSnapshot(hash);
      if (!snapshot) {
        throw new Error(`Snapshot ${hash} not found`);
      }
      return snapshot.content;
    } catch (e) {
      console.error('Error restoring from snapshot:', e);
      throw e;
    }
  }

  /**
   * Delete snapshot (with user confirmation)
   */
  async deleteSnapshot(hash: string): Promise<void> {
    try {
      const { error } = await supabase
        .from('canon_snapshots')
        .delete()
        .eq('hash', hash);

      if (error) throw error;
    } catch (e) {
      console.error('Error deleting snapshot:', e);
      throw e;
    }
  }
}

export const canonApi = new CanonApiService();
export default canonApi;
