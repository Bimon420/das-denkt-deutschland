import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Loader2, Calendar } from "lucide-react";
import TransparencyTag from "@/components/TransparencyTag";
import { motion } from "framer-motion";

interface ArchiveTopic {
  id: string;
  topic: string;
  tag_type: string;
  published_at: string;
}

const ArchivePage = () => {
  const navigate = useNavigate();

  const { data: topics = [], isLoading } = useQuery({
    queryKey: ["archive-topics"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("topics")
        .select("id, topic, tag_type, published_at")
        .order("published_at", { ascending: false });
      if (error) throw error;
      const items = data as ArchiveTopic[];
      // Shuffle within each date group for objectivity
      const grouped: Record<string, ArchiveTopic[]> = {};
      items.forEach(t => {
        if (!grouped[t.published_at]) grouped[t.published_at] = [];
        grouped[t.published_at].push(t);
      });
      const result: ArchiveTopic[] = [];
      // Keep date order (newest first), shuffle within each day
      Object.keys(grouped).sort((a, b) => b.localeCompare(a)).forEach(date => {
        const group = grouped[date];
        for (let i = group.length - 1; i > 0; i--) {
          const j = Math.floor(Math.random() * (i + 1));
          [group[i], group[j]] = [group[j], group[i]];
        }
        result.push(...group);
      });
      return result;
    },
  });

  // Group by date
  const grouped = topics.reduce<Record<string, ArchiveTopic[]>>((acc, t) => {
    const key = t.published_at;
    if (!acc[key]) acc[key] = [];
    acc[key].push(t);
    return acc;
  }, {});

  const formatDate = (dateStr: string) => {
    const d = new Date(dateStr + "T00:00:00");
    return d.toLocaleDateString("de-DE", {
      weekday: "long",
      day: "numeric",
      month: "long",
      year: "numeric",
    });
  };

  return (
    <div className="min-h-[100dvh] bg-background px-5 py-8 max-w-2xl mx-auto">
      <button
        onClick={() => navigate("/app")}
        className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors mb-8 active:scale-95"
      >
        <ArrowLeft className="w-4 h-4" />
        Zurück
      </button>

      <h1 className="font-editorial text-3xl font-bold mb-2">Archiv</h1>
      <p className="text-sm text-muted-foreground mb-8">
        Alle bisherigen Themen chronologisch sortiert.
      </p>

      {isLoading ? (
        <div className="flex justify-center py-20">
          <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
        </div>
      ) : Object.keys(grouped).length === 0 ? (
        <p className="text-sm text-muted-foreground text-center py-20">
          Noch keine Themen vorhanden.
        </p>
      ) : (
        <div className="space-y-10">
          {Object.entries(grouped).map(([date, items], groupIdx) => (
            <motion.div
              key={date}
              initial={{ opacity: 0, y: 16, filter: "blur(4px)" }}
              animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
              transition={{
                delay: groupIdx * 0.08,
                duration: 0.5,
                ease: [0.16, 1, 0.3, 1],
              }}
            >
              <div className="flex items-center gap-2 mb-4">
                <Calendar className="w-3.5 h-3.5 text-muted-foreground" />
                <span className="text-xs font-bold tracking-widest uppercase text-muted-foreground">
                  {formatDate(date)}
                </span>
              </div>

              <div className="space-y-2">
                {items.map((t) => (
                  <button
                    key={t.id}
                    onClick={() => navigate(`/thema/${t.id}`)}
                    className="w-full flex items-center justify-between p-4 rounded-lg bg-card border border-border/50 hover:border-accent/40 hover:bg-card/80 transition-all cursor-pointer active:scale-[0.99] text-left"
                  >
                    <span className="font-body text-sm font-semibold text-foreground">
                      {t.topic}
                    </span>
                    <TransparencyTag
                      type={t.tag_type as "gleich" | "gegensaetzlich" | "teilweise"}
                    />
                  </button>
                ))}
              </div>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
};

export default ArchivePage;
