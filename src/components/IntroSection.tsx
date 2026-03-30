import { motion } from "framer-motion";

const principles = [
  {
    title: "100% Transparent",
    desc: "Jede Position mit Quellenangabe. Keine versteckte Agenda. Alles überprüfbar.",
  },
  {
    title: "Beide Seiten",
    desc: "Links und Rechts gleichberechtigt dargestellt — mit versteckten Bedeutungen und möglichen Risiken.",
  },
  {
    title: "Die Mitte stärken",
    desc: "Die Extreme sind laut. Die Vernunft ist leise. Wir geben ihr eine Stimme.",
  },
];

const IntroSection = () => {
  return (
    <section className="py-14 md:py-20 px-6">
      <div className="max-w-5xl mx-auto">
        <motion.div
          className="text-center mb-8"
          initial={{ opacity: 0, y: 20, filter: "blur(4px)" }}
          whileInView={{ opacity: 1, y: 0, filter: "blur(0px)" }}
          viewport={{ once: true, amount: 0.3 }}
          transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
        >
          <h2 className="font-editorial text-3xl md:text-5xl font-bold mb-3 leading-[1.1]">
            Wie funktioniert das?
          </h2>
          <p className="text-muted-foreground max-w-xl mx-auto leading-relaxed">
            Ein Sicherheitscheck für politische Meinungen. Für alle, die verstehen wollen statt nur zu reagieren.
          </p>
        </motion.div>

        <div className="grid md:grid-cols-3 gap-4">
          {principles.map((p, i) => (
            <motion.div
              key={p.title}
              className="text-center p-6 rounded-xl bg-card shadow-[0_1px_3px_0_hsl(var(--foreground)/0.04),0_4px_12px_-2px_hsl(var(--foreground)/0.06)] hover:shadow-[0_2px_6px_0_hsl(var(--foreground)/0.06),0_8px_24px_-4px_hsl(var(--foreground)/0.1)] transition-shadow duration-300"
              initial={{ opacity: 0, y: 20, filter: "blur(4px)" }}
              whileInView={{ opacity: 1, y: 0, filter: "blur(0px)" }}
              viewport={{ once: true, amount: 0.2 }}
              transition={{ delay: i * 0.08, duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
              whileHover={{ y: -3 }}
            >
              <h3 className="font-body font-bold text-lg mb-1.5">{p.title}</h3>
              <p className="text-sm text-muted-foreground leading-relaxed">{p.desc}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default IntroSection;
