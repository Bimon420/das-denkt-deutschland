import { motion } from "framer-motion";
import { Bell, RefreshCw, Plus, Share2, Sun, Archive, Vote, Landmark, BarChart3, Info } from "lucide-react";

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

const buttons = [
  { icon: Bell, label: "Benachrichtigungen", desc: "Neue Themen sofort sehen — optional mit Push-Benachrichtigung." },
  { icon: RefreshCw, label: "Aktualisieren", desc: "Themen neu laden und Reihenfolge zufällig mischen." },
  { icon: Plus, label: "Thema einreichen", desc: "Einen Artikel-Link vorschlagen — wird automatisch geprüft und aufbereitet." },
  { icon: Share2, label: "Teilen", desc: "Das aktuelle Thema per Link, WhatsApp oder Social Media teilen." },
  { icon: Sun, label: "Dark/Light Mode", desc: "Zwischen hellem und dunklem Design wechseln." },
  { icon: Archive, label: "Archiv", desc: "Alle bisherigen Themen thematisch gruppiert durchsuchen." },
  { icon: Vote, label: "Bürgervoting", desc: "Anonym zu politischen Themen abstimmen — der Deutsch-Vote-Score." },
  { icon: Landmark, label: "Parteien", desc: "Alle Positionen nach Partei sortiert auf einen Blick." },
  { icon: BarChart3, label: "Statistik", desc: "Redaktionelle Kennzahlen und Transparenz-Daten." },
  { icon: Info, label: "Info / Intro", desc: "Zurück zu dieser Erklärungsseite." },
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

        <div className="grid md:grid-cols-3 gap-4 mb-16">
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

        {/* Button Guide */}
        <motion.div
          className="text-center mb-6"
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.3 }}
          transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
        >
          <h3 className="font-editorial text-2xl md:text-3xl font-bold mb-2">
            Die Funktionen im Überblick
          </h3>
          <p className="text-sm text-muted-foreground">
            Jeder Button in der App erklärt — von links nach rechts.
          </p>
        </motion.div>

        <div className="space-y-2">
          {buttons.map((b, i) => (
            <motion.div
              key={b.label}
              className="flex items-start gap-4 p-4 rounded-xl bg-card border border-border/40"
              initial={{ opacity: 0, x: -12 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true, amount: 0.2 }}
              transition={{ delay: i * 0.04, duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
            >
              <div className="w-9 h-9 rounded-lg bg-secondary flex items-center justify-center flex-shrink-0 mt-0.5">
                <b.icon className="w-4 h-4 text-foreground" />
              </div>
              <div className="min-w-0">
                <h4 className="font-body font-bold text-sm">{b.label}</h4>
                <p className="text-xs text-muted-foreground leading-relaxed mt-0.5">{b.desc}</p>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default IntroSection;
