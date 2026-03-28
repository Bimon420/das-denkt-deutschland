import { useState, useRef } from "react";
import ViewCounter from "@/components/ViewCounter";
import { motion, AnimatePresence } from "framer-motion";
import { useTopics } from "@/hooks/useTopics";
import TopicCard from "@/components/TopicCard";
import ShareMenu from "@/components/ShareMenu";
import ThemeToggle from "@/components/ThemeToggle";
import NotificationBell from "@/components/NotificationBell";
import { Info, Archive, Loader2, RefreshCw, Plus, Send, X, BarChart3 } from "lucide-react";
import { useTopicOfTheWeek } from "@/hooks/useTopicOfTheWeek";
import { useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

const AppView = () => {
  const { data: topics = [], isLoading, isFetching } = useTopics();
  const { data: topicOfTheWeekId } = useTopicOfTheWeek();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [spinning, setSpinning] = useState(false);
  const [suggestOpen, setSuggestOpen] = useState(false);
  const [suggestUrl, setSuggestUrl] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleRefresh = async () => {
    setSpinning(true);
    await queryClient.invalidateQueries({ queryKey: ["topics"] });
    setTimeout(() => setSpinning(false), 700);
  };

  const handleSuggestSubmit = async () => {
    const trimmed = suggestUrl.trim();
    if (!trimmed) return;
    try {
      new URL(trimmed);
    } catch {
      toast.error("Bitte eine gültige URL eingeben");
      return;
    }
    setSubmitting(true);
    try {
      const { data, error } = await supabase.functions.invoke("process-suggestion", {
        body: { url: trimmed },
      });
      if (error) throw error;
      if (data?.success) {
        toast.success("Thema wurde geprüft und veröffentlicht!");
        // Prepend the new topic so it appears at the top for this user
        if (data.topic) {
          const { mapDbToTopic } = await import("@/hooks/useTopics");
          const newTopic = mapDbToTopic(data.topic);
          queryClient.setQueryData(["topics"], (old: any) => {
            if (Array.isArray(old)) return [newTopic, ...old];
            return [newTopic];
          });
        } else {
          queryClient.invalidateQueries({ queryKey: ["topics"] });
        }
        setSuggestUrl("");
        setSuggestOpen(false);
      } else {
        toast.error("Dieser Link hat leider keine Relevanz für diese Seite.");
      }
    } catch (error: any) {
      // 422 = quality check failed → show friendly rejection message
      const body = error?.context?.body || error?.context;
      if (body?.success === false) {
        toast.error("Dieser Link hat leider keine Relevanz für diese Seite.");
      } else {
        toast.error(error?.message || "Fehler bei der Verarbeitung.");
      }
    } finally {
      setSubmitting(false);
    }
  };

  if (isLoading || topics.length === 0) {
    return (
      <div className="h-[100dvh] w-full bg-background flex flex-col items-center justify-center gap-3">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.4 }}
        >
          <Loader2 className="w-7 h-7 animate-spin text-accent" />
        </motion.div>
        <motion.p
          className="text-xs text-muted-foreground font-medium"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3, duration: 0.4 }}
        >
          Themen laden…
        </motion.p>
      </div>
    );
  }

  const btnClass = "p-2.5 md:p-2 rounded-full hover:bg-secondary transition-all duration-200 active:scale-95 touch-manipulation";
  const iconClass = "w-[18px] h-[18px] md:w-4 md:h-4 text-muted-foreground";

  return (
    <div className="min-h-screen bg-background">
      {/* Sticky header */}
      <header className="sticky top-0 z-30 border-b border-border/40 bg-background/90 backdrop-blur-xl safe-area-top">
        <div className="flex items-center justify-between px-2 md:px-5 py-1.5 md:py-3">
          <div className="flex items-center gap-1.5 md:gap-2 min-w-0">
            <img src="/logo.png" alt="DDD" className="w-auto flex-shrink-0 h-5 md:h-6" />
            <span className="font-body text-[10px] md:text-sm font-extrabold tracking-tight uppercase truncate hidden xs:inline">Das Denkt Deutschland</span>
          </div>
          <div className="flex items-center gap-0">
            <NotificationBell />
            <motion.button
              onClick={handleRefresh}
              disabled={spinning || isFetching}
              className={`${btnClass} disabled:opacity-50`}
              aria-label="Aktualisieren"
              animate={{ rotate: spinning ? 360 : 0 }}
              transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
            >
              <RefreshCw className={iconClass} />
            </motion.button>
            <button
              onClick={() => {
                setSuggestOpen(!suggestOpen);
                setTimeout(() => inputRef.current?.focus(), 100);
              }}
              className={`${btnClass} ${suggestOpen ? 'bg-secondary text-accent' : ''}`}
              aria-label="Thema einreichen"
            >
              {suggestOpen ? <X className={iconClass} /> : <Plus className={iconClass} />}
            </button>
            <ShareMenu topic={topics[0]?.topic || ""} />
            <ThemeToggle />
            <button
              onClick={() => navigate("/archiv")}
              className={btnClass}
              aria-label="Archiv"
            >
              <Archive className={iconClass} />
            </button>
            <button
              onClick={() => navigate("/statistik")}
              className={btnClass}
              aria-label="Statistiken"
            >
              <BarChart3 className={iconClass} />
            </button>
            <button
              onClick={() => navigate("/")}
              className={btnClass}
              aria-label="Info"
            >
              <Info className={iconClass} />
            </button>
          </div>
        </div>

        <AnimatePresence>
          {suggestOpen && (
            <motion.div
              className="px-3 md:px-5 pb-2.5"
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
            >
              <div className="flex items-center gap-2">
                <input
                  ref={inputRef}
                  type="url"
                  value={suggestUrl}
                  onChange={(e) => setSuggestUrl(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleSuggestSubmit()}
                  placeholder="Link zum Artikel einfügen…"
                  disabled={submitting}
                  className="flex-1 px-3 py-2 rounded-full bg-card border border-border text-sm text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:ring-2 focus:ring-accent/40 transition-all disabled:opacity-50"
                />
                <button
                  onClick={handleSuggestSubmit}
                  disabled={submitting || !suggestUrl.trim()}
                  className="p-2 rounded-full bg-primary text-primary-foreground hover:opacity-90 active:scale-95 transition-all disabled:opacity-50"
                >
                  {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                </button>
              </div>
              {submitting && (
                <p className="text-[10px] text-muted-foreground mt-1.5 text-center">
                  Wird analysiert & geprüft…
                </p>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </header>

      {/* Scrollable topic list */}
      <section className="py-6 md:py-16 px-3 md:px-6">
        <div className="max-w-5xl mx-auto">
          {topics.map((t, i) => (
            <TopicCard
              key={t.id || `${t.topic}-${i}`}
              id={t.id}
              topic={t.topic}
              tagType={t.tagType}
              category={t.category}
              leftView={t.leftView}
              rightView={t.rightView}
              mitteView={t.mitteView}
              index={i}
              isTopicOfTheWeek={!!t.id && t.id === topicOfTheWeekId}
            />
          ))}
        </div>
      </section>

      {/* Track app views silently */}
      <ViewCounter page="app" trackOnly />
    </div>
  );
};

export default AppView;
