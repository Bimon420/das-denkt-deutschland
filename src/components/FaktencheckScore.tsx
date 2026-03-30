import { motion } from "framer-motion";
import { ShieldCheck, ShieldAlert, Link2, Link2Off } from "lucide-react";

interface Source {
  type: "article" | "video" | "quote" | "document";
  label: string;
  url: string;
}

interface FaktencheckScoreProps {
  leftSources: Source[];
  rightSources: Source[];
}

function analyzeSourceLinks(sources: Source[]): { verified: number; unverified: number } {
  let verified = 0;
  let unverified = 0;
  for (const s of sources) {
    if (s.url && s.url.trim() !== "" && /^https?:\/\/.+/.test(s.url.trim())) {
      verified++;
    } else {
      unverified++;
    }
  }
  return { verified, unverified };
}

const FaktencheckScore = ({ leftSources, rightSources }: FaktencheckScoreProps) => {
  const left = analyzeSourceLinks(leftSources);
  const right = analyzeSourceLinks(rightSources);
  const totalVerified = left.verified + right.verified;
  const totalUnverified = left.unverified + right.unverified;
  const total = totalVerified + totalUnverified;

  let label: string;
  let color: string;
  let Icon = ShieldCheck;

  if (total === 0) {
    label = "Keine Quellen";
    color = "text-muted-foreground";
    Icon = ShieldAlert;
  } else if (totalVerified === 0) {
    label = "Keine verifizierten Links";
    color = "text-muted-foreground";
    Icon = ShieldAlert;
  } else if (totalVerified >= 3 && left.verified > 0 && right.verified > 0) {
    label = "Quellen mit Links belegt";
    color = "text-emerald-600 dark:text-emerald-400";
  } else if (totalVerified >= 1) {
    label = "Teilweise verlinkt";
    color = "text-amber-600 dark:text-amber-400";
  } else {
    label = "Ohne Verlinkung";
    color = "text-muted-foreground";
    Icon = ShieldAlert;
  }

  return (
    <motion.div
      className="flex items-center justify-center gap-1.5 mt-3 flex-wrap"
      initial={{ opacity: 0 }}
      whileInView={{ opacity: 1 }}
      viewport={{ once: true }}
      transition={{ delay: 0.6, duration: 0.4 }}
    >
      <Icon className={`w-3.5 h-3.5 ${color}`} />
      <span className={`text-[11px] font-semibold ${color}`}>
        {label}
      </span>
      <span className="inline-flex items-center gap-1 text-[10px] text-muted-foreground/60">
        ·
        <Link2 className="w-2.5 h-2.5" />
        {totalVerified}
        {totalUnverified > 0 && (
          <>
            <Link2Off className="w-2.5 h-2.5 ml-1" />
            {totalUnverified}
          </>
        )}
      </span>
    </motion.div>
  );
};

export default FaktencheckScore;
