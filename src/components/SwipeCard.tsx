import { motion, AnimatePresence } from "framer-motion";
import { useState } from "react";
import TransparencyTag from "./TransparencyTag";
import SourceBadge from "./SourceBadge";
import { AlertTriangle, ChevronDown, ChevronUp, Eye } from "lucide-react";

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
        className="flex items-center gap-1.5 text-[11px] text-muted-foreground/70 font-medium mt-3 hover:text-foreground transition-colors active:scale-[0.97] group"
      >
        <Eye className="w-3 h-3 group-hover:text-accent transition-colors" />
        {expanded ? "Weniger" : "Agenda aufdecken"}
        {expanded ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
      </button>

      <AnimatePresence>
        {expanded && (
          <motion.div
            className="space-y-2 mt-2"
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
          >
            {data.hiddenMeaning && (
              <div className="p-2.5 rounded-lg bg-background/50 border border-border/50">
                <div className="flex items-center gap-1 text-[9px] font-bold text-muted-foreground mb-1 uppercase tracking-widest">
                  <AlertTriangle className="w-2.5 h-2.5" />
                  Versteckt
                </div>
                <p className="text-[11px] text-foreground/60 leading-relaxed">{data.hiddenMeaning}</p>
              </div>
            )}
            {data.negativeEffects && (
              <div className="p-2.5 rounded-lg bg-destructive/5 border border-destructive/10">
                <div className="text-[9px] font-bold text-destructive/80 mb-1 uppercase tracking-widest">
                  ⚠ Risiken
                </div>
                <p className="text-[11px] text-foreground/60 leading-relaxed">{data.negativeEffects}</p>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};

const SwipeCard = ({ topic, tagType, leftView, rightView, mitteView, index, total }: SwipeCardProps) => {
  return (
    <div className="w-full h-full flex flex-col overflow-y-auto">
      {/* Header */}
      <div className="sticky top-0 z-10 bg-background/80 backdrop-blur-md px-5 pt-5 pb-3 border-b border-border/40">
        <div className="flex items-center justify-between mb-2">
          <span className="text-[10px] font-bold tracking-[0.2em] uppercase text-muted-foreground tabular-nums">
            {String(index + 1).padStart(2, "0")} / {String(total).padStart(2, "0")}
          </span>
          <TransparencyTag type={tagType} />
        </div>
        <h2 className="font-editorial text-2xl md:text-3xl font-bold leading-[1.1] tracking-tight">{topic}</h2>
      </div>

      {/* Split Viewpoints */}
      <div className="flex-1 px-5 py-5">
        <div className="grid grid-cols-2 gap-0 relative">
          {/* Center divider */}
          <div className="absolute left-1/2 top-0 bottom-0 -translate-x-1/2 w-px bg-gradient-to-b from-transparent via-accent/40 to-transparent z-10" />

          {/* Left Column */}
          <div className="pr-4 relative">
            {/* Label */}
            <div className="flex items-center gap-2 mb-4">
              <span className="w-2 h-2 rounded-full bg-left flex-shrink-0" />
              <span className="text-[10px] font-black tracking-[0.25em] uppercase text-foreground/80">Links</span>
            </div>

            <p className="font-body text-[13px] text-foreground font-semibold leading-snug mb-3">
              {leftView.position}
            </p>

            <blockquote className="relative pl-3 mb-3 border-l-2 border-foreground/8">
              <p className="font-editorial italic text-[12px] text-foreground/65 leading-relaxed">
                „{leftView.quote}"
              </p>
              <cite className="text-[10px] text-muted-foreground not-italic mt-1 block">
                — {leftView.speaker}
              </cite>
            </blockquote>

            <div className="flex flex-wrap gap-1">
              {leftView.sources.map((s, i) => (
                <SourceBadge key={i} type={s.type} label={s.label} url={s.url} />
              ))}
            </div>

            <HiddenContent data={leftView} />
          </div>

          {/* Right Column */}
          <div className="pl-4 relative">
            {/* Label */}
            <div className="flex items-center justify-end gap-2 mb-4">
              <span className="text-[10px] font-black tracking-[0.25em] uppercase text-right-red">Rechts</span>
              <span className="w-2 h-2 rounded-full bg-right-red flex-shrink-0" />
            </div>

            <p className="font-body text-[13px] text-foreground font-semibold leading-snug mb-3 text-right">
              {rightView.position}
            </p>

            <blockquote className="relative pr-3 mb-3 border-r-2 border-right/8 text-right">
              <p className="font-editorial italic text-[12px] text-foreground/65 leading-relaxed">
                „{rightView.quote}"
              </p>
              <cite className="text-[10px] text-muted-foreground not-italic mt-1 block">
                — {rightView.speaker}
              </cite>
            </blockquote>

            <div className="flex flex-wrap gap-1 justify-end">
              {rightView.sources.map((s, i) => (
                <SourceBadge key={i} type={s.type} label={s.label} url={s.url} />
              ))}
            </div>

            <HiddenContent data={rightView} />
          </div>
        </div>

        {/* Mitte — understated center strip */}
        <div className="mt-6 relative">
          <div className="flex items-center gap-3 mb-3">
            <div className="flex-1 h-px bg-gradient-to-r from-transparent via-accent/30 to-transparent" />
            <span className="text-[9px] font-bold tracking-[0.3em] uppercase text-accent/70 flex-shrink-0">
              Die Mitte
            </span>
            <div className="flex-1 h-px bg-gradient-to-r from-transparent via-accent/30 to-transparent" />
          </div>
          <p className="font-body text-[13px] text-foreground/55 leading-relaxed text-center max-w-lg mx-auto">
            {mitteView}
          </p>
        </div>
      </div>
    </div>
  );
};

export default SwipeCard;