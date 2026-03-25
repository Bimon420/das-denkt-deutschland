CREATE TABLE public.topic_votes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  topic_id uuid NOT NULL REFERENCES public.topics(id) ON DELETE CASCADE,
  value integer NOT NULL CHECK (value >= 0 AND value <= 100),
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.topic_votes ENABLE ROW LEVEL SECURITY;

-- Anyone can insert a vote (anonymous)
CREATE POLICY "Anyone can vote" ON public.topic_votes
  FOR INSERT TO anon, authenticated
  WITH CHECK (true);

-- Anyone can read votes (to see results)
CREATE POLICY "Anyone can read votes" ON public.topic_votes
  FOR SELECT TO anon, authenticated
  USING (true);