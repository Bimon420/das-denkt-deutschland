/**
 * Admin Panel Component
 * Topic management, publishing, and Google Drive integration
 */

import { useEffect, useState } from 'react';
import { adminService } from '@/services/adminService';
import { canonSyncService } from '@/services/canonSyncService';
import { googleDriveAdminService } from '@/services/googleDriveAdminService';
import { realtimeService } from '@/services/realtimeService';
import { topicService } from '@/services/topicService';
import type { Topic } from '@/services/topicService';

interface TabState {
  current: 'pending' | 'published' | 'gdrive' | 'canon';
}

export function AdminPanel() {
  const [tab, setTab] = useState<TabState['current']>('pending');
  const [pendingTopics, setPendingTopics] = useState<Topic[]>([]);
  const [publishedTopics, setPublishedTopics] = useState<Topic[]>([]);
  const [gdrive, setGdrive] = useState<any>(null);
  const [canonContent, setCanonContent] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Load initial data
  useEffect(() => {
    loadData();
    setupRealtime();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const [pending, published] = await Promise.all([
        adminService.getPendingTopics(),
        topicService.getTopics(),
      ]);

      setPendingTopics(pending);
      setPublishedTopics(published);

      if (googleDriveAdminService.isLinked()) {
        setGdrive(googleDriveAdminService.getConfig());
      }

      const canon = await canonSyncService.generateCanonFromTopics();
      setCanonContent(canon);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to load data');
    } finally {
      setLoading(false);
    }
  };

  const setupRealtime = () => {
    const unsub = realtimeService.subscribeToTopicsChanges(() => {
      loadData();
    });
    return unsub;
  };

  const handlePublish = async (id: string) => {
    try {
      setLoading(true);
      const result = await adminService.publishTopic(id);
      if (result.success) {
        setPendingTopics(p => p.filter(t => t.id !== id));
        setSuccess(`Topic published and canon synced!`);
        setTimeout(() => setSuccess(''), 3000);
        loadData();
      } else {
        setError(result.error || 'Failed to publish');
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Error publishing topic');
    } finally {
      setLoading(false);
    }
  };

  const handleReject = async (id: string) => {
    if (confirm('Are you sure? This will delete the draft topic.')) {
      try {
        setLoading(true);
        const result = await adminService.rejectTopic(id, 'Rejected by admin');
        if (result.success) {
          setPendingTopics(p => p.filter(t => t.id !== id));
          setSuccess('Topic rejected');
          setTimeout(() => setSuccess(''), 3000);
        } else {
          setError(result.error || 'Failed to reject');
        }
      } catch (e) {
        setError(e instanceof Error ? e.message : 'Error rejecting topic');
      } finally {
        setLoading(false);
      }
    }
  };

  const handleLinkGoogleDrive = () => {
    const clientId = prompt('Enter your Google Cloud Client ID:');
    if (clientId) {
      const redirectUri = `${window.location.origin}/auth/google/callback`;
      googleDriveAdminService.startOAuthFlow(clientId, redirectUri);
    }
  };

  const handleDisconnectGoogleDrive = () => {
    if (confirm('Disconnect Google Drive? Backups will no longer be created.')) {
      googleDriveAdminService.disconnect();
      setGdrive(null);
      setSuccess('Google Drive disconnected');
      setTimeout(() => setSuccess(''), 3000);
    }
  };

  const handleManualCanonSync = async () => {
    try {
      setLoading(true);
      const canon = await canonSyncService.autoSync();
      setCanonContent(canon);
      setSuccess('Canon synced successfully!');
      setTimeout(() => setSuccess(''), 3000);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to sync canon');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="admin-panel">
      {/* Header */}
      <div className="admin-header">
        <h1>📋 Admin Panel</h1>
        <p>Manage topics, publishing, and backups</p>
      </div>

      {/* Messages */}
      {error && <div className="alert alert-error">{error}</div>}
      {success && <div className="alert alert-success">{success}</div>}

      {/* Tabs */}
      <div className="admin-tabs">
        <button
          className={tab === 'pending' ? 'active' : ''}
          onClick={() => setTab('pending')}
        >
          📝 Pending ({pendingTopics.length})
        </button>
        <button
          className={tab === 'published' ? 'active' : ''}
          onClick={() => setTab('published')}
        >
          ✅ Published ({publishedTopics.length})
        </button>
        <button
          className={tab === 'gdrive' ? 'active' : ''}
          onClick={() => setTab('gdrive')}
        >
          ☁️ Google Drive
        </button>
        <button
          className={tab === 'canon' ? 'active' : ''}
          onClick={() => setTab('canon')}
        >
          📖 Canon
        </button>
      </div>

      {/* Content */}
      <div className="admin-content">
        {/* Pending Topics Tab */}
        {tab === 'pending' && (
          <section>
            <h2>Pending Topics to Review</h2>
            {loading ? (
              <p>Loading...</p>
            ) : pendingTopics.length === 0 ? (
              <p className="empty">No pending topics</p>
            ) : (
              <div className="topics-grid">
                {pendingTopics.map(topic => (
                  <div key={topic.id} className="topic-card">
                    <h3>{topic.topic}</h3>
                    <div className="positions">
                      <div className="left">
                        <strong>🔴 {topic.left_speaker}</strong>
                        <p>{topic.left_position}</p>
                      </div>
                      <div className="middle">
                        <strong>⚪ Mitte</strong>
                        <p>{topic.mitte_view}</p>
                      </div>
                      <div className="right">
                        <strong>🔵 {topic.right_speaker}</strong>
                        <p>{topic.right_position}</p>
                      </div>
                    </div>
                    <div className="actions">
                      <button
                        className="btn-publish"
                        onClick={() => handlePublish(topic.id)}
                        disabled={loading}
                      >
                        ✅ Publish
                      </button>
                      <button
                        className="btn-reject"
                        onClick={() => handleReject(topic.id)}
                        disabled={loading}
                      >
                        ❌ Reject
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </section>
        )}

        {/* Published Topics Tab */}
        {tab === 'published' && (
          <section>
            <h2>Published Topics ({publishedTopics.length})</h2>
            {loading ? (
              <p>Loading...</p>
            ) : publishedTopics.length === 0 ? (
              <p className="empty">No published topics yet</p>
            ) : (
              <div className="topics-list">
                {publishedTopics.map(topic => (
                  <div key={topic.id} className="topic-row">
                    <div>
                      <h4>{topic.topic}</h4>
                      <small>Published: {new Date(topic.published_at || '').toLocaleDateString('de-DE')}</small>
                    </div>
                    <span className="category">{topic.category}</span>
                  </div>
                ))}
              </div>
            )}
          </section>
        )}

        {/* Google Drive Tab */}
        {tab === 'gdrive' && (
          <section>
            <h2>Google Drive Backup</h2>
            {gdrive ? (
              <div className="gdrive-connected">
                <div className="status">
                  <span className="badge-success">✅ Connected</span>
                  <h3>{gdrive.folderName}</h3>
                  <p>Folder ID: <code>{gdrive.folderId}</code></p>
                  <p>Connected: {new Date(gdrive.connectedAt).toLocaleDateString('de-DE')}</p>
                </div>
                <button
                  className="btn-danger"
                  onClick={handleDisconnectGoogleDrive}
                >
                  🔗 Disconnect
                </button>
              </div>
            ) : (
              <div className="gdrive-setup">
                <p>Connect Google Drive to automatically backup canon.md</p>
                <button
                  className="btn-primary"
                  onClick={handleLinkGoogleDrive}
                >
                  🔗 Link Google Drive
                </button>
                <p className="hint">You'll need your Google Cloud Client ID</p>
              </div>
            )}
          </section>
        )}

        {/* Canon Tab */}
        {tab === 'canon' && (
          <section>
            <h2>Canon.md (Auto-Generated)</h2>
            <div className="canon-actions">
              <button
                className="btn-primary"
                onClick={handleManualCanonSync}
                disabled={loading}
              >
                🔄 Force Sync
              </button>
              <p className="hint">Auto-syncs when topics are published</p>
            </div>
            <div className="canon-preview">
              <pre>{canonContent || 'No canon generated yet'}</pre>
            </div>
          </section>
        )}
      </div>

      <style>{`
        .admin-panel {
          padding: 2rem;
          max-width: 1200px;
          margin: 0 auto;
        }

        .admin-header {
          margin-bottom: 2rem;
        }

        .admin-header h1 {
          font-size: 2rem;
          margin: 0;
        }

        .alert {
          padding: 1rem;
          margin-bottom: 1rem;
          border-radius: 8px;
          font-weight: 500;
        }

        .alert-error {
          background: #fee;
          color: #c33;
        }

        .alert-success {
          background: #efe;
          color: #3c3;
        }

        .admin-tabs {
          display: flex;
          gap: 0.5rem;
          margin-bottom: 2rem;
          border-bottom: 2px solid #eee;
        }

        .admin-tabs button {
          background: none;
          border: none;
          padding: 1rem;
          font-size: 1rem;
          cursor: pointer;
          border-bottom: 3px solid transparent;
          transition: all 0.2s;
        }

        .admin-tabs button.active {
          border-bottom-color: #4f46e5;
          color: #4f46e5;
          font-weight: 600;
        }

        .admin-content {
          background: white;
          border-radius: 8px;
          padding: 2rem;
        }

        .topics-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(350px, 1fr));
          gap: 1.5rem;
        }

        .topic-card {
          border: 1px solid #ddd;
          border-radius: 8px;
          padding: 1.5rem;
          background: #f9f9f9;
        }

        .topic-card h3 {
          margin: 0 0 1rem;
          font-size: 1.2rem;
        }

        .positions {
          margin-bottom: 1.5rem;
        }

        .positions > div {
          margin-bottom: 1rem;
        }

        .positions strong {
          display: block;
          margin-bottom: 0.5rem;
        }

        .positions p {
          margin: 0;
          color: #666;
          font-size: 0.95rem;
        }

        .actions {
          display: flex;
          gap: 0.5rem;
        }

        .actions button {
          flex: 1;
          padding: 0.75rem;
          border: none;
          border-radius: 6px;
          cursor: pointer;
          font-weight: 500;
          transition: opacity 0.2s;
        }

        .actions button:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }

        .btn-publish {
          background: #4f46e5;
          color: white;
        }

        .btn-reject {
          background: #f87171;
          color: white;
        }

        .btn-primary {
          background: #4f46e5;
          color: white;
          padding: 0.75rem 1.5rem;
          border: none;
          border-radius: 6px;
          cursor: pointer;
          font-weight: 500;
        }

        .btn-danger {
          background: #ef4444;
          color: white;
          padding: 0.75rem 1.5rem;
          border: none;
          border-radius: 6px;
          cursor: pointer;
          font-weight: 500;
        }

        .gdrive-connected {
          background: #f0fdf4;
          border: 2px solid #86efac;
          border-radius: 8px;
          padding: 2rem;
          text-align: center;
        }

        .status code {
          background: #eee;
          padding: 0.5rem 1rem;
          border-radius: 4px;
          font-size: 0.9rem;
          font-family: monospace;
        }

        .gdrive-setup {
          text-align: center;
          padding: 2rem;
        }

        .gdrive-setup .hint {
          color: #999;
          font-size: 0.9rem;
          margin-top: 1rem;
        }

        .canon-actions {
          margin-bottom: 1.5rem;
        }

        .canon-preview {
          background: #f5f5f5;
          border: 1px solid #ddd;
          border-radius: 6px;
          padding: 1rem;
          overflow: auto;
          max-height: 600px;
        }

        .canon-preview pre {
          margin: 0;
          font-size: 0.85rem;
          line-height: 1.6;
        }

        .empty {
          text-align: center;
          color: #999;
          padding: 2rem;
        }

        .topics-list {
          display: flex;
          flex-direction: column;
          gap: 0.5rem;
        }

        .topic-row {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 1rem;
          background: #f9f9f9;
          border-radius: 6px;
          border: 1px solid #ddd;
        }

        .topic-row h4 {
          margin: 0 0 0.5rem;
        }

        .topic-row small {
          color: #666;
        }

        .category {
          background: #e0e7ff;
          color: #4f46e5;
          padding: 0.25rem 0.75rem;
          border-radius: 20px;
          font-size: 0.85rem;
          font-weight: 500;
        }

        .badge-success {
          background: #d1fae5;
          color: #065f46;
          padding: 0.5rem 1rem;
          border-radius: 6px;
          font-weight: 500;
        }

        .hint {
          color: #999;
          font-size: 0.9rem;
          margin-top: 0.5rem;
        }
      `}</style>
    </div>
  );
}

export default AdminPanel;
