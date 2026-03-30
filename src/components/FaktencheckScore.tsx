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

function isValidUrl(url: string | undefined | null): boolean {
  if (!url || typeof url !== "string") return false;
  const trimmed = url.trim();
  return /^https?:\/\/.{3,}/.test(trimmed);
}

const FaktencheckScore = ({ leftSources, rightSources }: FaktencheckScoreProps) => {
  const allSources = [...leftSources, ...rightSources];
  const linked = allSources.filter((s) => isValidUrl(s.url)).length;
  const unlinked = allSources.length - linked;

  let label: string;
  let color: string;
  let Icon = ShieldCheck;

  if (allSources.length === 0) {
    label = "Keine Quellen";
    color = "text-muted-foreground";
    Icon = ShieldAlert;
  } else if (linked === 0) {
    label = "Keine verlinkten Quellen";
    color = "text-muted-foreground";
    Icon = ShieldAlert;
  } else if (linked === allSources.length) {
    label = "Alle Quellen verlinkt";
    color = "text-emerald-600 dark:text-emerald-400";
  } else {
    label = `${linked} von ${allSources.length} verlinkt`;
    color = linked >= allSources.length / 2
      ? "text-amber-600 dark:text-amber-400"
      : "text-muted-foreground";
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
        {linked}
        {unlinked > 0 && (
          <>
            <Link2Off className="w-2.5 h-2.5 ml-1" />
            {unlinked}
          </>
        )}
      </span>
    </motion.div>
  );
};

export default FaktencheckScore;
