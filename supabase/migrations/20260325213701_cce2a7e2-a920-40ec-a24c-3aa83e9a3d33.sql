CREATE TABLE public.page_views (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  page text NOT NULL DEFAULT 'intro',
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.page_views ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read view count" ON public.page_views
FOR SELECT TO anon, authenticated USING (true);

CREATE POLICY "Anyone can log a view" ON public.page_views
FOR INSERT TO anon, authenticated WITH CHECK (true);