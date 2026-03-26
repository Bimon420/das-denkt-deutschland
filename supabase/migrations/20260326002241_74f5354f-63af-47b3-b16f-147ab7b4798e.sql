CREATE TABLE public.topic_suggestions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  url text NOT NULL DEFAULT '',
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.topic_suggestions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can suggest a topic"
  ON public.topic_suggestions
  FOR INSERT
  TO anon, authenticated
  WITH CHECK (true);

CREATE POLICY "Anyone can read suggestions"
  ON public.topic_suggestions
  FOR SELECT
  TO anon, authenticated
  USING (true);