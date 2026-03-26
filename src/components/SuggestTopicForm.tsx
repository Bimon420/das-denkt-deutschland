import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Plus, Send, X, ExternalLink } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { z } from "zod";

const suggestionSchema = z.object({
  title: z.string().trim().min(5, "Mindestens 5 Zeichen").max(200, "Maximal 200 Zeichen"),
  url: z.string().trim().url("Bitte eine gültige URL eingeben").max(500, "URL zu lang"),
});

const SuggestTopicForm = () => {
  const [open, setOpen] = useState(false);
  const [title, setTitle] = useState("");
  const [url, setUrl] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const result = suggestionSchema.safeParse({ title, url });
    if (!result.success) {
      toast.error(result.error.errors[0].message);
      return;
    }

    setSubmitting(true);
    const { error } = await supabase
      .from("topic_suggestions" as any)
      .insert({ title: result.data.title, url: result.data.url } as any);

    setSubmitting(false);

    if (error) {
      toast.error("Fehler beim Senden. Bitte versuche es erneut.");
      console.error(error);
      return;
    }

    toast.success("Danke! Dein Themenvorschlag wurde eingereicht.");
    setTitle("");
    setUrl("");
    setOpen(false);
  };

  return (
    <div className="max-w-5xl mx-auto mb-12">
      <AnimatePresence mode="wait">
        {!open ? (
          <motion.button
            key="button"
            onClick={() => setOpen(true)}
            className="w-full py-4 rounded-xl border-2 border-dashed border-border hover:border-accent/50 bg-secondary/30 hover:bg-secondary/60 transition-all duration-300 flex items-center justify-center gap-2 text-muted-foreground hover:text-foreground group"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95 }}
            whileTap={{ scale: 0.98 }}
          >
            <Plus className="w-4 h-4 group-hover:text-accent transition-colors" />
            <span className="text-sm font-semibold tracking-wide uppercase">
              Thema vorschlagen
            </span>
          </motion.button>
        ) : (
          <motion.form
            key="form"
            onSubmit={handleSubmit}
            className="rounded-xl border border-border bg-card p-5 md:p-6"
            initial={{ opacity: 0, y: 10, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
          >
            <div className="flex items-center justify-between mb-4">
              <h4 className="font-body font-bold text-sm uppercase tracking-wide text-foreground">
                Thema vorschlagen
              </h4>
              <button
                type="button"
                onClick={() => setOpen(false)}
                className="p-1.5 rounded-full hover:bg-secondary transition-colors"
              >
                <X className="w-4 h-4 text-muted-foreground" />
              </button>
            </div>

            <div className="space-y-3">
              <div>
                <label className="text-xs font-medium text-muted-foreground mb-1 block">
                  Thema / Titel
                </label>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="z.B. Neue Steuerpläne der Regierung"
                  className="w-full px-3 py-2.5 rounded-lg bg-background border border-border text-sm text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:ring-2 focus:ring-accent/40 transition-all"
                  maxLength={200}
                  required
                />
              </div>

              <div>
                <label className="text-xs font-medium text-muted-foreground mb-1 flex items-center gap-1">
                  <ExternalLink className="w-3 h-3" />
                  Link zur Quelle
                </label>
                <input
                  type="url"
                  value={url}
                  onChange={(e) => setUrl(e.target.value)}
                  placeholder="https://..."
                  className="w-full px-3 py-2.5 rounded-lg bg-background border border-border text-sm text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:ring-2 focus:ring-accent/40 transition-all"
                  maxLength={500}
                  required
                />
              </div>
            </div>

            <div className="flex justify-end mt-4">
              <button
                type="submit"
                disabled={submitting}
                className="flex items-center gap-2 px-5 py-2.5 rounded-lg bg-primary text-primary-foreground text-sm font-semibold hover:opacity-90 active:scale-95 transition-all disabled:opacity-50"
              >
                <Send className="w-3.5 h-3.5" />
                {submitting ? "Senden…" : "Vorschlag senden"}
              </button>
            </div>
          </motion.form>
        )}
      </AnimatePresence>
    </div>
  );
};

export default SuggestTopicForm;
