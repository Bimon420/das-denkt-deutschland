/**
 * Vercel Function: Google OAuth Callback
 *
 * Exchanges Google auth code for access token.
 * Called by: frontend after Google consent screen
 *
 * GET /api/auth/google/callback?code=...&state=...
 */

import { VercelRequest, VercelResponse } from '@vercel/node';

const GOOGLE_TOKEN_ENDPOINT = 'https://oauth2.googleapis.com/token';

interface GoogleTokenResponse {
  access_token: string;
  expires_in: number;
  refresh_token?: string;
  scope: string;
  token_type: string;
}

interface SuccessResponse {
  success: true;
  access_token: string;
  expires_in: number;
  token_type: string;
}

interface ErrorResponse {
  success: false;
  error: string;
  details?: string;
}

export default async function handler(
  req: VercelRequest,
  res: VercelResponse
) {
  // Only allow GET
  if (req.method !== 'GET') {
    return res.status(405).json({ success: false, error: 'Method not allowed' });
  }

  try {
    // Extract query parameters
    const { code, state, error: oauthError, error_description } = req.query;

    // Handle OAuth errors
    if (oauthError) {
      const errorMsg = error_description || 'Unknown error';
      console.error('OAuth error:', oauthError, errorMsg);

      return res.redirect(
        302,
        `/auth/error?error=${oauthError}&details=${encodeURIComponent(errorMsg as string)}`
      );
    }

    // Validate code
    if (!code || typeof code !== 'string') {
      console.error('Missing authorization code');
      return res.status(400).json({
        success: false,
        error: 'Missing authorization code',
      } as ErrorResponse);
    }

    // Get environment variables
    const clientId = process.env.GOOGLE_CLIENT_ID;
    const clientSecret = process.env.GOOGLE_CLIENT_SECRET;
    const redirectUri = process.env.GOOGLE_REDIRECT_URI;

    if (!clientId || !clientSecret || !redirectUri) {
      console.error('Missing environment variables');
      return res.status(500).json({
        success: false,
        error: 'Server configuration error',
        details: 'Missing Google credentials',
      } as ErrorResponse);
    }

    // Exchange code for token
    const tokenResult = await exchangeCodeForToken(
      code,
      clientId,
      clientSecret,
      redirectUri
    );

    if (!tokenResult.success) {
      return res.status(400).json(tokenResult);
    }

    // Return token to frontend
    const response: SuccessResponse = {
      success: true,
      access_token: tokenResult.data.access_token,
      expires_in: tokenResult.data.expires_in,
      token_type: tokenResult.data.token_type,
    };

    // Set CORS headers
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    return res.status(200).json(response);
  } catch (err) {
    console.error('Unexpected error:', err);
    return res.status(500).json({
      success: false,
      error: 'Internal server error',
      details: err instanceof Error ? err.message : 'Unknown error',
    } as ErrorResponse);
  }
}

/**
 * Exchange authorization code for access token
 */
async function exchangeCodeForToken(
  code: string,
  clientId: string,
  clientSecret: string,
  redirectUri: string
): Promise<
  | { success: true; data: GoogleTokenResponse }
  | { success: false; error: string; details: string }
> {
  try {
    const body = new URLSearchParams({
      code,
      client_id: clientId,
      client_secret: clientSecret,
      redirect_uri: redirectUri,
      grant_type: 'authorization_code',
    });

    const response = await fetch(GOOGLE_TOKEN_ENDPOINT, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: body.toString(),
    });

    const data = await response.json();

    if (!response.ok) {
      const errorMsg = data.error_description || data.error || 'Token exchange failed';
      console.error('Google token error:', errorMsg);
      return {
        success: false,
        error: 'Failed to exchange code for token',
        details: errorMsg,
      };
    }

    return {
      success: true,
      data: data as GoogleTokenResponse,
    };
  } catch (err) {
    const errorMsg = err instanceof Error ? err.message : 'Unknown error';
    console.error('Token exchange error:', errorMsg);
    return {
      success: false,
      error: 'Token exchange failed',
      details: errorMsg,
    };
  }
}
