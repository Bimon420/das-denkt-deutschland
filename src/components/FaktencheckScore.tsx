import { motion } from "framer-motion";
import { ShieldCheck } from "lucide-react";

interface Source {
  type: "article" | "video" | "quote" | "document";
  label: string;
  url: string;
}

interface FaktencheckScoreProps {
  leftSources: Source[];
  rightSources: Source[];
}

function computeScore(leftSources: Source[], rightSources: Source[]): { score: number; label: string; color: string } {
  const total = leftSources.length + rightSources.length;
  const allTypes = new Set([...leftSources, ...rightSources].map((s) => s.type));
  const bothSidesHaveSources = leftSources.length > 0 && rightSources.length > 0;

  let points = 0;

  // Source count (max 40)
  points += Math.min(total * 10, 40);

  // Type diversity (max 30)
  points += allTypes.size * 7.5;

  // Balance bonus (max 30)
  if (bothSidesHaveSources) {
    const balance = 1 - Math.abs(leftSources.length - rightSources.length) / Math.max(total, 1);
    points += balance * 30;
  }

  const score = Math.min(Math.round(points), 100);

  if (score >= 75) return { score, label: "Gut belegt", color: "text-emerald-600 dark:text-emerald-400" };
  if (score >= 50) return { score, label: "Teilweise belegt", color: "text-amber-600 dark:text-amber-400" };
  return { score, label: "Wenige Quellen", color: "text-muted-foreground" };
}

const FaktencheckScore = ({ leftSources, rightSources }: FaktencheckScoreProps) => {
  const { score, label, color } = computeScore(leftSources, rightSources);
  const total = leftSources.length + rightSources.length;

  return (
    <motion.div
      className="flex items-center justify-center gap-1.5 mt-3"
      initial={{ opacity: 0 }}
      whileInView={{ opacity: 1 }}
      viewport={{ once: true }}
      transition={{ delay: 0.6, duration: 0.4 }}
    >
      <ShieldCheck className={`w-3.5 h-3.5 ${color}`} />
      <span className={`text-[11px] font-semibold ${color}`}>
        {label}
      </span>
      <span className="text-[10px] text-muted-foreground/60">
        · {total} {total === 1 ? "Quelle" : "Quellen"} · {score}/100
      </span>
    </motion.div>
  );
};

export default FaktencheckScore;
