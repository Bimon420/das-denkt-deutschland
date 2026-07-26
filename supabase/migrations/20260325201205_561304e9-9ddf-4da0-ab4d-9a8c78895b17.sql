-- Reconfigure daily topic generation using fixed project URL + publishable key
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
    url := 'https://hcqgrzplztjhladwikmp.supabase.co/functions/v1/generate-topics',
    headers := jsonb_build_object(
      'Authorization', 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImhjcWdyenBsenRqaGxhZHdpa21wIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzQxODgyMTksImV4cCI6MjA4OTc2NDIxOX0.hGFzUuX89aK5VGVtB8CEkidDDsFBOOqwR9_bBAmy8BY',
      'apikey', 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImhjcWdyenBsenRqaGxhZHdpa21wIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzQxODgyMTksImV4cCI6MjA4OTc2NDIxOX0.hGFzUuX89aK5VGVtB8CEkidDDsFBOOqwR9_bBAmy8BY',
      'Content-Type', 'application/json'
    ),
    body := '{}'::jsonb,
    timeout_milliseconds := 180000
  );
  $$
);

SELECT net.http_post(
  url := 'https://hcqgrzplztjhladwikmp.supabase.co/functions/v1/generate-topics',
  headers := jsonb_build_object(
    'Authorization', 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImhjcWdyenBsenRqaGxhZHdpa21wIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzQxODgyMTksImV4cCI6MjA4OTc2NDIxOX0.hGFzUuX89aK5VGVtB8CEkidDDsFBOOqwR9_bBAmy8BY',
    'apikey', 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImhjcWdyenBsenRqaGxhZHdpa21wIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzQxODgyMTksImV4cCI6MjA4OTc2NDIxOX0.hGFzUuX89aK5VGVtB8CEkidDDsFBOOqwR9_bBAmy8BY',
    'Content-Type', 'application/json'
  ),
  body := '{}'::jsonb,
  timeout_milliseconds := 180000
);