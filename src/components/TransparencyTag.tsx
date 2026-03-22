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
    bgClass: "bg-mitte-light border-mitte",
    textClass: "text-mitte-gold",
  },
  gegensaetzlich: {
    label: "Gegensätzlich",
    emoji: "⚡",
    bgClass: "bg-destructive/10 border-destructive/30",
    textClass: "text-destructive",
  },
  teilweise: {
    label: "Teilweise gleich",
    emoji: "↔",
    bgClass: "bg-secondary border-border",
    textClass: "text-muted-foreground",
  },
};

const TransparencyTag = ({ type, className }: TransparencyTagProps) => {
  const config = tagConfig[type];
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold border tracking-wide uppercase",
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
