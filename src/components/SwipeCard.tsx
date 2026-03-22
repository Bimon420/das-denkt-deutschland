import { motion, useMotionValue, useTransform, PanInfo } from "framer-motion";
import { useState } from "react";
import TransparencyTag from "./TransparencyTag";
import SourceBadge from "./SourceBadge";
import { AlertTriangle, ChevronDown, ChevronUp } from "lucide-react";

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

const ViewpointSection = ({
  data,
  side,
}: {
  data: ViewpointData;
  side: "left" | "right";
}) => {
  const isLeft = side === "left";
  const [expanded, setExpanded] = useState(false);

  return (
    <div
      className={`rounded-xl overflow-hidden ${
        isLeft
          ? "bg-left-light border-l-4 border-left"
          : "bg-right-light border-r-4 border-right-red"
      }`}
    >
      <div className="p-5">
        <div
          className={`text-[10px] font-bold tracking-[0.2em] uppercase mb-3 ${
            isLeft ? "text-left" : "text-right-red"
          }`}
        >
          {isLeft ? "← Links" : "Rechts →"}
        </div>

        <h4 className="font-body font-semibold text-sm text-foreground mb-3 leading-snug">
          {data.position}
        </h4>

        <blockquote className="font-editorial italic text-foreground/80 text-[13px] border-l-2 border-foreground/10 pl-3 mb-3">
          „{data.quote}"
          <footer className="text-[11px] text-muted-foreground mt-1 not-italic">
            — {data.speaker}
          </footer>
        </blockquote>

        <div className="flex flex-wrap gap-1.5 mb-2">
          {data.sources.map((s, i) => (
            <SourceBadge key={i} type={s.type} label={s.label} url={s.url} />
          ))}
        </div>

        {(data.hiddenMeaning || data.negativeEffects) && (
          <button
            onClick={() => setExpanded(!expanded)}
            className="flex items-center gap-1 text-[11px] text-muted-foreground font-medium mt-2 hover:text-foreground transition-colors active:scale-[0.97]"
          >
            {expanded ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
            {expanded ? "Weniger zeigen" : "Versteckte Agenda aufdecken"}
          </button>
        )}
      </div>

      {expanded && (
        <motion.div
          className="px-5 pb-5 space-y-3"
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: "auto" }}
          exit={{ opacity: 0, height: 0 }}
          transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
        >
          {data.hiddenMeaning && (
            <div className="p-3 rounded-lg bg-background/60 border border-border">
              <div className="flex items-center gap-1.5 text-[10px] font-semibold text-muted-foreground mb-1 uppercase tracking-wide">
                <AlertTriangle className="w-3 h-3" />
                Versteckte Bedeutung
              </div>
              <p className="text-[12px] text-foreground/70 leading-relaxed">{data.hiddenMeaning}</p>
            </div>
          )}
          {data.negativeEffects && (
            <div className="p-3 rounded-lg bg-destructive/5 border border-destructive/15">
              <div className="text-[10px] font-semibold text-destructive mb-1 uppercase tracking-wide">
                ⚠ Negative Auswirkungen
              </div>
              <p className="text-[12px] text-foreground/70 leading-relaxed">{data.negativeEffects}</p>
            </div>
          )}
        </motion.div>
      )}
    </div>
  );
};

const SwipeCard = ({ topic, tagType, leftView, rightView, mitteView, index, total }: SwipeCardProps) => {
  return (
    <div className="w-full h-full flex flex-col overflow-y-auto">
      {/* Header */}
      <div className="sticky top-0 z-10 bg-background/80 backdrop-blur-md px-5 pt-5 pb-3 border-b border-border/50">
        <div className="flex items-center justify-between mb-2">
          <span className="text-[10px] font-bold tracking-[0.2em] uppercase text-muted-foreground">
            {String(index + 1).padStart(2, "0")} / {String(total).padStart(2, "0")}
          </span>
          <TransparencyTag type={tagType} />
        </div>
        <h2 className="font-editorial text-2xl md:text-3xl font-bold leading-tight">{topic}</h2>
      </div>

      {/* Content */}
      <div className="flex-1 px-5 py-5 space-y-4">
        <ViewpointSection data={leftView} side="left" />
        <ViewpointSection data={rightView} side="right" />

        {/* Mitte */}
        <div className="p-5 rounded-xl bg-secondary/50 border border-border">
          <div className="text-[10px] font-medium tracking-[0.15em] uppercase text-muted-foreground mb-2 text-center">
            ↔ Irgendwo dazwischen
          </div>
          <p className="font-body text-sm text-foreground/70 leading-relaxed text-center">
            {mitteView}
          </p>
        </div>
      </div>
    </div>
  );
};

export default SwipeCard;
