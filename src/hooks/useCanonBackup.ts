import { useEffect, useState, useCallback } from 'react';
import CanonBackupManager, { CanonVersion, CanonBackupConfig } from '@/lib/canonBackup';

interface UseCanonBackupOptions {
  enabled?: boolean;
  maxVersions?: number;
  backupOnSave?: boolean;
}

export function useCanonBackup(options: UseCanonBackupOptions = {}) {
  const {
    enabled = true,
    maxVersions = 50,
    backupOnSave = true,
  } = options;

  const [manager, setManager] = useState<CanonBackupManager | null>(null);
  const [versions, setVersions] = useState<CanonVersion[]>([]);
  const [isBackingUp, setIsBackingUp] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Initialize manager
  useEffect(() => {
    if (!enabled) return;

    const config: CanonBackupConfig = {
      googleDriveFolderId: localStorage.getItem('canon_gdrive_folder') || '',
      enableBackup: !!localStorage.getItem('google_drive_access_token'),
      backupOnSave,
      maxVersions,
    };

    const newManager = new CanonBackupManager(config);
    setManager(newManager);
    setVersions(newManager.getVersions());
  }, [enabled, maxVersions, backupOnSave]);

  // Save a new canon version
  const saveVersion = useCallback(async (content: string) => {
    if (!manager) return;

    try {
      setIsBackingUp(true);
      setError(null);
      const version = await manager.saveCanonVersion(content);
      setVersions(manager.getVersions());
      return version;
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Unknown error';
      setError(errorMsg);
      console.error('Canon backup error:', errorMsg);
    } finally {
      setIsBackingUp(false);
    }
  }, [manager]);

  // Get all versions
  const getVersions = useCallback(() => {
    return manager?.getVersions() || [];
  }, [manager]);

  // Get latest version
  const getLatestVersion = useCallback(() => {
    return manager?.getLatestVersion();
  }, [manager]);

  // Restore to previous version
  const restoreVersion = useCallback(async (hash: string) => {
    if (!manager) return;

    try {
      setError(null);
      const content = await manager.restoreVersion(hash);
      return content;
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Unknown error';
      setError(errorMsg);
      throw err;
    }
  }, [manager]);

  // Authenticate with Google Drive
  const authenticateGoogleDrive = useCallback(async (clientId: string, redirectUri: string) => {
    if (!manager) return;

    try {
      setError(null);
      await manager.authenticateGoogleDrive(clientId, redirectUri);
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Unknown error';
      setError(errorMsg);
    }
  }, [manager]);

  return {
    saveVersion,
    getVersions,
    getLatestVersion,
    restoreVersion,
    authenticateGoogleDrive,
    versions,
    isBackingUp,
    error,
    manager,
  };
}
