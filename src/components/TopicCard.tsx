import { motion, useInView } from "framer-motion";
import { useRef } from "react";
import TransparencyTag from "./TransparencyTag";
import OpinionSlider from "./OpinionSlider";
import SourceBadge from "./SourceBadge";
import FaktencheckScore from "./FaktencheckScore";
import { AlertTriangle, Trophy } from "lucide-react";

interface ViewpointData {
  position: string;
  quote: string;
  speaker: string;
  hiddenMeaning?: string;
  negativeEffects?: string;
  sources: { type: "article" | "video" | "quote" | "document"; label: string; url: string }[];
}

interface TopicCardProps {
  id?: string;
  topic: string;
  tagType: "gleich" | "gegensaetzlich" | "teilweise";
  category?: "politik" | "boulevard";
  leftView: ViewpointData;
  rightView: ViewpointData;
  mitteView: string;
  index: number;
  hideIndex?: boolean;
  isTopicOfTheWeek?: boolean;
}

const ViewpointPanel = ({
  data,
  side,
  delay,
}: {
  data: ViewpointData;
  side: "left" | "right";
  delay: number;
}) => {
  const isLeft = side === "left";
  return (
    <motion.div
      className={`flex-1 p-4 md:p-8 rounded-xl ${isLeft ? "bg-left-light border-l-4 border-left" : "bg-right-light border-r-4 border-right-red"}`}
      initial={{ opacity: 0, x: isLeft ? -30 : 30, filter: "blur(4px)" }}
      whileInView={{ opacity: 1, x: 0, filter: "blur(0px)" }}
      viewport={{ once: true, amount: 0.2 }}
      transition={{ delay, duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
    >
      <div className={`text-xs font-bold tracking-widest uppercase mb-4 ${isLeft ? "text-left-blue" : "text-right-red"}`}>
        {isLeft ? "← Links" : "Rechts →"}
      </div>

      <h4 className="font-body font-semibold text-foreground mb-3">{data.position}</h4>

      <blockquote className="font-editorial italic text-foreground/80 text-sm border-l-2 border-foreground/10 pl-4 mb-3">
        „{data.quote}"
        <footer className="text-xs text-muted-foreground mt-1 not-italic">— {data.speaker}</footer>
      </blockquote>

      {/* Sources */}
      <div className="flex flex-wrap gap-1.5 mb-4">
        {data.sources.map((s, i) => (
          <SourceBadge key={i} type={s.type} label={s.label} url={s.url} />
        ))}
      </div>

      {/* Hidden meaning */}
      {data.hiddenMeaning && (
        <div className="mt-4 p-3 rounded-lg bg-background/60 border border-border">
          <div className="flex items-center gap-1.5 text-xs font-semibold text-muted-foreground mb-1 uppercase tracking-wide">
            <AlertTriangle className="w-3 h-3" />
            Versteckte Bedeutung
          </div>
          <p className="text-xs text-foreground/70">{data.hiddenMeaning}</p>
        </div>
      )}

      {/* Negative effects */}
      {data.negativeEffects && (
        <div className="mt-3 p-3 rounded-lg bg-destructive/5 border border-destructive/15">
          <div className="text-xs font-semibold text-destructive mb-1 uppercase tracking-wide">
            ⚠ Mögliche negative Auswirkungen
          </div>
          <p className="text-xs text-foreground/70">{data.negativeEffects}</p>
        </div>
      )}
    </motion.div>
  );
};

const TopicCard = ({ id, topic, tagType, category = "politik", leftView, rightView, mitteView, index, hideIndex, isTopicOfTheWeek }: TopicCardProps) => {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, amount: 0.15 });
  const isBoulevard = category === "boulevard";

  return (
    <div ref={ref} className="mb-12 md:mb-20">
      {/* Topic header */}
      <motion.div
        className="text-center mb-5 md:mb-8"
        initial={{ opacity: 0, y: 20 }}
        animate={isInView ? { opacity: 1, y: 0 } : {}}
        transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
      >
        <div className="flex items-center justify-center gap-2.5 flex-wrap">
          {!hideIndex && (
            <span className="text-xs font-bold tracking-widest uppercase text-muted-foreground">
              Thema {String(index + 1).padStart(2, "0")}
            </span>
          )}
          {isTopicOfTheWeek && (
            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold tracking-wide uppercase bg-accent/20 text-accent border border-accent/30 animate-pulse-gold">
              <Trophy className="w-3 h-3" />
              Thema der Woche
            </span>
          )}
          {isBoulevard && (
            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold tracking-wide uppercase bg-accent/20 text-accent border border-accent/30">
              ✦ Boulevard
            </span>
          )}
        </div>
        <h3 className="font-editorial text-2xl md:text-4xl font-bold mt-2 mb-3 md:mb-4 px-1">{topic}</h3>
        <TransparencyTag type={tagType} />
      </motion.div>

      {/* Left vs Right panels */}
      <div className="flex flex-col md:flex-row gap-3 md:gap-6">
        <ViewpointPanel data={leftView} side="left" delay={0.1} />
        <ViewpointPanel data={rightView} side="right" delay={0.2} />
      </div>

      {/* Die Mitte spricht */}
      <motion.div
        className="mt-4 md:mt-6 mx-auto max-w-2xl p-4 md:p-5 rounded-xl bg-secondary/50 border border-border text-center"
        initial={{ opacity: 0, y: 20, scale: 0.97 }}
        whileInView={{ opacity: 1, y: 0, scale: 1 }}
        viewport={{ once: true, amount: 0.3 }}
        transition={{ delay: 0.4, duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
      >
        <div className="text-xs font-medium tracking-wide uppercase text-muted-foreground mb-2">
          ↔ Irgendwo dazwischen
        </div>
        <p className="font-body text-sm text-foreground/70 leading-relaxed">{mitteView}</p>
      </motion.div>

      {/* Opinion slider */}
      {id && <OpinionSlider topicId={id} />}
    </div>
  );
};

export default TopicCard;
