/**
 * Authentication Error Page
 * Shown when OAuth flow fails
 */

import { useNavigate } from 'react-router-dom';

export function AuthError() {
  const navigate = useNavigate();
  const params = new URLSearchParams(window.location.search);
  const error = params.get('error') || 'Unknown error';
  const details = params.get('details') || '';

  return (
    <div className="auth-error-page">
      <div className="container">
        <div className="error-box">
          <div className="icon">⚠️</div>
          <h1>Authentication Error</h1>
          <p className="error-type">{error}</p>
          {details && <p className="error-details">{details}</p>}

          <div className="actions">
            <button className="btn-primary" onClick={() => navigate('/admin')}>
              Back to Admin
            </button>
            <button className="btn-secondary" onClick={() => navigate('/')}>
              Home
            </button>
          </div>

          <p className="help-text">
            If you continue to have issues, check that:
            <br />
            • Your Google Client ID is correct
            <br />
            • The redirect URI matches your app URL
            <br />
            • You granted permissions to the app
          </p>
        </div>
      </div>

      <style>{`
        .auth-error-page {
          display: flex;
          align-items: center;
          justify-content: center;
          min-height: 100vh;
          background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%);
        }

        .container {
          width: 100%;
          max-width: 500px;
          padding: 2rem;
        }

        .error-box {
          background: white;
          border-radius: 12px;
          padding: 3rem 2rem;
          text-align: center;
          box-shadow: 0 10px 40px rgba(0, 0, 0, 0.2);
        }

        .icon {
          font-size: 3rem;
          margin-bottom: 1rem;
        }

        h1 {
          font-size: 1.8rem;
          color: #1a202c;
          margin: 1rem 0;
        }

        .error-type {
          font-size: 1.1rem;
          color: #e53e3e;
          font-weight: 600;
          margin: 0.5rem 0;
        }

        .error-details {
          color: #4a5568;
          font-size: 0.95rem;
          margin: 1rem 0;
          padding: 1rem;
          background: #f7fafc;
          border-radius: 6px;
          border-left: 4px solid #e53e3e;
          text-align: left;
        }

        .actions {
          display: flex;
          gap: 1rem;
          margin: 2rem 0;
          justify-content: center;
        }

        .btn-primary,
        .btn-secondary {
          padding: 0.75rem 1.5rem;
          border: none;
          border-radius: 6px;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.2s;
        }

        .btn-primary {
          background: #667eea;
          color: white;
        }

        .btn-primary:hover {
          background: #5a67d8;
          transform: translateY(-2px);
        }

        .btn-secondary {
          background: #e2e8f0;
          color: #2d3748;
        }

        .btn-secondary:hover {
          background: #cbd5e0;
        }

        .help-text {
          color: #718096;
          font-size: 0.85rem;
          text-align: left;
          margin-top: 1.5rem;
          padding: 1rem;
          background: #f7fafc;
          border-radius: 6px;
          line-height: 1.8;
        }
      `}</style>
    </div>
  );
}

export default AuthError;
