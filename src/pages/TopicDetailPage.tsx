import { useParams, useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import TopicCard from "@/components/TopicCard";
import { ArrowLeft, Loader2 } from "lucide-react";
import { motion } from "framer-motion";
import type { Topic } from "@/hooks/useTopics";

function mapDbToTopic(row: any): Topic {
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
      sources: (row.left_sources as any[]) || [],
    },
    rightView: {
      position: row.right_position,
      quote: row.right_quote,
      speaker: row.right_speaker,
      hiddenMeaning: row.right_hidden_meaning ?? undefined,
      negativeEffects: row.right_negative_effects ?? undefined,
      sources: (row.right_sources as any[]) || [],
    },
    mitteView: row.mitte_view,
  };
}

const TopicDetailPage = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const { data: topic, isLoading } = useQuery({
    queryKey: ["topic", id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("topics")
        .select("*")
        .eq("id", id!)
        .single();
      if (error) throw error;
      return mapDbToTopic(data);
    },
    enabled: !!id,
  });

  return (
    <div className="min-h-[100dvh] bg-background">
      <header className="sticky top-0 z-30 flex items-center px-3 md:px-5 py-2.5 md:py-3 border-b border-border/40 bg-background/90 backdrop-blur-xl">
        <button
          onClick={() => window.history.length > 1 ? navigate(-1) : navigate("/app")}
          className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors active:scale-95"
        >
          <ArrowLeft className="w-4 h-4" />
          Zurück
        </button>
      </header>

      <section className="py-10 md:py-16 px-5 md:px-6">
        <div className="max-w-5xl mx-auto">
          {isLoading ? (
            <div className="flex justify-center py-20">
              <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
            </div>
          ) : topic ? (
            <TopicCard
              id={topic.id}
              topic={topic.topic}
              tagType={topic.tagType}
              category={topic.category}
              leftView={topic.leftView}
              rightView={topic.rightView}
              mitteView={topic.mitteView}
              index={0}
              hideIndex
            />
          ) : (
            <motion.p
              className="text-center text-muted-foreground py-20"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
            >
              Thema nicht gefunden.
            </motion.p>
          )}
        </div>
      </section>
    </div>
  );
};

export default TopicDetailPage;
