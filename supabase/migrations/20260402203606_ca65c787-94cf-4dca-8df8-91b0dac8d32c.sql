
CREATE TABLE public.generation_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at timestamptz NOT NULL DEFAULT now(),
  success boolean NOT NULL,
  topics_count integer NOT NULL DEFAULT 0,
  rejected_count integer NOT NULL DEFAULT 0,
  error_message text,
  details jsonb DEFAULT '{}'::jsonb
);

ALTER TABLE public.generation_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read generation logs"
  ON public.generation_logs FOR SELECT
  TO anon, authenticated
  USING (true);

CREATE POLICY "Only service role can insert logs"
  ON public.generation_logs FOR INSERT
  TO service_role
  WITH CHECK (true);
