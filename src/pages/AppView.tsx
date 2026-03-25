import { useState, useCallback } from "react";
import { motion, AnimatePresence, PanInfo } from "framer-motion";
import { useTopics } from "@/hooks/useTopics";
import SwipeCard from "@/components/SwipeCard";
import ShareMenu from "@/components/ShareMenu";
import ThemeToggle from "@/components/ThemeToggle";
import { ChevronUp, ChevronDown, Info, Archive, Loader2, RefreshCw } from "lucide-react";
import { useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";

const SWIPE_THRESHOLD = 60;

const variants = {
  enter: (dir: number) => ({
    y: dir > 0 ? 200 : -200,
    opacity: 0,
    scale: 0.96,
    filter: "blur(6px)",
  }),
  center: {
    y: 0,
    opacity: 1,
    scale: 1,
    filter: "blur(0px)",
  },
  exit: (dir: number) => ({
    y: dir > 0 ? -150 : 150,
    opacity: 0,
    scale: 0.97,
    filter: "blur(4px)",
  }),
};

const AppView = () => {
  const { data: topics = [], isLoading, isFetching } = useTopics();
  const [[current, direction], setCurrent] = useState([0, 0]);
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const handleRefresh = () => {
    queryClient.invalidateQueries({ queryKey: ["topics"] });
    setCurrent([0, 0]);
  };

  const paginate = useCallback(
    (dir: number) => {
      setCurrent(([prev]) => {
        const next = prev + dir;
        if (next < 0 || next >= topics.length) return [prev, 0];
        return [next, dir];
      });
    },
    [topics.length]
  );

  const handleDragEnd = (_: any, info: PanInfo) => {
    if (info.offset.y < -SWIPE_THRESHOLD) paginate(1);
    else if (info.offset.y > SWIPE_THRESHOLD) paginate(-1);
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

  const t = topics[current];
  const progress = ((current + 1) / topics.length) * 100;

  return (
    <div className="h-[100dvh] w-full bg-background flex flex-col overflow-hidden">
      {/* Progress bar */}
      <motion.div
        className="h-[2px] bg-accent origin-left z-30"
        initial={{ scaleX: 0 }}
        animate={{ scaleX: progress / 100 }}
        transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
      />

      {/* Top bar */}
      <header className="flex items-center justify-between px-5 py-3 border-b border-border/40 bg-background/90 backdrop-blur-xl z-20">
        <div className="flex items-center gap-2.5">
          <img src="/logo.png" alt="DDD" className="w-auto" style={{ height: '1.8rem' }} />
          <span className="font-body text-sm font-extrabold tracking-tight uppercase">Das Denkt Deutschland</span>
        </div>
        <div className="flex items-center gap-0.5">
          <button
            onClick={handleRefresh}
            disabled={isFetching}
            className="p-2 rounded-full hover:bg-secondary transition-all duration-200 active:scale-95 disabled:opacity-50"
            aria-label="Aktualisieren"
          >
            <RefreshCw className={`w-4 h-4 text-muted-foreground ${isFetching ? 'animate-spin' : ''}`} />
          </button>
          <ShareMenu topic={t.topic} />
          <ThemeToggle />
          <button
            onClick={() => navigate("/archiv")}
            className="p-2 rounded-full hover:bg-secondary transition-all duration-200 active:scale-95"
            aria-label="Archiv"
          >
            <Archive className="w-4 h-4 text-muted-foreground" />
          </button>
          <button
            onClick={() => navigate("/intro")}
            className="p-2 rounded-full hover:bg-secondary transition-all duration-200 active:scale-95"
            aria-label="Info"
          >
            <Info className="w-4 h-4 text-muted-foreground" />
          </button>
        </div>
      </header>

      {/* Card area */}
      <div className="flex-1 relative overflow-hidden">
        <AnimatePresence custom={direction} mode="popLayout">
          <motion.div
            key={current}
            custom={direction}
            variants={variants}
            initial="enter"
            animate="center"
            exit="exit"
            transition={{ duration: 0.55, ease: [0.16, 1, 0.3, 1] }}
            drag="y"
            dragConstraints={{ top: 0, bottom: 0 }}
            dragElastic={0.12}
            onDragEnd={handleDragEnd}
            className="absolute inset-0"
          >
            <SwipeCard
              topic={t.topic}
              tagType={t.tagType}
              leftView={t.leftView}
              rightView={t.rightView}
              mitteView={t.mitteView}
              index={current}
              total={topics.length}
            />
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Bottom nav */}
      <nav className="flex items-center justify-between px-5 py-3 border-t border-border/40 bg-background/90 backdrop-blur-xl z-20">
        <button
          onClick={() => paginate(-1)}
          disabled={current === 0}
          className="flex items-center gap-1.5 text-xs font-semibold text-muted-foreground disabled:opacity-20 hover:text-foreground transition-all duration-200 active:scale-95"
        >
          <ChevronUp className="w-4 h-4" />
          Zurück
        </button>

        {/* Dot indicators */}
        <div className="flex gap-1.5 items-center">
          {topics.map((_, i) => (
            <button
              key={i}
              onClick={() => setCurrent([i, i > current ? 1 : -1])}
              className="relative p-0.5 active:scale-90 transition-transform duration-150"
              aria-label={`Thema ${i + 1}`}
            >
              <motion.div
                className="rounded-full"
                animate={{
                  width: i === current ? 20 : 8,
                  height: 8,
                  backgroundColor: i === current
                    ? "hsl(var(--accent))"
                    : "hsl(var(--muted-foreground) / 0.25)",
                }}
                transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
              />
            </button>
          ))}
        </div>

        <button
          onClick={() => paginate(1)}
          disabled={current === topics.length - 1}
          className="flex items-center gap-1.5 text-xs font-semibold text-muted-foreground disabled:opacity-20 hover:text-foreground transition-all duration-200 active:scale-95"
        >
          Weiter
          <ChevronDown className="w-4 h-4" />
        </button>
      </nav>
    </div>
  );
};

export default AppView;
