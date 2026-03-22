import { motion } from "framer-motion";

const Hero = () => {
  return (
    <section className="relative min-h-screen flex items-center justify-center overflow-hidden">
      {/* Split background */}
      <div className="absolute inset-0 flex">
        <motion.div
          className="w-1/2 bg-left-light"
          initial={{ x: "-100%" }}
          animate={{ x: 0 }}
          transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
        />
        <motion.div
          className="w-1/2 bg-right-light"
          initial={{ x: "100%" }}
          animate={{ x: 0 }}
          transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
        />
      </div>

      {/* Center divider line */}
      <motion.div
        className="absolute left-1/2 top-0 bottom-0 w-px bg-mitte"
        initial={{ scaleY: 0 }}
        animate={{ scaleY: 1 }}
        transition={{ delay: 0.6, duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
        style={{ transformOrigin: "top" }}
      />

      {/* Content */}
      <div className="relative z-10 text-center max-w-5xl mx-auto px-6">
        <motion.div
          initial={{ opacity: 0, y: 30, filter: "blur(8px)" }}
          animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
          transition={{ delay: 0.4, duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
        >
          <h1 className="font-editorial text-5xl md:text-7xl lg:text-8xl font-bold tracking-tight leading-[0.95]">
            DAS DENKT
            <br />
            <span className="text-mitte-gold">DEUTSCHLAND</span>
          </h1>
        </motion.div>

        <motion.p
          className="mt-8 text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto font-body"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.7, duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
        >
          Beide Seiten. Alle Quellen. Keine versteckten Agenden.
          <br />
          <span className="text-foreground font-medium">
            Weil die Wahrheit in der Mitte liegt.
          </span>
        </motion.p>

        {/* Left / Right labels */}
        <motion.div
          className="mt-12 flex justify-between items-center max-w-lg mx-auto"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1.0, duration: 0.6 }}
        >
          <div className="flex-1 flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-left" />
            <span className="text-left font-medium text-sm tracking-wide uppercase">Links</span>
          </div>
          <motion.div
            className="flex items-center gap-2 px-4 py-1.5 rounded-full bg-mitte-light border border-mitte"
            animate={{ boxShadow: ["0 0 0 0 hsla(42,90%,55%,0.3)", "0 0 0 10px hsla(42,90%,55%,0)", "0 0 0 0 hsla(42,90%,55%,0.3)"] }}
            transition={{ duration: 2.5, repeat: Infinity }}
          >
            <span className="text-mitte-gold font-semibold text-sm tracking-wide uppercase">Die Mitte</span>
          </motion.div>
          <div className="flex-1 flex items-center gap-2 justify-end">
            <span className="text-right font-medium text-sm tracking-wide uppercase">Rechts</span>
            <div className="w-3 h-3 rounded-full bg-right-red" />
          </div>
        </motion.div>

        {/* Scroll indicator */}
        <motion.div
          className="mt-16"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1.4, duration: 0.6 }}
        >
          <motion.div
            className="w-6 h-10 rounded-full border-2 border-foreground/20 mx-auto flex justify-center pt-2"
            animate={{ y: [0, 6, 0] }}
            transition={{ duration: 1.8, repeat: Infinity, ease: "easeInOut" }}
          >
            <div className="w-1 h-2 rounded-full bg-mitte" />
          </motion.div>
        </motion.div>
      </div>
    </section>
  );
};

export default Hero;
