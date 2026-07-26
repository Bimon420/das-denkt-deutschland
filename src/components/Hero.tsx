import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { ArrowRight } from "lucide-react";

const Hero = () => {
  const navigate = useNavigate();
  return (
    <section className="relative min-h-screen flex items-center justify-center overflow-hidden bg-background">
      {/* Split background */}
      <div className="absolute inset-0 flex">
        <motion.div
          className="w-1/2 bg-left-light"
          initial={{ x: "-100%" }}
          animate={{ x: 0 }}
          transition={{ duration: 0.9, ease: [0.16, 1, 0.3, 1] }}
        />
        <motion.div
          className="w-1/2 bg-right-light"
          initial={{ x: "100%" }}
          animate={{ x: 0 }}
          transition={{ duration: 0.9, ease: [0.16, 1, 0.3, 1] }}
        />
      </div>

      {/* Subtle radial glow behind content in dark mode */}
      <div className="absolute inset-0 hidden dark:block pointer-events-none">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] rounded-full bg-accent/[0.06] blur-[120px]" />
      </div>

      {/* Center divider line */}
      <motion.div
        className="absolute left-1/2 top-0 bottom-0 w-px bg-accent/70 dark:bg-accent/40 dark:shadow-[0_0_8px_hsl(var(--accent)/0.2)]"
        initial={{ scaleY: 0, opacity: 0 }}
        animate={{ scaleY: 1, opacity: 1 }}
        transition={{ delay: 0.7, duration: 1, ease: [0.16, 1, 0.3, 1] }}
        style={{ transformOrigin: "top" }}
      />

      {/* Content */}
      <div className="relative z-10 text-center max-w-5xl mx-auto px-6">
        <motion.div
          initial={{ opacity: 0, y: 24, filter: "blur(8px)" }}
          animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
          transition={{ delay: 0.5, duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
        >
          <h1 className="font-editorial text-5xl md:text-7xl lg:text-8xl font-bold tracking-tight leading-[0.92]">
            DAS <span className="text-right">DENKT</span>
            <br />
            <span className="text-mitte-gold">DEUTSCHLAND</span>
          </h1>
        </motion.div>

        <motion.p
          className="mt-8 text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto font-body leading-relaxed"
          initial={{ opacity: 0, y: 16, filter: "blur(4px)" }}
          animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
          transition={{ delay: 0.8, duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
        >
          Beide Seiten. Alle Quellen. Keine versteckten Agenden.
          <br />
          <span className="text-foreground font-medium">
            Weil die Wahrheit in der Mitte liegt.
          </span>
        </motion.p>

        {/* Left / Right labels */}
        <motion.div
          className="mt-12 grid grid-cols-3 items-center max-w-md mx-auto"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1.1, duration: 0.6 }}
        >
          <motion.div
            className="justify-self-center flex items-center gap-2.5 px-4 py-2 rounded-full bg-card/60 dark:bg-card/80 backdrop-blur-sm border border-border/50 dark:border-border"
            initial={{ x: -20, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            transition={{ delay: 1.2, duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
          >
            <div className="w-2 h-2 rounded-full bg-foreground" />
            <span className="font-body font-bold text-[11px] tracking-[0.15em] uppercase text-foreground/80">Links</span>
          </motion.div>

          <motion.div
            className="justify-self-center flex items-center gap-2.5 px-4 py-2 rounded-full bg-card/60 dark:bg-card/80 backdrop-blur-sm border border-border/50 dark:border-border"
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ delay: 1.3, duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
          >
            <span className="font-body font-bold text-[11px] tracking-[0.15em] uppercase text-foreground/80">Die Mitte</span>
          </motion.div>

          <motion.div
            className="justify-self-center flex items-center gap-2.5 px-4 py-2 rounded-full bg-card/60 dark:bg-card/80 backdrop-blur-sm border border-border/50 dark:border-border"
            initial={{ x: 20, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            transition={{ delay: 1.2, duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
          >
            <span className="font-body font-bold text-[11px] tracking-[0.15em] uppercase text-foreground/80">Rechts</span>
            <div className="w-2 h-2 rounded-full bg-foreground" />
          </motion.div>
        </motion.div>

        {/* CTA Button */}
        <motion.button
          onClick={() => navigate("/app")}
          className="mt-12 inline-flex items-center gap-2 px-7 py-3.5 rounded-full bg-accent text-accent-foreground font-semibold text-sm tracking-wide shadow-[0_2px_8px_hsl(var(--accent)/0.3)] hover:shadow-[0_4px_16px_hsl(var(--accent)/0.4)] dark:shadow-[0_2px_12px_hsl(var(--accent)/0.25)] dark:hover:shadow-[0_4px_24px_hsl(var(--accent)/0.35)] transition-shadow duration-300 active:scale-[0.97]"
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 1.4, duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
          whileHover={{ scale: 1.03 }}
          whileTap={{ scale: 0.97 }}
        >
          Themen entdecken
          <ArrowRight className="w-4 h-4" />
        </motion.button>
      </div>
    </section>
  );
};

export default Hero;
