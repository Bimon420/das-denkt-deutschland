import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export function useTopicOfTheWeek() {
  return useQuery({
    queryKey: ["topic-of-the-week"],
    queryFn: async (): Promise<string | null> => {
      const weekAgo = new Date();
      weekAgo.setDate(weekAgo.getDate() - 7);
      const since = weekAgo.toISOString();

      const { data, error } = await supabase
        .from("topic_votes")
        .select("topic_id")
        .gte("created_at", since);

      if (error || !data || data.length === 0) return null;

      // Count votes per topic
      const counts: Record<string, number> = {};
      for (const row of data) {
        counts[row.topic_id] = (counts[row.topic_id] || 0) + 1;
      }

      // Find the topic with the most votes
      let maxId: string | null = null;
      let maxCount = 0;
      for (const [id, count] of Object.entries(counts)) {
        if (count > maxCount) {
          maxCount = count;
          maxId = id;
        }
      }

      // Only show badge if there are at least 3 votes
      return maxCount >= 3 ? maxId : null;
    },
    staleTime: 10 * 60 * 1000,
  });
}
