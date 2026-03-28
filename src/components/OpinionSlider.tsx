import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { supabase } from "@/integrations/supabase/client";

interface OpinionSliderProps {
  topicId: string;
}

const OpinionSlider = ({ topicId }: OpinionSliderProps) => {
  const [value, setValue] = useState(50);
  const [hasVoted, setHasVoted] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [distribution, setDistribution] = useState<number[]>([]);
  const [totalVotes, setTotalVotes] = useState(0);

  // Check localStorage for previous vote
  useEffect(() => {
    const voted = localStorage.getItem(`vote-${topicId}`);
    if (voted) {
      setHasVoted(true);
      loadResults();
    }
  }, [topicId]);

  const loadResults = useCallback(async () => {
    const { data } = await supabase
      .from("topic_votes")
      .select("value")
      .eq("topic_id", topicId);

    if (data && data.length > 0) {
      setTotalVotes(data.length);
      // Build distribution in 5 buckets: 0-20, 20-40, 40-60, 60-80, 80-100
      const buckets = [0, 0, 0, 0, 0];
      data.forEach((v) => {
        const idx = Math.min(Math.floor(v.value / 20), 4);
        buckets[idx]++;
      });
      const max = Math.max(...buckets, 1);
      setDistribution(buckets.map((b) => b / max));
    }
  }, [topicId]);

  const handleSubmit = async () => {
    if (hasVoted || submitting) return;
    setSubmitting(true);

    try {
      const res = await supabase.functions.invoke("submit-vote", {
        body: { topic_id: topicId, value },
      });

      if (res.error) throw res.error;

      localStorage.setItem(`vote-${topicId}`, String(value));
      setHasVoted(true);
      await loadResults();
    } catch (e) {
      console.error("Vote failed:", e);
    }
    setSubmitting(false);
  };

  const getLabel = (v: number) => {
    if (v <= 15) return "Klar links";
    if (v <= 35) return "Eher links";
    if (v <= 65) return "Irgendwo dazwischen";
    if (v <= 85) return "Eher rechts";
    return "Klar rechts";
  };

  const bucketLabels = ["Links", "", "Mitte", "", "Rechts"];

  return (
    <motion.div
      className="mt-5 mx-auto max-w-2xl p-4 md:p-5 rounded-xl bg-secondary/30 border border-border"
      initial={{ opacity: 0, y: 10 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.3 }}
      transition={{ delay: 0.5, duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
    >
      <div className="text-[11px] md:text-xs font-medium tracking-wide uppercase text-muted-foreground mb-3 text-center">
        🗳 Wo stehst du?
      </div>

      <AnimatePresence mode="wait">
        {!hasVoted ? (
          <motion.div
            key="slider"
            initial={{ opacity: 1 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.3 }}
          >
            {/* Labels */}
            <div className="flex justify-between text-[9px] md:text-[10px] font-semibold uppercase tracking-wider text-muted-foreground mb-2 px-0.5">
              <span className="text-left-blue">← Links</span>
              <span className="text-center px-1 truncate">{getLabel(value)}</span>
              <span className="text-right-red">Rechts →</span>
            </div>

            {/* Slider — larger touch target on mobile */}
            <input
              type="range"
              min={0}
              max={100}
              value={value}
              onChange={(e) => setValue(Number(e.target.value))}
              className="w-full h-2.5 md:h-2 rounded-full appearance-none cursor-pointer slider-gradient [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-7 [&::-webkit-slider-thumb]:h-7 md:[&::-webkit-slider-thumb]:w-5 md:[&::-webkit-slider-thumb]:h-5 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-foreground [&::-webkit-slider-thumb]:shadow-md [&::-webkit-slider-thumb]:border-2 [&::-webkit-slider-thumb]:border-background [&::-webkit-slider-thumb]:cursor-grab [&::-webkit-slider-thumb]:active:cursor-grabbing [&::-moz-range-thumb]:w-7 [&::-moz-range-thumb]:h-7 md:[&::-moz-range-thumb]:w-5 md:[&::-moz-range-thumb]:h-5 [&::-moz-range-thumb]:rounded-full [&::-moz-range-thumb]:bg-foreground [&::-moz-range-thumb]:shadow-md [&::-moz-range-thumb]:border-2 [&::-moz-range-thumb]:border-background [&::-moz-range-thumb]:cursor-grab"
            />

            {/* Submit */}
            <div className="flex justify-center mt-4">
              <button
                onClick={handleSubmit}
                disabled={submitting}
                className="px-8 py-3 md:px-5 md:py-2 rounded-full text-sm md:text-xs font-semibold bg-foreground text-background hover:opacity-90 transition-all active:scale-95 disabled:opacity-50 touch-manipulation min-h-[44px]"
              >
                {submitting ? "…" : "Abstimmen"}
              </button>
            </div>
          </motion.div>
        ) : (
          <motion.div
            key="results"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
          >
            {/* Distribution bars */}
            <div className="flex items-end justify-center gap-2 md:gap-1.5 h-20 md:h-16 mb-2 px-1">
              {distribution.map((d, i) => (
                <motion.div
                  key={i}
                  className="flex-1 rounded-t-sm min-w-0"
                  style={{
                    background:
                      i === 0
                        ? "hsl(var(--left))"
                        : i === 1
                        ? "hsl(var(--left) / 0.5)"
                        : i === 2
                        ? "hsl(var(--muted-foreground) / 0.4)"
                        : i === 3
                        ? "hsl(var(--right-red) / 0.5)"
                        : "hsl(var(--right-red))",
                  }}
                  initial={{ height: 0 }}
                  animate={{ height: `${Math.max(d * 100, 8)}%` }}
                  transition={{ delay: i * 0.08, duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
                />
              ))}
            </div>

            {/* Bucket labels */}
            <div className="flex justify-between text-[8px] md:text-[9px] text-muted-foreground px-1">
              {bucketLabels.map((l, i) => (
                <span key={i} className="flex-1 text-center">{l}</span>
              ))}
            </div>

            <p className="text-center text-[11px] text-muted-foreground mt-3">
              {totalVotes} {totalVotes === 1 ? "Stimme" : "Stimmen"} · Danke für deine Meinung!
            </p>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};

export default OpinionSlider;