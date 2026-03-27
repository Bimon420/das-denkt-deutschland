import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Plus, Send, X, ExternalLink, Loader2, CheckCircle2, XCircle } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { z } from "zod";
import { useQueryClient } from "@tanstack/react-query";

const urlSchema = z.object({
  url: z.string().trim().url("Bitte eine gültige URL eingeben").max(500, "URL zu lang"),
});

type Status = "idle" | "processing" | "success" | "error";

const SuggestTopicForm = () => {
  const [open, setOpen] = useState(false);
  const [url, setUrl] = useState("");
  const [status, setStatus] = useState<Status>("idle");
  const [errorMsg, setErrorMsg] = useState("");
  const queryClient = useQueryClient();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const result = urlSchema.safeParse({ url });
    if (!result.success) {
      toast.error(result.error.errors[0].message);
      return;
    }

    setStatus("processing");
    setErrorMsg("");

    try {
      const { data, error } = await supabase.functions.invoke("process-suggestion", {
        body: { url: result.data.url },
      });

      if (error) throw error;

      if (data?.success) {
        setStatus("success");
        toast.success("Thema wurde geprüft, freigegeben und veröffentlicht!");
        queryClient.invalidateQueries({ queryKey: ["topics"] });
        setTimeout(() => {
          setUrl("");
          setOpen(false);
          setStatus("idle");
        }, 2000);
      } else {
        setStatus("error");
        setErrorMsg(data?.error || "Das Thema hat die Qualitätsprüfung nicht bestanden.");
      }
    } catch (err: any) {
      setStatus("error");
      setErrorMsg("Fehler bei der Verarbeitung. Bitte versuche es erneut.");
      console.error(err);
    }
  };

  const resetForm = () => {
    setStatus("idle");
    setErrorMsg("");
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
              Thema einreichen
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
                Link einreichen
              </h4>
              <button
                type="button"
                onClick={() => { setOpen(false); resetForm(); }}
                className="p-1.5 rounded-full hover:bg-secondary transition-colors"
                disabled={status === "processing"}
              >
                <X className="w-4 h-4 text-muted-foreground" />
              </button>
            </div>

            {status === "success" ? (
              <motion.div
                className="flex flex-col items-center gap-3 py-6 text-center"
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
              >
                <CheckCircle2 className="w-10 h-10 text-green-500" />
                <p className="text-sm font-semibold text-foreground">Thema veröffentlicht!</p>
                <p className="text-xs text-muted-foreground">Das Thema wurde geprüft und zur Seite hinzugefügt.</p>
              </motion.div>
            ) : status === "error" ? (
              <motion.div
                className="flex flex-col items-center gap-3 py-6 text-center"
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
              >
                <XCircle className="w-10 h-10 text-destructive" />
                <p className="text-sm font-semibold text-foreground">Nicht freigegeben</p>
                <p className="text-xs text-muted-foreground max-w-md">{errorMsg}</p>
                <button
                  type="button"
                  onClick={resetForm}
                  className="mt-2 text-xs font-semibold text-accent hover:underline"
                >
                  Erneut versuchen
                </button>
              </motion.div>
            ) : (
              <>
                <p className="text-xs text-muted-foreground mb-3">
                  Reiche einen Link zu einem Nachrichtenartikel ein. Das System analysiert ihn, prüft die Qualität und veröffentlicht ihn als neues Thema.
                </p>

                <div>
                  <label className="text-xs font-medium text-muted-foreground mb-1 flex items-center gap-1">
                    <ExternalLink className="w-3 h-3" />
                    Link zum Artikel
                  </label>
                  <input
                    type="url"
                    value={url}
                    onChange={(e) => setUrl(e.target.value)}
                    placeholder="https://..."
                    className="w-full px-3 py-2.5 rounded-lg bg-background border border-border text-sm text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:ring-2 focus:ring-accent/40 transition-all"
                    maxLength={500}
                    required
                    disabled={status === "processing"}
                  />
                </div>

                <div className="flex justify-end mt-4">
                  <button
                    type="submit"
                    disabled={status === "processing"}
                    className="flex items-center gap-2 px-5 py-2.5 rounded-lg bg-primary text-primary-foreground text-sm font-semibold hover:opacity-90 active:scale-95 transition-all disabled:opacity-50"
                  >
                    {status === "processing" ? (
                      <>
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                        Wird geprüft…
                      </>
                    ) : (
                      <>
                        <Send className="w-3.5 h-3.5" />
                        Einreichen
                      </>
                    )}
                  </button>
                </div>

                {status === "processing" && (
                  <motion.div
                    className="mt-4 p-3 rounded-lg bg-secondary/50 text-center"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                  >
                    <p className="text-xs text-muted-foreground">
                      ⏳ Der Artikel wird analysiert und durchläuft eine 10-fache Qualitätsprüfung. Das kann bis zu 30 Sekunden dauern…
                    </p>
                  </motion.div>
                )}
              </>
            )}
          </motion.form>
        )}
      </AnimatePresence>
    </div>
  );
};

export default SuggestTopicForm;
