-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS pg_cron WITH SCHEMA pg_catalog;
CREATE EXTENSION IF NOT EXISTS pg_net WITH SCHEMA extensions;

-- Create a cron job that triggers the generate-topics edge function daily at 6:00 AM UTC
SELECT cron.schedule(
  'generate-daily-topics',
  '0 6 * * *',
  $$
  SELECT extensions.http(
    (
      'POST',
      (SELECT decrypted_secret FROM vault.decrypted_secrets WHERE name = 'SUPABASE_URL' LIMIT 1) || '/functions/v1/generate-topics',
      ARRAY[
        extensions.http_header('Authorization', 'Bearer ' || (SELECT decrypted_secret FROM vault.decrypted_secrets WHERE name = 'SUPABASE_ANON_KEY' LIMIT 1)),
        extensions.http_header('Content-Type', 'application/json')
      ],
      'application/json',
      '{}'
    )::extensions.http_request
  );
  $$
);
