-- Topics table for AI-generated news content
CREATE TABLE public.topics (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  topic TEXT NOT NULL,
  tag_type TEXT NOT NULL CHECK (tag_type IN ('gleich', 'gegensaetzlich', 'teilweise')),
  
  left_position TEXT NOT NULL,
  left_quote TEXT NOT NULL,
  left_speaker TEXT NOT NULL,
  left_hidden_meaning TEXT,
  left_negative_effects TEXT,
  left_sources JSONB NOT NULL DEFAULT '[]',
  
  right_position TEXT NOT NULL,
  right_quote TEXT NOT NULL,
  right_speaker TEXT NOT NULL,
  right_hidden_meaning TEXT,
  right_negative_effects TEXT,
  right_sources JSONB NOT NULL DEFAULT '[]',
  
  mitte_view TEXT NOT NULL,
  
  published_at DATE NOT NULL DEFAULT CURRENT_DATE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.topics ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Topics are publicly readable"
  ON public.topics FOR SELECT
  TO anon, authenticated
  USING (true);

CREATE INDEX idx_topics_published_at ON public.topics (published_at DESC);