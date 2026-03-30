import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { topics as staticTopics } from "@/data/topics";

export interface TopicSource {
  type: "article" | "video" | "quote" | "document";
  label: string;
  url: string;
}

export interface ViewpointData {
  position: string;
  quote: string;
  speaker: string;
  hiddenMeaning?: string;
  negativeEffects?: string;
  sources: TopicSource[];
}

export interface Topic {
  id?: string;
  topic: string;
  tagType: "gleich" | "gegensaetzlich" | "teilweise";
  category: "politik" | "boulevard";
  leftView: ViewpointData;
  rightView: ViewpointData;
  mitteView: string;
}

export function mapDbToTopic(row: any): Topic {
  return {
    id: row.id,
    topic: row.topic,
    tagType: row.tag_type as Topic["tagType"],
    category: (row.category as Topic["category"]) || "politik",
    leftView: {
      position: row.left_position,
      quote: row.left_quote,
      speaker: row.left_speaker,
      hiddenMeaning: row.left_hidden_meaning ?? undefined,
      negativeEffects: row.left_negative_effects ?? undefined,
      sources: (row.left_sources as TopicSource[]) || [],
    },
    rightView: {
      position: row.right_position,
      quote: row.right_quote,
      speaker: row.right_speaker,
      hiddenMeaning: row.right_hidden_meaning ?? undefined,
      negativeEffects: row.right_negative_effects ?? undefined,
      sources: (row.right_sources as TopicSource[]) || [],
    },
    mitteView: row.mitte_view,
  };
}

// Fisher-Yates shuffle
function shuffleArray<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

export function useTopics() {
  return useQuery({
    queryKey: ["topics"],
    queryFn: async (): Promise<Topic[]> => {
      const today = new Date().toISOString().split("T")[0];

      const { data, error } = await supabase
        .from("topics")
        .select("*")
        .eq("published_at", today)
        .order("created_at", { ascending: false })
        .limit(10);

      if (error) {
        console.error("Error fetching topics:", error);
        throw error;
      }

      if (!data || data.length === 0) {
        return shuffleArray(staticTopics);
      }

      return shuffleArray(data.map(mapDbToTopic));
    },
    staleTime: 5 * 60 * 1000, // 5 min
  });
}
