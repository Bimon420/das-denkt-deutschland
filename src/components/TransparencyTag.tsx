import { cn } from "@/lib/utils";

type TagType = "gleich" | "gegensaetzlich" | "teilweise";

interface TransparencyTagProps {
  type: TagType;
  className?: string;
}

const tagConfig: Record<TagType, { label: string; emoji: string; bgClass: string; textClass: string }> = {
  gleich: {
    label: "Gleiche Position",
    emoji: "✓",
    bgClass: "bg-mitte-light border-mitte/40",
    textClass: "text-mitte-gold",
  },
  gegensaetzlich: {
    label: "Gegensätzlich",
    emoji: "⚡",
    bgClass: "bg-destructive/8 border-destructive/20",
    textClass: "text-destructive",
  },
  teilweise: {
    label: "Teilweise gleich",
    emoji: "↔",
    bgClass: "bg-secondary border-border/60",
    textClass: "text-muted-foreground",
  },
};

const TransparencyTag = ({ type, className }: TransparencyTagProps) => {
  const config = tagConfig[type];
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-bold border tracking-wider uppercase shadow-sm",
        config.bgClass,
        config.textClass,
        className
      )}
    >
      <span>{config.emoji}</span>
      {config.label}
    </span>
  );
};

export default TransparencyTag;
