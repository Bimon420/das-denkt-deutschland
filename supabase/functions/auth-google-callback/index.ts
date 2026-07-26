/**
 * Supabase Edge Function: Google OAuth Callback
 *
 * Exchanges Google auth code for access token.
 * Called by: frontend after Google consent screen
 *
 * GET /auth-google-callback?code=...&state=...
 */

const GOOGLE_TOKEN_ENDPOINT = 'https://oauth2.googleapis.com/token';

interface GoogleTokenRequest {
  code: string;
  client_id: string;
  client_secret: string;
  redirect_uri: string;
  grant_type: string;
}

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

Deno.serve(async (req: Request) => {
  // Only allow GET
  if (req.method !== 'GET') {
    return new Response(
      JSON.stringify({ success: false, error: 'Method not allowed' }),
      { status: 405, headers: { 'Content-Type': 'application/json' } }
    );
  }

  try {
    // Parse query parameters
    const url = new URL(req.url);
    const code = url.searchParams.get('code');
    const state = url.searchParams.get('state');
    const error = url.searchParams.get('error');

    // Handle OAuth errors
    if (error) {
      const errorDescription = url.searchParams.get('error_description') || 'Unknown error';
      console.error('OAuth error:', error, errorDescription);
      return redirectWithError(error, errorDescription);
    }

    // Validate code
    if (!code) {
      console.error('Missing authorization code');
      return new Response(
        JSON.stringify({
          success: false,
          error: 'Missing authorization code',
        } as ErrorResponse),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Get environment variables
    const clientId = Deno.env.get('GOOGLE_CLIENT_ID');
    const clientSecret = Deno.env.get('GOOGLE_CLIENT_SECRET');
    const redirectUri = Deno.env.get('GOOGLE_REDIRECT_URI');

    if (!clientId || !clientSecret || !redirectUri) {
      console.error('Missing environment variables');
      return new Response(
        JSON.stringify({
          success: false,
          error: 'Server configuration error',
          details: 'Missing Google credentials',
        } as ErrorResponse),
        { status: 500, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Exchange code for token
    const tokenResponse = await exchangeCodeForToken(
      code,
      clientId,
      clientSecret,
      redirectUri
    );

    if (!tokenResponse.success) {
      return new Response(
        JSON.stringify(tokenResponse),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Return token to frontend (with CORS headers for local testing)
    const response: SuccessResponse = {
      success: true,
      access_token: tokenResponse.data.access_token,
      expires_in: tokenResponse.data.expires_in,
      token_type: tokenResponse.data.token_type,
    };

    return new Response(JSON.stringify(response), {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type',
      },
    });
  } catch (err) {
    console.error('Unexpected error:', err);
    return new Response(
      JSON.stringify({
        success: false,
        error: 'Internal server error',
        details: err instanceof Error ? err.message : 'Unknown error',
      } as ErrorResponse),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
});

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

/**
 * Redirect to frontend with error
 */
function redirectWithError(error: string, details: string): Response {
  const redirectUrl = new URL('http://localhost:5173/auth/error');
  redirectUrl.searchParams.set('error', error);
  redirectUrl.searchParams.set('details', details);

  return new Response(null, {
    status: 302,
    headers: {
      'Location': redirectUrl.toString(),
    },
  });
}
