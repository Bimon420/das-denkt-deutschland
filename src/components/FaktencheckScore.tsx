import { motion } from "framer-motion";
import { ShieldCheck, ShieldAlert, Link2, Link2Off, Loader2 } from "lucide-react";
import { useEffect, useState } from "react";

interface Source {
  type: "article" | "video" | "quote" | "document";
  label: string;
  url: string;
}

interface FaktencheckScoreProps {
  leftSources: Source[];
  rightSources: Source[];
}

// Cache to avoid re-checking the same URL
const urlCache = new Map<string, boolean>();

async function checkUrl(url: string): Promise<boolean> {
  if (urlCache.has(url)) return urlCache.get(url)!;
  try {
    const res = await fetch(url, { method: "HEAD", mode: "no-cors", signal: AbortSignal.timeout(5000) });
    // no-cors returns opaque response (status 0) — if fetch didn't throw, the server responded
    const reachable = res.type === "opaque" || res.ok;
    urlCache.set(url, reachable);
    return reachable;
  } catch {
    urlCache.set(url, false);
    return false;
  }
}

function getValidUrls(sources: Source[]): string[] {
  return sources
    .map((s) => s.url?.trim())
    .filter((u): u is string => !!u && /^https?:\/\/.+/.test(u));
}

const FaktencheckScore = ({ leftSources, rightSources }: FaktencheckScoreProps) => {
  const allSources = [...leftSources, ...rightSources];
  const validUrls = getValidUrls(allSources);
  const withoutLink = allSources.length - validUrls.length;

  const [loading, setLoading] = useState(validUrls.length > 0);
  const [reachable, setReachable] = useState(0);
  const [unreachable, setUnreachable] = useState(0);

  useEffect(() => {
    if (validUrls.length === 0) {
      setLoading(false);
      return;
    }

    let cancelled = false;
    Promise.all(validUrls.map(checkUrl)).then((results) => {
      if (cancelled) return;
      setReachable(results.filter(Boolean).length);
      setUnreachable(results.filter((r) => !r).length);
      setLoading(false);
    });

    return () => { cancelled = true; };
  }, [validUrls.join(",")]);

  if (loading) {
    return (
      <motion.div
        className="flex items-center justify-center gap-1.5 mt-3"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.3 }}
      >
        <Loader2 className="w-3.5 h-3.5 text-muted-foreground animate-spin" />
        <span className="text-[11px] text-muted-foreground">Quellen werden geprüft…</span>
      </motion.div>
    );
  }

  const totalBroken = unreachable + withoutLink;

  let label: string;
  let color: string;
  let Icon = ShieldCheck;

  if (allSources.length === 0) {
    label = "Keine Quellen";
    color = "text-muted-foreground";
    Icon = ShieldAlert;
  } else if (reachable === 0) {
    label = "Keine erreichbaren Quellen";
    color = "text-muted-foreground";
    Icon = ShieldAlert;
  } else if (reachable >= 3 && totalBroken === 0) {
    label = "Alle Quellen erreichbar";
    color = "text-emerald-600 dark:text-emerald-400";
  } else if (reachable >= 1) {
    label = `${reachable} von ${allSources.length} erreichbar`;
    color = reachable >= allSources.length / 2
      ? "text-amber-600 dark:text-amber-400"
      : "text-muted-foreground";
  } else {
    label = "Quellen nicht prüfbar";
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
        {reachable}
        {totalBroken > 0 && (
          <>
            <Link2Off className="w-2.5 h-2.5 ml-1" />
            {totalBroken}
          </>
        )}
      </span>
    </motion.div>
  );
};

export default FaktencheckScore;
