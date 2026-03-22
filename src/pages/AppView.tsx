import { useState, useCallback } from "react";
import { motion, AnimatePresence, PanInfo } from "framer-motion";
import { topics } from "@/data/topics";
import SwipeCard from "@/components/SwipeCard";
import { ChevronUp, ChevronDown, Info } from "lucide-react";
import { useNavigate } from "react-router-dom";

const SWIPE_THRESHOLD = 60;

const variants = {
  enter: (dir: number) => ({
    y: dir > 0 ? 300 : -300,
    opacity: 0,
    scale: 0.95,
    filter: "blur(6px)",
  }),
  center: {
    y: 0,
    opacity: 1,
    scale: 1,
    filter: "blur(0px)",
  },
  exit: (dir: number) => ({
    y: dir > 0 ? -200 : 200,
    opacity: 0,
    scale: 0.95,
    filter: "blur(4px)",
  }),
};

const AppView = () => {
  const [[current, direction], setCurrent] = useState([0, 0]);
  const navigate = useNavigate();

  const paginate = useCallback(
    (dir: number) => {
      setCurrent(([prev]) => {
        const next = prev + dir;
        if (next < 0 || next >= topics.length) return [prev, 0];
        return [next, dir];
      });
    },
    []
  );

  const handleDragEnd = (_: any, info: PanInfo) => {
    if (info.offset.y < -SWIPE_THRESHOLD) paginate(1);
    else if (info.offset.y > SWIPE_THRESHOLD) paginate(-1);
  };

  const t = topics[current];

  return (
    <div className="h-[100dvh] w-full bg-background flex flex-col overflow-hidden">
      {/* Top bar */}
      <header className="flex items-center justify-between px-5 py-3 border-b border-border/50 bg-background/90 backdrop-blur-md z-20">
        <div className="flex items-center gap-2">
          <div className="flex gap-0.5">
            <div className="w-2 h-4 rounded-sm bg-foreground" />
            <div className="w-2 h-4 rounded-sm bg-destructive" />
            <div className="w-2 h-4 rounded-sm bg-accent" />
          </div>
          <span className="font-editorial text-sm font-bold tracking-tight">DDT</span>
        </div>
        <button
          onClick={() => navigate("/intro")}
          className="p-2 rounded-full hover:bg-secondary transition-colors active:scale-95"
          aria-label="Info"
        >
          <Info className="w-4 h-4 text-muted-foreground" />
        </button>
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
            transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
            drag="y"
            dragConstraints={{ top: 0, bottom: 0 }}
            dragElastic={0.15}
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
      <nav className="flex items-center justify-between px-5 py-3 border-t border-border/50 bg-background/90 backdrop-blur-md z-20">
        <button
          onClick={() => paginate(-1)}
          disabled={current === 0}
          className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground disabled:opacity-30 hover:text-foreground transition-colors active:scale-95"
        >
          <ChevronUp className="w-4 h-4" />
          Zurück
        </button>

        {/* Dot indicators */}
        <div className="flex gap-2">
          {topics.map((_, i) => (
            <button
              key={i}
              onClick={() => setCurrent([i, i > current ? 1 : -1])}
              className={`w-2 h-2 rounded-full transition-all duration-300 active:scale-90 ${
                i === current
                  ? "bg-accent w-6"
                  : "bg-muted-foreground/30 hover:bg-muted-foreground/50"
              }`}
            />
          ))}
        </div>

        <button
          onClick={() => paginate(1)}
          disabled={current === topics.length - 1}
          className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground disabled:opacity-30 hover:text-foreground transition-colors active:scale-95"
        >
          Weiter
          <ChevronDown className="w-4 h-4" />
        </button>
      </nav>
    </div>
  );
};

export default AppView;
