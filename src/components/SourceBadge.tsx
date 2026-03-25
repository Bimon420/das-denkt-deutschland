import { ExternalLink, Play, FileText, Quote } from "lucide-react";

type SourceType = "article" | "video" | "quote" | "document";

interface SourceBadgeProps {
  type: SourceType;
  label: string;
  url: string;
}

const iconMap: Record<SourceType, React.ReactNode> = {
  article: <ExternalLink className="w-3 h-3" />,
  video: <Play className="w-3 h-3" />,
  quote: <Quote className="w-3 h-3" />,
  document: <FileText className="w-3 h-3" />,
};

const SourceBadge = ({ type, label, url }: SourceBadgeProps) => {
  const baseClasses =
    "inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-secondary/80 text-muted-foreground text-[11px] font-medium shadow-sm";

  if (url && url.trim() !== "") {
    return (
      <a
        href={url}
        target="_blank"
        rel="noopener noreferrer"
        className={`${baseClasses} hover:shadow-md hover:bg-accent hover:text-accent-foreground transition-all duration-200 active:scale-[0.96]`}
      >
        {iconMap[type]}
        {label}
      </a>
    );
  }

  return (
    <span className={baseClasses}>
      {iconMap[type]}
      {label}
    </span>
  );
};

export default SourceBadge;