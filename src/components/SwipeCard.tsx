import { motion, AnimatePresence } from "framer-motion";
import { useState } from "react";
import TransparencyTag from "./TransparencyTag";
import SourceBadge from "./SourceBadge";
import { AlertTriangle, ChevronDown, Eye, Scale } from "lucide-react";

interface ViewpointData {
  position: string;
  quote: string;
  speaker: string;
  hiddenMeaning?: string;
  negativeEffects?: string;
  sources: { type: "article" | "video" | "quote" | "document"; label: string; url: string }[];
}

interface SwipeCardProps {
  topic: string;
  tagType: "gleich" | "gegensaetzlich" | "teilweise";
  category: "politik" | "boulevard";
  leftView: ViewpointData;
  rightView: ViewpointData;
  mitteView: string;
  index: number;
  total: number;
}

const HiddenContent = ({ data }: { data: ViewpointData }) => {
  const [expanded, setExpanded] = useState(false);

  if (!data.hiddenMeaning && !data.negativeEffects) return null;

  return (
    <>
      <button
        onClick={() => setExpanded(!expanded)}
        className="flex items-center gap-1.5 text-[11px] text-muted-foreground/70 font-medium mt-4 hover:text-foreground transition-colors duration-200 active:scale-[0.97] group"
      >
        <Eye className="w-3 h-3 group-hover:text-accent transition-colors duration-200" />
        {expanded ? "Weniger" : "Agenda aufdecken"}
        <motion.span
          animate={{ rotate: expanded ? 180 : 0 }}
          transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
        >
          <ChevronDown className="w-3 h-3" />
        </motion.span>
      </button>

      <AnimatePresence>
        {expanded && (
          <motion.div
            className="space-y-2.5 mt-2.5 overflow-hidden"
            initial={{ opacity: 0, height: 0, filter: "blur(4px)" }}
            animate={{ opacity: 1, height: "auto", filter: "blur(0px)" }}
            exit={{ opacity: 0, height: 0, filter: "blur(4px)" }}
            transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
          >
            {data.hiddenMeaning && (
              <motion.div
                className="p-3 rounded-lg bg-background/50 border border-border/50 shadow-sm"
                initial={{ opacity: 0, x: -8 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.1, duration: 0.3 }}
              >
                <div className="flex items-center gap-1 text-[9px] font-bold text-muted-foreground mb-1.5 uppercase tracking-widest">
                  <AlertTriangle className="w-2.5 h-2.5" />
                  Versteckt
                </div>
                <p className="text-[11px] text-foreground/60 leading-relaxed">{data.hiddenMeaning}</p>
              </motion.div>
            )}
            {data.negativeEffects && (
              <motion.div
                className="p-3 rounded-lg bg-destructive/5 border border-destructive/10 shadow-sm"
                initial={{ opacity: 0, x: -8 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.15, duration: 0.3 }}
              >
                <div className="text-[9px] font-bold text-destructive/80 mb-1.5 uppercase tracking-widest">
                  ⚠ Risiken
                </div>
                <p className="text-[11px] text-foreground/60 leading-relaxed">{data.negativeEffects}</p>
              </motion.div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};

const SwipeCard = ({ topic, tagType, category, leftView, rightView, mitteView, index, total }: SwipeCardProps) => {
  const isBoulevard = category === "boulevard";

  return (
    <div className="w-full h-full flex flex-col overflow-y-auto">
      {/* Header */}
      <div className={`sticky top-0 z-10 backdrop-blur-xl px-5 pt-5 pb-3 border-b ${isBoulevard ? 'bg-accent/5 border-accent/20' : 'bg-background/80 border-border/30'}`}>
        <div className="flex items-center justify-between mb-2.5">
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-bold tracking-[0.2em] uppercase text-muted-foreground tabular-nums">
              {String(index + 1).padStart(2, "0")} / {String(total).padStart(2, "0")}
            </span>
            {isBoulevard && (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[9px] font-bold tracking-wider uppercase bg-accent/15 text-accent border border-accent/25">
                ✦ Boulevard
              </span>
            )}
          </div>
          <TransparencyTag type={tagType} />
        </div>
        <h2 className="font-editorial text-2xl md:text-3xl font-bold leading-[1.08] tracking-tight">{topic}</h2>
      </div>

      {/* Split Viewpoints */}
      <div className="flex-1 px-5 py-6">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-8 sm:gap-0 relative">
          {/* Center divider — only on sm+ */}
          <div className="hidden sm:block absolute left-1/2 top-0 bottom-0 -translate-x-1/2 w-px bg-gradient-to-b from-transparent via-accent/30 to-transparent z-10" />

          {/* Left Column */}
          <div className="sm:pr-5 relative">
            <div className="flex items-center gap-2.5 mb-4">
              <span className="flex items-center justify-center w-5 h-5 rounded-full bg-left text-primary-foreground text-[10px] flex-shrink-0">✊</span>
              <span className="text-[10px] font-black tracking-[0.25em] uppercase text-foreground/80">Links</span>
            </div>

            <p className="font-body text-[13px] text-foreground font-semibold leading-snug mb-3">
              {leftView.position}
            </p>

            <blockquote className="relative pl-3.5 mb-4 border-l-2 border-left/20">
              <p className="font-editorial italic text-[12px] text-foreground/60 leading-relaxed">
                „{leftView.quote}"
              </p>
              <cite className="text-[10px] text-muted-foreground not-italic mt-1.5 block font-medium">
                — {leftView.speaker}
              </cite>
            </blockquote>

            <div className="flex flex-wrap gap-1.5">
              {leftView.sources.map((s, i) => (
                <SourceBadge key={i} type={s.type} label={s.label} url={s.url} />
              ))}
            </div>

            <HiddenContent data={leftView} />
          </div>

          {/* Horizontal divider — only on mobile */}
          <div className="sm:hidden h-px bg-gradient-to-r from-transparent via-border to-transparent" />

          {/* Right Column */}
          <div className="sm:pl-5 relative">
            <div className="flex items-center gap-2.5 sm:justify-end mb-4">
              <span className="sm:hidden w-2.5 h-2.5 rounded-full bg-right-red ring-2 ring-right/20 flex-shrink-0" />
              <span className="text-[10px] font-black tracking-[0.25em] uppercase text-right-red">Rechts</span>
              <span className="hidden sm:block w-2.5 h-2.5 rounded-full bg-right-red ring-2 ring-right/20 flex-shrink-0" />
            </div>

            <p className="font-body text-[13px] text-foreground font-semibold leading-snug mb-3 sm:text-right">
              {rightView.position}
            </p>

            <blockquote className="relative pl-3.5 sm:pl-0 sm:pr-3.5 mb-4 border-l-2 sm:border-l-0 sm:border-r-2 border-right/20 sm:text-right">
              <p className="font-editorial italic text-[12px] text-foreground/60 leading-relaxed">
                „{rightView.quote}"
              </p>
              <cite className="text-[10px] text-muted-foreground not-italic mt-1.5 block font-medium">
                — {rightView.speaker}
              </cite>
            </blockquote>

            <div className="flex flex-wrap gap-1.5 sm:justify-end">
              {rightView.sources.map((s, i) => (
                <SourceBadge key={i} type={s.type} label={s.label} url={s.url} />
              ))}
            </div>

            <HiddenContent data={rightView} />
          </div>
        </div>

        {/* Mitte — understated center strip */}
        <div className="mt-8 relative">
          <div className="flex items-center gap-3 mb-3">
            <div className="flex-1 h-px bg-gradient-to-r from-transparent via-accent/25 to-transparent" />
            <span className="text-[9px] font-bold tracking-[0.3em] uppercase text-accent/60 flex-shrink-0">
              Die Mitte
            </span>
            <div className="flex-1 h-px bg-gradient-to-r from-transparent via-accent/25 to-transparent" />
          </div>
          <p className="font-body text-[13px] text-foreground/50 leading-relaxed text-center max-w-lg mx-auto">
            {mitteView}
          </p>
        </div>
      </div>
    </div>
  );
};

export default SwipeCard;
