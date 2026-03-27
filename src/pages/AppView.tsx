import { useState, useRef } from "react";
import ViewCounter from "@/components/ViewCounter";
import { motion, AnimatePresence } from "framer-motion";
import { useTopics } from "@/hooks/useTopics";
import TopicCard from "@/components/TopicCard";
import ShareMenu from "@/components/ShareMenu";
import ThemeToggle from "@/components/ThemeToggle";
import { Info, Archive, Loader2, RefreshCw, Plus, Send, X } from "lucide-react";
import { useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

const AppView = () => {
  const { data: topics = [], isLoading, isFetching } = useTopics();
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

  return (
    <div className="min-h-screen bg-background">
      {/* Sticky header */}
      <header className="sticky top-0 z-30 flex items-center justify-between px-3 md:px-5 py-2.5 md:py-3 border-b border-border/40 bg-background/90 backdrop-blur-xl">
        <div className="flex items-center gap-2 min-w-0">
          <img src="/logo.png" alt="DDD" className="w-auto flex-shrink-0" style={{ height: '1.5rem' }} />
          <span className="font-body text-xs md:text-sm font-extrabold tracking-tight uppercase truncate">Das Denkt Deutschland</span>
        </div>
        <div className="flex items-center gap-0.5">
          <motion.button
            onClick={handleRefresh}
            disabled={spinning || isFetching}
            className="p-2 rounded-full hover:bg-secondary transition-all duration-200 active:scale-95 disabled:opacity-50"
            aria-label="Aktualisieren"
            animate={{ rotate: spinning ? 360 : 0 }}
            transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
          >
            <RefreshCw className="w-4 h-4 text-muted-foreground" />
          </motion.button>
          <button
            onClick={() => setSuggestOpen(true)}
            className="p-2 rounded-full hover:bg-secondary transition-all duration-200 active:scale-95"
            aria-label="Thema einreichen"
          >
            <Plus className="w-4 h-4 text-muted-foreground" />
          </button>
          <ShareMenu topic={topics[0]?.topic || ""} />
          <ThemeToggle />
          <button
            onClick={() => navigate("/archiv")}
            className="p-2 rounded-full hover:bg-secondary transition-all duration-200 active:scale-95"
            aria-label="Archiv"
          >
            <Archive className="w-4 h-4 text-muted-foreground" />
          </button>
          <button
            onClick={() => navigate("/")}
            className="p-2 rounded-full hover:bg-secondary transition-all duration-200 active:scale-95"
            aria-label="Info"
          >
            <Info className="w-4 h-4 text-muted-foreground" />
          </button>
        </div>
      </header>

      {/* Scrollable topic list */}
      <section className="py-10 md:py-16 px-5 md:px-6">
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
            />
          ))}
        </div>

        {/* Suggest topic */}
        <SuggestTopicForm open={suggestOpen} onOpenChange={setSuggestOpen} />
      </section>

      {/* Track app views silently */}
      <ViewCounter page="app" trackOnly />
    </div>
  );
};

export default AppView;
