import { ArrowLeft } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";

const ImpressumPage = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-[100dvh] bg-background text-foreground">
      <header className="flex items-center gap-3 px-5 py-4 border-b border-border/40">
        <button
          onClick={() => navigate(-1)}
          className="p-2 rounded-full hover:bg-secondary transition-all duration-200 active:scale-95"
          aria-label="Zurück"
        >
          <ArrowLeft className="w-4 h-4 text-muted-foreground" />
        </button>
        <span className="font-body text-sm font-extrabold tracking-tight uppercase">Impressum</span>
      </header>

      <motion.main
        className="max-w-2xl mx-auto px-6 py-10 space-y-8"
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
      >
        <section>
          <h1 className="font-editorial text-2xl font-bold mb-6">Impressum</h1>
          <p className="text-sm text-muted-foreground mb-1">Angaben gemäß § 5 TMG</p>
        </section>

        <section className="space-y-1">
          <h2 className="text-sm font-semibold">Verantwortlich</h2>
          <p className="text-sm text-muted-foreground">Simon Krätschmer</p>
          <p className="text-sm text-muted-foreground">Spessartstraße 20</p>
          <p className="text-sm text-muted-foreground">14197 Berlin</p>
        </section>

        <section className="space-y-1">
          <h2 className="text-sm font-semibold">Kontakt</h2>
          <p className="text-sm text-muted-foreground">
            E-Mail:{" "}
            <a href="mailto:derbimon@gmail.com" className="text-accent hover:underline">
              derbimon@gmail.com
            </a>
          </p>
        </section>

        <section className="space-y-2">
          <h2 className="text-sm font-semibold">Haftungsausschluss</h2>
          <p className="text-xs text-muted-foreground/80 leading-relaxed">
            Die Inhalte dieser Seite wurden mit größter Sorgfalt erstellt. Für die Richtigkeit, Vollständigkeit und Aktualität der Inhalte kann jedoch keine Gewähr übernommen werden. Als Diensteanbieter sind wir gemäß § 7 Abs.1 TMG für eigene Inhalte auf diesen Seiten nach den allgemeinen Gesetzen verantwortlich.
          </p>
          <p className="text-xs text-muted-foreground/80 leading-relaxed">
            Nach §§ 8 bis 10 TMG sind wir als Diensteanbieter jedoch nicht verpflichtet, übermittelte oder gespeicherte fremde Informationen zu überwachen oder nach Umständen zu forschen, die auf eine rechtswidrige Tätigkeit hinweisen.
          </p>
        </section>

        <section className="space-y-2">
          <h2 className="text-sm font-semibold">Urheberrecht</h2>
          <p className="text-xs text-muted-foreground/80 leading-relaxed">
            Die durch den Seitenbetreiber erstellten Inhalte und Werke auf diesen Seiten unterliegen dem deutschen Urheberrecht. Die Vervielfältigung, Bearbeitung, Verbreitung und jede Art der Verwertung außerhalb der Grenzen des Urheberrechtes bedürfen der schriftlichen Zustimmung des jeweiligen Autors bzw. Erstellers.
          </p>
        </section>
      </motion.main>
    </div>
  );
};

export default ImpressumPage;
