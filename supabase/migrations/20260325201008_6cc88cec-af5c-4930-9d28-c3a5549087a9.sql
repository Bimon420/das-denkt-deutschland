-- Fix daily topic generation cron job to use pg_net API (extensions.http_request was removed)
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM cron.job WHERE jobname = 'generate-daily-topics') THEN
    PERFORM cron.unschedule('generate-daily-topics');
  END IF;
END
$$;

SELECT cron.schedule(
  'generate-daily-topics',
  '0 6 * * *',
  $$
  SELECT net.http_post(
    url := (SELECT decrypted_secret FROM vault.decrypted_secrets WHERE name = 'SUPABASE_URL' LIMIT 1) || '/functions/v1/generate-topics',
    headers := jsonb_build_object(
      'Authorization', 'Bearer ' || (SELECT decrypted_secret FROM vault.decrypted_secrets WHERE name = 'SUPABASE_ANON_KEY' LIMIT 1),
      'Content-Type', 'application/json'
    ),
    body := '{}'::jsonb
  );
  $$
);