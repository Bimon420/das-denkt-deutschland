import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { ladeAlleZeilen } from "@/lib/alleZeilen";

export function useTopicOfTheWeek() {
  return useQuery({
    queryKey: ["topic-of-the-week"],
    queryFn: async (): Promise<string | null> => {
      const weekAgo = new Date();
      weekAgo.setDate(weekAgo.getDate() - 7);
      const since = weekAgo.toISOString();

      // Hier wird das Thema der Woche BESTIMMT — aus allen Stimmen der letzten sieben
      // Tage. Ohne Limit liefert PostgREST still hoechstens 1000, und in einer aktiven
      // Woche waere damit schlicht das falsche Thema gekroent worden, ohne dass
      // irgendetwas kaputt aussieht.
      const { zeilen: data, vollstaendig } = await ladeAlleZeilen<{ topic_id: string }>(
        (von, bis) => supabase
          .from("topic_votes")
          .select("topic_id")
          .gte("created_at", since)
          .range(von, bis),
      );
      if (!vollstaendig) {
        console.warn("[TopicOfTheWeek] Stimmen unvollstaendig — das Wochenthema kann falsch sein.");
      }

      if (!data || data.length === 0) return null;

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
