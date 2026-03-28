import { useState } from "react";
import { Share2, X, Copy, Check, Mail } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

interface ShareMenuProps {
  topic: string;
}

const ShareMenu = ({ topic }: ShareMenuProps) => {
  const [open, setOpen] = useState(false);
  const [copied, setCopied] = useState(false);

  const url = window.location.origin;
  const text = `${topic} — Was denkt Deutschland? 🇩🇪`;

  const share = (target: string) => {
    const encoded = encodeURIComponent(text);
    const encodedUrl = encodeURIComponent(url);
    const full = encodeURIComponent(text + "\n" + url);

    switch (target) {
      case "whatsapp":
        window.open(`https://wa.me/?text=${full}`, "_blank");
        break;
      case "x":
        window.open(`https://x.com/intent/tweet?text=${encoded}&url=${encodedUrl}`, "_blank");
        break;
      case "telegram":
        window.open(`https://t.me/share/url?url=${encodedUrl}&text=${encoded}`, "_blank");
        break;
      case "facebook":
        window.open(`https://www.facebook.com/sharer/sharer.php?u=${encodedUrl}&quote=${encoded}`, "_blank");
        break;
      case "linkedin":
        window.open(`https://www.linkedin.com/sharing/share-offsite/?url=${encodedUrl}`, "_blank");
        break;
      case "reddit":
        window.open(`https://reddit.com/submit?url=${encodedUrl}&title=${encoded}`, "_blank");
        break;
      case "threads":
        window.open(`https://threads.net/intent/post?text=${full}`, "_blank");
        break;
      case "email":
        window.open(`mailto:?subject=${encodeURIComponent("Was denkt Deutschland?")}&body=${full}`, "_blank");
        break;
      case "copy":
        navigator.clipboard.writeText(`${text}\n${url}`);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
        break;
      case "native":
        if (navigator.share) {
          navigator.share({ title: "Das Denkt Deutschland", text, url }).catch(() => {});
        }
        break;
    }
  };

  const buttons = [
    {
      id: "whatsapp",
      label: "WhatsApp",
      icon: (
        <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="currentColor">
          <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
        </svg>
      ),
    },
    {
      id: "telegram",
      label: "Telegram",
      icon: (
        <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="currentColor">
          <path d="M11.944 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 12 0a12 12 0 0 0-.056 0zm4.962 7.224c.1-.002.321.023.465.14a.506.506 0 0 1 .171.325c.016.093.036.306.02.472-.18 1.898-.962 6.502-1.36 8.627-.168.9-.499 1.201-.82 1.23-.696.065-1.225-.46-1.9-.902-1.056-.693-1.653-1.124-2.678-1.8-1.185-.78-.417-1.21.258-1.91.177-.184 3.247-2.977 3.307-3.23.007-.032.014-.15-.056-.212s-.174-.041-.249-.024c-.106.024-1.793 1.14-5.061 3.345-.48.33-.913.49-1.302.48-.428-.008-1.252-.241-1.865-.44-.752-.245-1.349-.374-1.297-.789.027-.216.325-.437.893-.663 3.498-1.524 5.83-2.529 6.998-3.014 3.332-1.386 4.025-1.627 4.476-1.635z" />
        </svg>
      ),
    },
    {
      id: "x",
      label: "X",
      icon: (
        <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="currentColor">
          <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
        </svg>
      ),
    },
    {
      id: "threads",
      label: "Threads",
      icon: (
        <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="currentColor">
          <path d="M12.186 24h-.007c-3.581-.024-6.334-1.205-8.184-3.509C2.35 18.44 1.5 15.586 1.472 12.01v-.017c.03-3.579.879-6.43 2.525-8.482C5.845 1.205 8.6.024 12.18 0h.014c2.746.02 5.043.725 6.826 2.098 1.677 1.29 2.858 3.13 3.509 5.467l-2.04.569c-1.104-3.96-3.898-5.984-8.304-6.015-2.91.022-5.11.936-6.54 2.717C4.307 6.504 3.616 8.914 3.589 12c.027 3.086.718 5.496 2.057 7.164 1.43 1.783 3.631 2.698 6.54 2.717 2.623-.02 4.358-.631 5.8-2.045 1.647-1.613 1.618-3.593 1.09-4.798-.31-.71-.873-1.3-1.634-1.75-.192 1.352-.622 2.446-1.284 3.272-.886 1.102-2.14 1.704-3.73 1.79-1.202.065-2.361-.218-3.259-.801-1.063-.689-1.685-1.74-1.752-2.96-.065-1.187.408-2.26 1.33-3.017.88-.724 2.104-1.126 3.449-1.13h.026c1.053.006 1.97.234 2.726.677.06-1.01-.1-1.794-.486-2.394-.508-.79-1.358-1.194-2.525-1.197h-.04c-.96.006-1.76.302-2.373.878l-1.39-1.49c.975-.908 2.216-1.39 3.731-1.406h.058c1.695.016 3.014.646 3.822 1.83.654 1.012.96 2.315.917 3.885v.082c.088.047.173.096.257.148 1.07.662 1.86 1.601 2.287 2.72.58 1.52.642 4.203-1.574 6.373C18.076 23.165 15.71 23.965 12.186 24zm-1.065-8.6c-.878.007-1.586.208-2.063.585-.47.371-.686.858-.66 1.486.04.752.375 1.217.993 1.618.655.425 1.493.6 2.348.547 1.106-.06 1.926-.46 2.508-1.22.467-.609.79-1.424.967-2.446-.614-.33-1.34-.533-2.14-.566-.32-.012-.637-.01-.953-.004z" />
        </svg>
      ),
    },
    {
      id: "facebook",
      label: "Facebook",
      icon: (
        <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="currentColor">
          <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
        </svg>
      ),
    },
    {
      id: "linkedin",
      label: "LinkedIn",
      icon: (
        <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="currentColor">
          <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" />
        </svg>
      ),
    },
    {
      id: "reddit",
      label: "Reddit",
      icon: (
        <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="currentColor">
          <path d="M12 0C5.373 0 0 5.373 0 12c0 6.627 5.373 12 12 12s12-5.373 12-12c0-6.627-5.373-12-12-12zm6.066 13.612c.043.267.066.543.066.824 0 4.257-4.96 7.21-11.073 7.21-6.114 0-9.395-2.953-9.395-7.21 0-.281.022-.557.066-.824a1.663 1.663 0 0 1-.726-1.378c0-.92.746-1.666 1.667-1.666.449 0 .856.177 1.156.466C1.904 9.88 4.259 9.065 6.84 8.976l1.553-4.98a.335.335 0 0 1 .399-.223l3.62.878c.234-.469.685-.793 1.213-.793a1.375 1.375 0 0 1 0 2.75 1.375 1.375 0 0 1-1.346-1.098l-3.242-.786-1.38 4.427c2.533.1 4.839.907 6.89 2.084a1.66 1.66 0 0 1 1.148-.458c.921 0 1.667.746 1.667 1.667 0 .56-.277 1.054-.696 1.357zM8.5 13.875a1.375 1.375 0 1 0 0 2.75 1.375 1.375 0 0 0 0-2.75zm7 0a1.375 1.375 0 1 0 0 2.75 1.375 1.375 0 0 0 0-2.75zm-3.5 4.063c1.734 0 3.188-.69 3.61-1.625h-7.22c.422.935 1.876 1.625 3.61 1.625z" />
        </svg>
      ),
    },
    {
      id: "email",
      label: "E-Mail",
      icon: <Mail className="w-3.5 h-3.5" />,
    },
    {
      id: "copy",
      label: copied ? "Kopiert!" : "Link",
      icon: copied ? <Check className="w-3.5 h-3.5 text-accent" /> : <Copy className="w-3.5 h-3.5" />,
    },
  ];

  // Add native share on supported devices
  if (typeof navigator !== "undefined" && navigator.share) {
    buttons.unshift({
      id: "native",
      label: "Teilen…",
      icon: <Share2 className="w-3.5 h-3.5" />,
    });
  }

  return (
    <div className="relative">
      <button
        onClick={() => setOpen(!open)}
        className="p-2.5 md:p-2 rounded-full hover:bg-secondary transition-colors active:scale-95 touch-manipulation"
        aria-label="Teilen"
      >
        {open ? (
          <X className="w-[18px] h-[18px] md:w-4 md:h-4 text-muted-foreground" />
        ) : (
          <Share2 className="w-[18px] h-[18px] md:w-4 md:h-4 text-muted-foreground" />
        )}
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: -4 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: -4 }}
            transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
            className="absolute right-0 top-full mt-2 bg-card border border-border rounded-xl shadow-lg p-2 z-50 w-[200px]"
          >
            <div className="grid grid-cols-3 gap-1">
              {buttons.map((btn) => (
                <button
                  key={btn.id}
                  onClick={() => share(btn.id)}
                  className="flex flex-col items-center gap-1 px-2 py-2.5 text-[10px] font-medium text-foreground rounded-lg hover:bg-secondary transition-colors active:scale-[0.95]"
                >
                  {btn.icon}
                  <span className="truncate w-full text-center">{btn.label}</span>
                </button>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default ShareMenu;
