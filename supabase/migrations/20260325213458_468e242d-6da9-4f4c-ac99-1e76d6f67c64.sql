DROP POLICY IF EXISTS "Anyone can vote" ON public.topic_votes;

-- Only allow service role (edge function) to insert votes
CREATE POLICY "Only service role can insert votes"
ON public.topic_votes
FOR INSERT
TO service_role
WITH CHECK (true);