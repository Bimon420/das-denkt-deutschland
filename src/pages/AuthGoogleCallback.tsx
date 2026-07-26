/**
 * Google OAuth Callback Page
 *
 * Receives token from /auth/google/callback endpoint
 * Saves to localStorage
 * Redirects to admin panel
 */

import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';

export function AuthGoogleCallback() {
  const navigate = useNavigate();
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const [message, setMessage] = useState('Processing authentication...');

  useEffect(() => {
    handleCallback();
  }, []);

  const handleCallback = async () => {
    try {
      const params = new URLSearchParams(window.location.search);
      const code = params.get('code');
      const state = params.get('state');
      const error = params.get('error');

      // Check for OAuth errors
      if (error) {
        const errorDescription = params.get('error_description') || 'Unknown error';
        setStatus('error');
        setMessage(`Authentication failed: ${errorDescription}`);
        setTimeout(() => navigate('/admin'), 3000);
        return;
      }

      if (!code) {
        setStatus('error');
        setMessage('No authorization code received');
        setTimeout(() => navigate('/admin'), 3000);
        return;
      }

      // Call backend to exchange code for token
      const callbackUrl = getCallbackUrl();
      const response = await fetch(callbackUrl, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        const error = await response.json();
        setStatus('error');
        setMessage(`Token exchange failed: ${error.error}`);
        setTimeout(() => navigate('/admin'), 3000);
        return;
      }

      const result = await response.json();

      if (!result.success) {
        setStatus('error');
        setMessage(`Error: ${result.error}`);
        setTimeout(() => navigate('/admin'), 3000);
        return;
      }

      // Save token to localStorage
      const accessToken = result.access_token;
      localStorage.setItem('google_drive_access_token', accessToken);

      // Prompt for folder ID
      const folderId = prompt('Enter your Google Drive Folder ID:');
      if (!folderId) {
        localStorage.removeItem('google_drive_access_token');
        setStatus('error');
        setMessage('Setup cancelled');
        setTimeout(() => navigate('/admin'), 2000);
        return;
      }

      // Save folder ID
      localStorage.setItem('canon_gdrive_folder', folderId);

      // Save config
      const config = {
        clientId: new URLSearchParams(window.location.search).get('client_id') || 'unknown',
        folderId,
        folderName: 'Canon Backups',
        connectedAt: new Date().toISOString(),
        isLinked: true,
      };
      localStorage.setItem('canon_gdrive_config', JSON.stringify(config));

      setStatus('success');
      setMessage('✅ Google Drive linked successfully!');
      setTimeout(() => navigate('/admin'), 2000);
    } catch (err) {
      console.error('Callback error:', err);
      setStatus('error');
      setMessage(err instanceof Error ? err.message : 'Authentication failed');
      setTimeout(() => navigate('/admin'), 3000);
    }
  };

  const getCallbackUrl = () => {
    // Try both Supabase and Vercel endpoints
    const baseUrl = window.location.origin;
    const params = window.location.search;

    // Use Vercel function if available
    if (baseUrl.includes('vercel.app')) {
      return `/api/auth/google/callback${params}`;
    }

    // Fall back to Supabase edge function
    return `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/auth-google-callback${params}`;
  };

  return (
    <div className="auth-callback-page">
      <div className="container">
        <div className={`status-box ${status}`}>
          {status === 'loading' && (
            <>
              <div className="spinner"></div>
              <h2>Processing Authentication</h2>
              <p>Exchanging authorization code for access token...</p>
            </>
          )}

          {status === 'success' && (
            <>
              <div className="icon">✅</div>
              <h2>Success!</h2>
              <p>{message}</p>
              <p className="subtitle">Redirecting to admin panel...</p>
            </>
          )}

          {status === 'error' && (
            <>
              <div className="icon">❌</div>
              <h2>Authentication Failed</h2>
              <p>{message}</p>
              <p className="subtitle">Redirecting back to admin...</p>
            </>
          )}
        </div>
      </div>

      <style>{`
        .auth-callback-page {
          display: flex;
          align-items: center;
          justify-content: center;
          min-height: 100vh;
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
        }

        .container {
          width: 100%;
          max-width: 500px;
          padding: 2rem;
        }

        .status-box {
          background: white;
          border-radius: 12px;
          padding: 3rem 2rem;
          text-align: center;
          box-shadow: 0 10px 40px rgba(0, 0, 0, 0.2);
        }

        .status-box.loading {
          background: linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%);
        }

        .status-box.success {
          background: linear-gradient(135deg, #f0fff4 0%, #d1fae5 100%);
        }

        .status-box.error {
          background: linear-gradient(135deg, #fff5f5 0%, #fed7d7 100%);
        }

        .spinner {
          width: 50px;
          height: 50px;
          margin: 0 auto 1.5rem;
          border: 4px solid #e2e8f0;
          border-top-color: #667eea;
          border-radius: 50%;
          animation: spin 1s linear infinite;
        }

        @keyframes spin {
          to {
            transform: rotate(360deg);
          }
        }

        .icon {
          font-size: 3rem;
          margin-bottom: 1rem;
        }

        h2 {
          font-size: 1.5rem;
          margin: 1rem 0 0.5rem;
          color: #1a202c;
        }

        p {
          color: #4a5568;
          margin: 0.5rem 0;
          line-height: 1.6;
        }

        .subtitle {
          font-size: 0.9rem;
          color: #718096;
          margin-top: 1rem;
        }
      `}</style>
    </div>
  );
}

export default AuthGoogleCallback;
