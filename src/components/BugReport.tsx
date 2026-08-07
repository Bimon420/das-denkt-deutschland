import { useState } from "react";
import { createPortal } from "react-dom";
import { motion, AnimatePresence } from "framer-motion";
import { useLocation } from "react-router-dom";
import { Bug, Send, X, Loader2, Award } from "lucide-react";

// DAS DENKT DEUTSCHLAND — dezenter „Fehler melden"-Einstieg (Simons Dauerregel
// 07.08.). Kein Login. Schreibt ueber /api/fehler in die GETEILTE bug_reports-
// Tabelle (site='das-denkt') und zeigt als Dank eine seltene, gestempelte
// „Stimme des Volkes"-Fehlerspaeher-Plakette mit fortlaufender Nummer. Kein Geld.

type Zwei = { de: string; en: string };
type Belohnung = {
  marke: number;
  plaketten_nr: string;
  dank: Zwei;
  auszeichnung: Zwei;
};
type Status = "idle" | "sending" | "done" | "error";

const BugReport = () => {
  const [open, setOpen] = useState(false);
  const [text, setText] = useState("");
  const [status, setStatus] = useState<Status>("idle");
  const [belohnung, setBelohnung] = useState<Belohnung | null>(null);
  const [fehler, setFehler] = useState("");
  const location = useLocation();

  const reset = () => {
    setText("");
    setStatus("idle");
    setBelohnung(null);
    setFehler("");
  };

  const close = () => {
    setOpen(false);
    setTimeout(reset, 250);
  };

  const submit = async () => {
    if (text.trim().length < 3) {
      setFehler("Bitte beschreibe den Fehler kurz (mind. 3 Zeichen).");
      return;
    }
    setStatus("sending");
    setFehler("");
    try {
      const r = await fetch("/api/fehler", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ text: text.trim(), pfad: location.pathname }),
      });
      const j = await r.json();
      if (!j.ok || !j.belohnung) throw new Error(j.grund || "nok");
      setBelohnung(j.belohnung as Belohnung);
      setStatus("done");
    } catch (e: any) {
      setStatus("error");
      setFehler(
        e?.message === "zu_oft"
          ? "Zu viele Meldungen in kurzer Zeit. Bitte etwas später erneut."
          : "Die Meldung konnte nicht gespeichert werden. Bitte später erneut versuchen."
      );
    }
  };

  const panel = (
    <AnimatePresence>
      {open && (
        <>
          <motion.div
            className="fixed inset-0 z-[60] bg-black/40 backdrop-blur-[2px]"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={close}
          />
          <motion.div
            className="fixed left-4 bottom-4 right-4 sm:left-4 sm:right-auto sm:w-[380px] z-[61] rounded-2xl border border-border bg-card shadow-2xl p-5"
            initial={{ opacity: 0, y: 16, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 16, scale: 0.97 }}
            transition={{ duration: 0.28, ease: [0.16, 1, 0.3, 1] }}
          >
            <div className="flex items-center justify-between mb-3">
              <h4 className="font-body font-bold text-sm uppercase tracking-wide text-foreground flex items-center gap-2">
                <Bug className="w-4 h-4 text-accent" />
                Fehler melden
              </h4>
              <button
                onClick={close}
                className="p-1.5 rounded-full hover:bg-secondary transition-colors"
                aria-label="Schließen"
              >
                <X className="w-4 h-4 text-muted-foreground" />
              </button>
            </div>

            {status === "done" && belohnung ? (
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="text-center py-2"
              >
                <div className="mx-auto mb-3 w-14 h-14 rounded-full border-2 border-accent/40 bg-accent/10 flex items-center justify-center">
                  <Award className="w-7 h-7 text-accent" />
                </div>
                <p className="font-editorial text-lg font-bold text-foreground leading-snug">
                  {belohnung.auszeichnung.de}
                </p>
                <p className="mt-1 font-mono text-xs text-muted-foreground">
                  Nr. {String(belohnung.marke).padStart(6, "0")} · {belohnung.plaketten_nr}
                </p>
                <p className="mt-3 text-sm text-muted-foreground leading-relaxed">
                  {belohnung.dank.de}
                </p>
                <div className="mt-4 flex items-center justify-center gap-2 text-[10px] text-muted-foreground/60">
                  <div className="w-2 h-2 rounded-full bg-left" />
                  <span>—</span>
                  <div className="w-2 h-2 rounded-full bg-mitte" />
                  <span>—</span>
                  <div className="w-2 h-2 rounded-full bg-right-red" />
                </div>
                <button
                  onClick={reset}
                  className="mt-4 text-xs font-semibold text-accent hover:underline"
                >
                  Noch einen Fehler melden
                </button>
              </motion.div>
            ) : (
              <>
                <p className="text-xs text-muted-foreground mb-3">
                  Etwas stimmt nicht? Sag es uns — kein Konto nötig. Als Dank
                  wartet eine seltene „Stimme des Volkes"-Plakette mit eigener
                  Nummer.
                </p>
                <textarea
                  value={text}
                  onChange={(e) => setText(e.target.value)}
                  placeholder="Was ist dir aufgefallen? (Seite, Knopf, falsche Zahl …)"
                  rows={4}
                  maxLength={2000}
                  disabled={status === "sending"}
                  className="w-full px-3 py-2.5 rounded-lg bg-background border border-border text-sm text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:ring-2 focus:ring-accent/40 transition-all resize-none"
                />
                {fehler && (
                  <p className="mt-2 text-xs text-destructive">{fehler}</p>
                )}
                <div className="flex justify-end mt-3">
                  <button
                    onClick={submit}
                    disabled={status === "sending"}
                    className="flex items-center gap-2 px-5 py-2.5 rounded-lg bg-primary text-primary-foreground text-sm font-semibold hover:opacity-90 active:scale-95 transition-all disabled:opacity-50"
                  >
                    {status === "sending" ? (
                      <>
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                        Wird gesendet…
                      </>
                    ) : (
                      <>
                        <Send className="w-3.5 h-3.5" />
                        Melden
                      </>
                    )}
                  </button>
                </div>
              </>
            )}
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        title="Fehler melden — mit einer seltenen Plakette als Dank"
        aria-label="Fehler melden"
        className="fixed left-4 bottom-4 z-50 flex items-center gap-2 px-3 py-2 rounded-full border border-border bg-card/80 backdrop-blur text-muted-foreground hover:text-foreground hover:border-accent/50 shadow-lg transition-all text-xs font-medium"
      >
        <Bug className="w-3.5 h-3.5" />
        <span className="hidden sm:inline">Fehler melden</span>
      </button>
      {typeof document !== "undefined" && createPortal(panel, document.body)}
    </>
  );
};

export default BugReport;
