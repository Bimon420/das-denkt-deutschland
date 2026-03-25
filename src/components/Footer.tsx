import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import ViewCounter from "./ViewCounter";

const Footer = () => {
  return (
    <footer className="py-16 px-6 border-t border-border">
      <motion.div
        className="max-w-3xl mx-auto text-center"
        initial={{ opacity: 0, y: 16 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, amount: 0.3 }}
        transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
      >
        <h2 className="font-editorial text-2xl md:text-3xl font-bold mb-4">
          Die lauteste Stimme hat nicht immer recht.
        </h2>
        <p className="text-muted-foreground text-sm mb-8 max-w-lg mx-auto">
          DAS DENKT DEUTSCHLAND ist ein unabhängiges Projekt für politische Transparenz. 
          Keine Partei, keine Lobby, keine versteckte Agenda.
        </p>
        <div className="flex items-center justify-center gap-2 text-xs text-muted-foreground">
          <div className="w-2 h-2 rounded-full bg-left" />
          <span>—</span>
          <div className="w-2 h-2 rounded-full bg-mitte" />
          <span>—</span>
          <div className="w-2 h-2 rounded-full bg-right-red" />
        </div>
        <p className="mt-4 text-xs text-muted-foreground/60">
          © 2026 DAS DENKT DEUTSCHLAND. Alle Quellen öffentlich zugänglich.
        </p>
        <Link to="/impressum" className="mt-2 inline-block text-xs text-muted-foreground/40 hover:text-muted-foreground transition-colors">
          Impressum
        </Link>
      </motion.div>
    </footer>
  );
};

export default Footer;
