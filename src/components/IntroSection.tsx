import { motion } from "framer-motion";
import { Shield, Eye, Scale } from "lucide-react";

const principles = [
  {
    icon: Eye,
    title: "100% Transparent",
    desc: "Jede Position mit Quellenangabe. Keine versteckte Agenda. Alles überprüfbar.",
  },
  {
    icon: Scale,
    title: "Beide Seiten",
    desc: "Links und Rechts gleichberechtigt dargestellt — mit allen Stärken und Schwächen.",
  },
  {
    icon: Shield,
    title: "Die Mitte stärken",
    desc: "Die Extreme sind laut. Die Vernunft ist leise. Wir geben ihr eine Stimme.",
  },
];

const IntroSection = () => {
  return (
    <section className="py-24 md:py-32 px-6">
      <div className="max-w-5xl mx-auto">
        <motion.div
          className="text-center mb-16"
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.3 }}
          transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
        >
          <h2 className="font-editorial text-3xl md:text-5xl font-bold mb-4">
            Wie funktioniert das?
          </h2>
          <p className="text-muted-foreground max-w-xl mx-auto">
            Ein Sicherheitscheck für politische Meinungen. Für alle, die verstehen wollen statt nur zu reagieren.
          </p>
        </motion.div>

        <div className="grid md:grid-cols-3 gap-8">
          {principles.map((p, i) => (
            <motion.div
              key={p.title}
              className="text-center p-8 rounded-xl bg-card shadow-sm hover:shadow-md transition-shadow duration-200"
              initial={{ opacity: 0, y: 24, filter: "blur(4px)" }}
              whileInView={{ opacity: 1, y: 0, filter: "blur(0px)" }}
              viewport={{ once: true, amount: 0.2 }}
              transition={{ delay: i * 0.1, duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
              whileHover={{ y: -4 }}
            >
              <div className="w-12 h-12 rounded-full bg-mitte-light flex items-center justify-center mx-auto mb-4">
                <p.icon className="w-5 h-5 text-mitte-gold" />
              </div>
              <h3 className="font-body font-semibold text-lg mb-2">{p.title}</h3>
              <p className="text-sm text-muted-foreground leading-relaxed">{p.desc}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default IntroSection;
