import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Loader2, Vote, TrendingUp, TrendingDown, Minus, CheckCircle2 } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useState, useEffect, useCallback, useMemo } from "react";

interface VoteTopic {
  id: string;
  topic: string;
  tag_type: string;
  category: string;
  published_at: string;
}

interface VoteData {
  topic_id: string;
  value: number;
}

// Deutsch-Vote-Score: weighted average mapped to a label
function getDeutschVoteScore(avg: number): { label: string; color: string; emoji: string } {
  if (avg <= 15) return { label: "Klar links", color: "text-foreground", emoji: "⬛" };
  if (avg <= 35) return { label: "Eher links", color: "text-foreground/70", emoji: "◀" };
  if (avg <= 65) return { label: "Mitte", color: "text-accent", emoji: "🟡" };
  if (avg <= 85) return { label: "Eher rechts", color: "text-destructive/70", emoji: "▶" };
  return { label: "Klar rechts", color: "text-destructive", emoji: "🔴" };
}

function getSliderLabel(v: number): string {
  if (v <= 15) return "Klar links";
  if (v <= 35) return "Eher links";
  if (v <= 65) return "Mitte";
  if (v <= 85) return "Eher rechts";
  return "Klar rechts";
}

const BuergervotingPage = () => {
  const navigate = useNavigate();
  const [sliderValues, setSliderValues] = useState<Record<string, number>>({});
  const [votedTopics, setVotedTopics] = useState<Set<string>>(new Set());
  const [submitting, setSubmitting] = useState<string | null>(null);
  const [voteData, setVoteData] = useState<VoteData[]>([]);
  const [filterCategory, setFilterCategory] = useState<"all" | "politik">("all");

  // Load all topics
  const { data: topics = [], isLoading } = useQuery({
    queryKey: ["buergervoting-topics"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("topics")
        .select("id, topic, tag_type, category, published_at")
        .order("published_at", { ascending: false });
      if (error) throw error;
      const filtered = (data as VoteTopic[]).filter(t => t.category === "politik");
      // Randomize for objectivity
      for (let i = filtered.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [filtered[i], filtered[j]] = [filtered[j], filtered[i]];
      }
      return filtered;
    },
  });

  // Load all vote data
  const { data: allVotes = [] } = useQuery({
    queryKey: ["buergervoting-votes"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("topic_votes")
        .select("topic_id, value");
      if (error) throw error;
      return data as VoteData[];
    },
  });

  useEffect(() => {
    setVoteData(allVotes);
  }, [allVotes]);

  // Load previously voted from localStorage
  useEffect(() => {
    const voted = new Set<string>();
    topics.forEach((t) => {
      if (localStorage.getItem(`vote-${t.id}`)) {
        voted.add(t.id);
      }
    });
    setVotedTopics(voted);
  }, [topics]);

  // Calculate vote stats per topic
  const voteStats = useMemo(() => {
    const stats: Record<string, { avg: number; count: number }> = {};
    const grouped: Record<string, number[]> = {};
    voteData.forEach((v) => {
      if (!grouped[v.topic_id]) grouped[v.topic_id] = [];
      grouped[v.topic_id].push(v.value);
    });
    Object.entries(grouped).forEach(([id, values]) => {
      const avg = values.reduce((a, b) => a + b, 0) / values.length;
      stats[id] = { avg: Math.round(avg), count: values.length };
    });
    return stats;
  }, [voteData]);

  // Overall Deutsch-Vote-Score
  const overallScore = useMemo(() => {
    if (voteData.length === 0) return null;
    const avg = voteData.reduce((a, b) => a + b.value, 0) / voteData.length;
    return { value: Math.round(avg), ...getDeutschVoteScore(avg) };
  }, [voteData]);

  const totalVoted = votedTopics.size;
  const totalTopics = topics.length;
  const progress = totalTopics > 0 ? (totalVoted / totalTopics) * 100 : 0;

  const handleVote = useCallback(async (topicId: string) => {
    if (votedTopics.has(topicId) || submitting) return;
    setSubmitting(topicId);

    const value = sliderValues[topicId] ?? 50;

    try {
      const res = await supabase.functions.invoke("submit-vote", {
        body: { topic_id: topicId, value },
      });
      if (res.error) throw res.error;

      localStorage.setItem(`vote-${topicId}`, String(value));
      setVotedTopics((prev) => new Set([...prev, topicId]));
      setVoteData((prev) => [...prev, { topic_id: topicId, value }]);
    } catch (e) {
      console.error("Vote failed:", e);
    }
    setSubmitting(null);
  }, [votedTopics, submitting, sliderValues]);

  return (
    <div className="min-h-[100dvh] bg-background">
      {/* Sticky Header */}
      <div className="sticky top-0 z-30 bg-background/95 backdrop-blur-sm border-b border-border">
        <div className="max-w-3xl mx-auto px-5 py-4">
          <div className="flex items-center justify-between">
            <button
              onClick={() => navigate("/app")}
              className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors active:scale-95"
            >
              <ArrowLeft className="w-4 h-4" />
              Zurück
            </button>
            <div className="flex items-center gap-3">
              <span className="text-xs text-muted-foreground">
                {totalVoted}/{totalTopics} abgestimmt
              </span>
              <div className="w-20 h-1.5 rounded-full bg-secondary overflow-hidden">
                <motion.div
                  className="h-full rounded-full bg-accent"
                  initial={{ width: 0 }}
                  animate={{ width: `${progress}%` }}
                  transition={{ duration: 0.5, ease: "easeOut" }}
                />
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-3xl mx-auto px-5 py-8">
        {/* Hero */}
        <motion.div
          className="text-center mb-10"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
        >
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-accent/10 border border-accent/20 mb-4">
            <Vote className="w-4 h-4 text-accent" />
            <span className="text-xs font-bold tracking-widest uppercase text-accent-foreground">
              Bürgervoting
            </span>
          </div>
          <h1 className="font-editorial text-3xl md:text-4xl font-bold mb-3">
            <span className="text-foreground">Deutsch</span>
            <span className="text-destructive">-Vote-</span>
            <span className="text-accent">Score</span>
          </h1>
          <p className="text-sm text-muted-foreground max-w-md mx-auto leading-relaxed">
            Stimme anonym zu jedem politischen Thema ab. Deine Stimme fließt in den
            Deutsch-Vote-Score ein — ein demokratisches Stimmungsbild für jedes Thema.
          </p>
        </motion.div>

        {/* Overall Score Card */}
        {overallScore && (
          <motion.div
            className="mb-8 p-5 rounded-xl bg-card border border-border text-center"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.2, duration: 0.5 }}
          >
            <p className="text-[10px] font-bold tracking-widest uppercase text-muted-foreground mb-2">
              Gesamter Deutsch-Vote-Score
            </p>
            <div className="flex items-center justify-center gap-3">
              <span className="text-4xl font-editorial font-bold">{overallScore.value}</span>
              <div className="text-left">
                <p className={`text-sm font-semibold ${overallScore.color}`}>
                  {overallScore.emoji} {overallScore.label}
                </p>
                <p className="text-[10px] text-muted-foreground">
                  aus {voteData.length} Stimmen zu {totalTopics} Themen
                </p>
              </div>
            </div>
            {/* Score bar */}
            <div className="mt-3 h-2 rounded-full bg-secondary overflow-hidden relative">
              <div className="absolute inset-0 flex">
                <div className="flex-1 bg-foreground/20" />
                <div className="flex-1 bg-foreground/10" />
                <div className="flex-1 bg-accent/30" />
                <div className="flex-1 bg-destructive/10" />
                <div className="flex-1 bg-destructive/20" />
              </div>
              <motion.div
                className="absolute top-0 w-1 h-full bg-foreground rounded-full shadow-md"
                initial={{ left: "50%" }}
                animate={{ left: `${overallScore.value}%` }}
                transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
              />
            </div>
            <div className="flex justify-between mt-1 text-[8px] text-muted-foreground">
              <span>Links</span>
              <span>Mitte</span>
              <span>Rechts</span>
            </div>
          </motion.div>
        )}

        {/* Topics List */}
        {isLoading ? (
          <div className="flex justify-center py-20">
            <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
          </div>
        ) : topics.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-20">
            Noch keine Themen vorhanden.
          </p>
        ) : (
          <div className="space-y-3">
            {topics.map((topic, idx) => {
              const hasVoted = votedTopics.has(topic.id);
              const stats = voteStats[topic.id];
              const currentValue = sliderValues[topic.id] ?? 50;
              const isSubmitting = submitting === topic.id;
              const score = stats ? getDeutschVoteScore(stats.avg) : null;

              return (
                <motion.div
                  key={topic.id}
                  className={`p-4 rounded-xl border transition-all ${
                    hasVoted
                      ? "bg-card/50 border-border/30"
                      : "bg-card border-border hover:border-accent/30"
                  }`}
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{
                    delay: Math.min(idx * 0.03, 0.5),
                    duration: 0.4,
                    ease: [0.16, 1, 0.3, 1],
                  }}
                >
                  {/* Topic header */}
                  <div className="flex items-start justify-between gap-3 mb-3">
                    <div className="flex-1 min-w-0">
                      <button
                        onClick={() => navigate(`/thema/${topic.id}`)}
                        className="text-sm font-semibold text-foreground hover:text-accent transition-colors text-left leading-snug"
                      >
                        {topic.topic}
                      </button>
                    </div>
                    {hasVoted && (
                      <CheckCircle2 className="w-4 h-4 text-accent shrink-0 mt-0.5" />
                    )}
                  </div>

                  <AnimatePresence mode="wait">
                    {!hasVoted ? (
                      <motion.div
                        key="vote"
                        initial={{ opacity: 1 }}
                        exit={{ opacity: 0, height: 0 }}
                        transition={{ duration: 0.2 }}
                      >
                        {/* Labels */}
                        <div className="flex justify-between text-[9px] font-semibold uppercase tracking-wider text-muted-foreground mb-1.5 px-0.5">
                          <span>← Links</span>
                          <span className="text-center truncate px-1">{getSliderLabel(currentValue)}</span>
                          <span>Rechts →</span>
                        </div>

                        {/* Slider */}
                        <input
                          type="range"
                          min={0}
                          max={100}
                          value={currentValue}
                          onChange={(e) =>
                            setSliderValues((prev) => ({
                              ...prev,
                              [topic.id]: Number(e.target.value),
                            }))
                          }
                          className="w-full h-2 rounded-full appearance-none cursor-pointer slider-gradient [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-5 [&::-webkit-slider-thumb]:h-5 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-foreground [&::-webkit-slider-thumb]:shadow-md [&::-webkit-slider-thumb]:border-2 [&::-webkit-slider-thumb]:border-background [&::-webkit-slider-thumb]:cursor-grab [&::-webkit-slider-thumb]:active:cursor-grabbing [&::-moz-range-thumb]:w-5 [&::-moz-range-thumb]:h-5 [&::-moz-range-thumb]:rounded-full [&::-moz-range-thumb]:bg-foreground [&::-moz-range-thumb]:shadow-md [&::-moz-range-thumb]:border-2 [&::-moz-range-thumb]:border-background [&::-moz-range-thumb]:cursor-grab"
                        />

                        {/* Vote button */}
                        <div className="flex justify-end mt-2">
                          <button
                            onClick={() => handleVote(topic.id)}
                            disabled={isSubmitting}
                            className="px-4 py-1.5 rounded-full text-[11px] font-semibold bg-foreground text-background hover:opacity-90 transition-all active:scale-95 disabled:opacity-50 min-h-[32px]"
                          >
                            {isSubmitting ? "…" : "Abstimmen"}
                          </button>
                        </div>
                      </motion.div>
                    ) : (
                      <motion.div
                        key="result"
                        initial={{ opacity: 0, y: 6 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.3 }}
                        className="flex items-center justify-between"
                      >
                        {stats ? (
                          <>
                            <div className="flex items-center gap-2">
                              <div className="w-24 h-1.5 rounded-full bg-secondary overflow-hidden relative">
                                <div className="absolute inset-0 flex">
                                  <div className="flex-1 bg-foreground/15" />
                                  <div className="flex-1 bg-accent/20" />
                                  <div className="flex-1 bg-destructive/15" />
                                </div>
                                <motion.div
                                  className="absolute top-0 w-1 h-full bg-foreground rounded-full"
                                  initial={{ left: "50%" }}
                                  animate={{ left: `${stats.avg}%` }}
                                  transition={{ duration: 0.6 }}
                                />
                              </div>
                              <span className={`text-xs font-semibold ${score?.color}`}>
                                {score?.emoji} {score?.label}
                              </span>
                            </div>
                            <span className="text-[10px] text-muted-foreground">
                              {stats.count} {stats.count === 1 ? "Stimme" : "Stimmen"}
                            </span>
                          </>
                        ) : (
                          <span className="text-[10px] text-muted-foreground">
                            Deine Stimme wurde gezählt ✓
                          </span>
                        )}
                      </motion.div>
                    )}
                  </AnimatePresence>
                </motion.div>
              );
            })}
          </div>
        )}

        {/* Bottom CTA */}
        {totalVoted > 0 && totalVoted === totalTopics && (
          <motion.div
            className="mt-10 text-center p-6 rounded-xl bg-accent/10 border border-accent/20"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3, duration: 0.5 }}
          >
            <p className="text-lg font-editorial font-bold mb-1">
              🎉 Du hast zu allen Themen abgestimmt!
            </p>
            <p className="text-sm text-muted-foreground">
              Danke für deinen Beitrag zum demokratischen Stimmungsbild Deutschlands.
            </p>
          </motion.div>
        )}
      </div>
    </div>
  );
};

export default BuergervotingPage;
