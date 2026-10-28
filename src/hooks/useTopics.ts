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
  bereich?: string | null;
  leftView: ViewpointData;
  rightView: ViewpointData;
  mitteView: string;
  publishedAt?: string;
}

// Simon 28.10.: „wenn ich auf diese Seite gehe müssen da mehr Themen sein" — am 27.10. gab es
// nur ein Thema des Tages; nach dieser einen Stimme war das Feld leer. Darunter wird aufgefüllt.
const MINDESTENS = 10;

export function mapDbToTopic(row: any): Topic {
  return {
    id: row.id,
    topic: row.topic,
    tagType: row.tag_type as Topic["tagType"],
    category: (row.category as Topic["category"]) || "politik",
    bereich: row.bereich ?? null,
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
    publishedAt: row.published_at ?? undefined,
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

      // Try today first
      const { data, error } = await supabase
        .from("topics")
        .select("*")
        .eq("published_at", today)
        .order("created_at", { ascending: false });

      if (error) {
        console.error("Error fetching topics:", error);
        throw error;
      }

      const heute = data ?? [];
      if (heute.length >= MINDESTENS) return heute.map(mapDbToTopic);

      const { data: latest, error: latestError } = await supabase
        .from("topics")
        .select("*")
        .lt("published_at", today)
        .order("published_at", { ascending: false })
        .order("created_at", { ascending: false })
        .limit(MINDESTENS - heute.length);

      if (latestError) {
        console.error("Error fetching latest topics:", latestError);
        if (heute.length > 0) return heute.map(mapDbToTopic);
        throw latestError;
      }

      const alle = [...heute, ...(latest ?? [])];
      if (alle.length === 0) return staticTopics;
      return alle.map(mapDbToTopic);
    },
    staleTime: 5 * 60 * 1000, // 5 min
  });
}
