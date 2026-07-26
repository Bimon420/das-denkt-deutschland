import { ArrowLeft } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";

const DatenschutzPage = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-[100dvh] bg-background text-foreground">
      <header className="flex items-center gap-3 px-5 py-4 border-b border-border/40">
        <button
          onClick={() => window.history.length > 1 ? navigate(-1) : navigate("/")}
          className="p-2 rounded-full hover:bg-secondary transition-all duration-200 active:scale-95"
          aria-label="Zurück"
        >
          <ArrowLeft className="w-4 h-4 text-muted-foreground" />
        </button>
        <span className="font-body text-sm font-extrabold tracking-tight uppercase">Datenschutz</span>
      </header>

      <motion.main
        className="max-w-2xl mx-auto px-6 py-10 space-y-8"
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
      >
        <section>
          <h1 className="font-editorial text-2xl font-bold mb-6">Datenschutzerklärung</h1>
        </section>

        <section className="space-y-4">
          <h2 className="text-base font-semibold">1. Datenschutz auf einen Blick</h2>

          <div className="space-y-3">
            <h3 className="text-sm font-semibold">Allgemeine Hinweise</h3>
            <p className="text-xs text-muted-foreground/80 leading-relaxed">
              Die folgenden Hinweise geben einen einfachen Überblick darüber, was mit Ihren personenbezogenen Daten passiert, wenn Sie diese Website besuchen. Personenbezogene Daten sind alle Daten, mit denen Sie persönlich identifiziert werden können. Ausführliche Informationen zum Thema Datenschutz entnehmen Sie unserer unter diesem Text aufgeführten Datenschutzerklärung.
            </p>
          </div>

          <div className="space-y-3">
            <h3 className="text-sm font-semibold">Datenerfassung auf dieser Website</h3>
            <h4 className="text-xs font-semibold text-muted-foreground">Wer ist verantwortlich für die Datenerfassung auf dieser Website?</h4>
            <p className="text-xs text-muted-foreground/80 leading-relaxed">
              Die Datenverarbeitung auf dieser Website erfolgt durch den Websitebetreiber. Dessen Kontaktdaten können Sie dem Abschnitt „Hinweis zur Verantwortlichen Stelle" in dieser Datenschutzerklärung entnehmen.
            </p>

            <h4 className="text-xs font-semibold text-muted-foreground">Wie erfassen wir Ihre Daten?</h4>
            <p className="text-xs text-muted-foreground/80 leading-relaxed">
              Ihre Daten werden zum einen dadurch erhoben, dass Sie uns diese mitteilen. Hierbei kann es sich z.&nbsp;B. um Daten handeln, die Sie in ein Kontaktformular eingeben.
            </p>
            <p className="text-xs text-muted-foreground/80 leading-relaxed">
              Andere Daten werden automatisch oder nach Ihrer Einwilligung beim Besuch der Website durch unsere IT-Systeme erfasst. Das sind vor allem technische Daten (z.&nbsp;B. Internetbrowser, Betriebssystem oder Uhrzeit des Seitenaufrufs). Die Erfassung dieser Daten erfolgt automatisch, sobald Sie diese Website betreten.
            </p>

            <h4 className="text-xs font-semibold text-muted-foreground">Wofür nutzen wir Ihre Daten?</h4>
            <p className="text-xs text-muted-foreground/80 leading-relaxed">
              Ein Teil der Daten wird erhoben, um eine fehlerfreie Bereitstellung der Website zu gewährleisten. Andere Daten können zur Analyse Ihres Nutzerverhaltens verwendet werden.
            </p>

            <h4 className="text-xs font-semibold text-muted-foreground">Welche Rechte haben Sie bezüglich Ihrer Daten?</h4>
            <p className="text-xs text-muted-foreground/80 leading-relaxed">
              Sie haben jederzeit das Recht, unentgeltlich Auskunft über Herkunft, Empfänger und Zweck Ihrer gespeicherten personenbezogenen Daten zu erhalten. Sie haben außerdem ein Recht, die Berichtigung oder Löschung dieser Daten zu verlangen. Wenn Sie eine Einwilligung zur Datenverarbeitung erteilt haben, können Sie diese Einwilligung jederzeit für die Zukunft widerrufen. Außerdem haben Sie das Recht, unter bestimmten Umständen die Einschränkung der Verarbeitung Ihrer personenbezogenen Daten zu verlangen. Des Weiteren steht Ihnen ein Beschwerderecht bei der zuständigen Aufsichtsbehörde zu.
            </p>
            <p className="text-xs text-muted-foreground/80 leading-relaxed">
              Hierzu sowie zu weiteren Fragen zum Thema Datenschutz können Sie sich jederzeit an uns wenden.
            </p>
          </div>
        </section>

        <section className="space-y-4">
          <h2 className="text-base font-semibold">2. Hosting</h2>
          <div className="space-y-3">
            <h3 className="text-sm font-semibold">Externes Hosting</h3>
            <p className="text-xs text-muted-foreground/80 leading-relaxed">
              Diese Website wird extern gehostet. Die personenbezogenen Daten, die auf dieser Website erfasst werden, werden auf den Servern des Hosters gespeichert. Hierbei kann es sich v.&nbsp;a. um IP-Adressen, Kontaktanfragen, Meta- und Kommunikationsdaten, Vertragsdaten, Kontaktdaten, Namen, Websitezugriffe und sonstige Daten, die über eine Website generiert werden, handeln.
            </p>
            <p className="text-xs text-muted-foreground/80 leading-relaxed">
              Das externe Hosting erfolgt zum Zwecke der Vertragserfüllung gegenüber unseren potenziellen und bestehenden Kunden (Art. 6 Abs. 1 lit. b DSGVO) und im Interesse einer sicheren, schnellen und effizienten Bereitstellung unseres Online-Angebots durch einen professionellen Anbieter (Art. 6 Abs. 1 lit. f DSGVO).
            </p>
            <p className="text-xs text-muted-foreground/80 leading-relaxed">
              Wir setzen folgenden Hoster ein:
            </p>
            <p className="text-xs text-muted-foreground/80 leading-relaxed">
              Vercel Inc.<br />
              340 S Lemon Ave #4133<br />
              Walnut, CA 91789<br />
              USA
            </p>
          </div>
        </section>

        <section className="space-y-4">
          <h2 className="text-base font-semibold">3. Allgemeine Hinweise und Pflichtinformationen</h2>

          <div className="space-y-3">
            <h3 className="text-sm font-semibold">Datenschutz</h3>
            <p className="text-xs text-muted-foreground/80 leading-relaxed">
              Die Betreiber dieser Seiten nehmen den Schutz Ihrer persönlichen Daten sehr ernst. Wir behandeln Ihre personenbezogenen Daten vertraulich und entsprechend den gesetzlichen Datenschutzvorschriften sowie dieser Datenschutzerklärung.
            </p>
            <p className="text-xs text-muted-foreground/80 leading-relaxed">
              Wir weisen darauf hin, dass die Datenübertragung im Internet (z.&nbsp;B. bei der Kommunikation per E-Mail) Sicherheitslücken aufweisen kann. Ein lückenloser Schutz der Daten vor dem Zugriff durch Dritte ist nicht möglich.
            </p>
          </div>

          <div className="space-y-3">
            <h3 className="text-sm font-semibold">Hinweis zur verantwortlichen Stelle</h3>
            <p className="text-xs text-muted-foreground/80 leading-relaxed">
              Die verantwortliche Stelle für die Datenverarbeitung auf dieser Website ist:
            </p>
            <p className="text-xs text-muted-foreground/80 leading-relaxed">
              Simon Krätschmer<br />
              Spessartstraße 20<br />
              14197 Berlin
            </p>
            <p className="text-xs text-muted-foreground/80 leading-relaxed">
              E-Mail:{" "}
              <a href="mailto:derbimon@gmail.com" className="text-accent hover:underline">
                derbimon@gmail.com
              </a>
            </p>
          </div>

          <div className="space-y-3">
            <h3 className="text-sm font-semibold">Speicherdauer</h3>
            <p className="text-xs text-muted-foreground/80 leading-relaxed">
              Soweit innerhalb dieser Datenschutzerklärung keine speziellere Speicherdauer genannt wurde, verbleiben Ihre personenbezogenen Daten bei uns, bis der Zweck für die Datenverarbeitung entfällt. Wenn Sie ein berechtigtes Löschersuchen geltend machen oder eine Einwilligung zur Datenverarbeitung widerrufen, werden Ihre Daten gelöscht, sofern wir keine anderen rechtlich zulässigen Gründe für die Speicherung Ihrer personenbezogenen Daten haben (z.&nbsp;B. steuer- oder handelsrechtliche Aufbewahrungsfristen); im letztgenannten Fall erfolgt die Löschung nach Fortfall dieser Gründe.
            </p>
          </div>

          <div className="space-y-3">
            <h3 className="text-sm font-semibold">Allgemeine Hinweise zu den Rechtsgrundlagen der Datenverarbeitung auf dieser Website</h3>
            <p className="text-xs text-muted-foreground/80 leading-relaxed">
              Sofern Sie in die Datenverarbeitung eingewilligt haben, verarbeiten wir Ihre personenbezogenen Daten auf Grundlage von Art. 6 Abs. 1 lit. a DSGVO bzw. Art. 9 Abs. 2 lit. a DSGVO, sofern besondere Datenkategorien nach Art. 9 Abs. 1 DSGVO verarbeitet werden.
            </p>
          </div>

          <div className="space-y-3">
            <h3 className="text-sm font-semibold">Empfänger von personenbezogenen Daten</h3>
            <p className="text-xs text-muted-foreground/80 leading-relaxed">
              Im Rahmen unserer Geschäftstätigkeit arbeiten wir mit verschiedenen externen Stellen zusammen. Dabei ist teilweise auch eine Übermittlung von personenbezogenen Daten an diese externen Stellen erforderlich. Wir geben personenbezogene Daten nur dann an externe Stellen weiter, wenn dies im Rahmen einer Vertragserfüllung erforderlich ist, wenn wir gesetzlich hierzu verpflichtet sind, wenn wir ein berechtigtes Interesse nach Art. 6 Abs. 1 lit. f DSGVO an der Weitergabe haben oder wenn eine sonstige Rechtsgrundlage die Datenweitergabe erlaubt.
            </p>
          </div>

          <div className="space-y-3">
            <h3 className="text-sm font-semibold">Widerruf Ihrer Einwilligung zur Datenverarbeitung</h3>
            <p className="text-xs text-muted-foreground/80 leading-relaxed">
              Viele Datenverarbeitungsvorgänge sind nur mit Ihrer ausdrücklichen Einwilligung möglich. Sie können eine bereits erteilte Einwilligung jederzeit widerrufen. Die Rechtmäßigkeit der bis zum Widerruf erfolgten Datenverarbeitung bleibt vom Widerruf unberührt.
            </p>
          </div>

          <div className="space-y-3">
            <h3 className="text-sm font-semibold">Widerspruchsrecht gegen die Datenerhebung in besonderen Fällen sowie gegen Direktwerbung (Art. 21 DSGVO)</h3>
            <p className="text-xs text-muted-foreground/80 leading-relaxed font-medium">
              Wenn die Datenverarbeitung auf Grundlage von Art. 6 Abs. 1 lit. e oder f DSGVO erfolgt, haben Sie jederzeit das Recht, aus Gründen, die sich aus Ihrer besonderen Situation ergeben, gegen die Verarbeitung Ihrer personenbezogenen Daten Widerspruch einzulegen; dies gilt auch für ein auf diese Bestimmungen gestütztes Profiling.
            </p>
            <p className="text-xs text-muted-foreground/80 leading-relaxed font-medium">
              Werden Ihre personenbezogenen Daten verarbeitet, um Direktwerbung zu betreiben, so haben Sie das Recht, jederzeit Widerspruch gegen die Verarbeitung Sie betreffender personenbezogener Daten zum Zwecke derartiger Werbung einzulegen; dies gilt auch für das Profiling, soweit es mit solcher Direktwerbung in Verbindung steht.
            </p>
          </div>

          <div className="space-y-3">
            <h3 className="text-sm font-semibold">Beschwerderecht bei der zuständigen Aufsichtsbehörde</h3>
            <p className="text-xs text-muted-foreground/80 leading-relaxed">
              Im Falle von Verstößen gegen die DSGVO steht den Betroffenen ein Beschwerderecht bei einer Aufsichtsbehörde, insbesondere in dem Mitgliedstaat ihres gewöhnlichen Aufenthalts, ihres Arbeitsplatzes oder des Orts des mutmaßlichen Verstoßes zu.
            </p>
          </div>

          <div className="space-y-3">
            <h3 className="text-sm font-semibold">Recht auf Datenübertragbarkeit</h3>
            <p className="text-xs text-muted-foreground/80 leading-relaxed">
              Sie haben das Recht, Daten, die wir auf Grundlage Ihrer Einwilligung oder in Erfüllung eines Vertrags automatisiert verarbeiten, an sich oder an einen Dritten in einem gängigen, maschinenlesbaren Format aushändigen zu lassen.
            </p>
          </div>

          <div className="space-y-3">
            <h3 className="text-sm font-semibold">Auskunft, Berichtigung und Löschung</h3>
            <p className="text-xs text-muted-foreground/80 leading-relaxed">
              Sie haben im Rahmen der geltenden gesetzlichen Bestimmungen jederzeit das Recht auf unentgeltliche Auskunft über Ihre gespeicherten personenbezogenen Daten, deren Herkunft und Empfänger und den Zweck der Datenverarbeitung und ggf. ein Recht auf Berichtigung oder Löschung dieser Daten.
            </p>
          </div>

          <div className="space-y-3">
            <h3 className="text-sm font-semibold">Recht auf Einschränkung der Verarbeitung</h3>
            <p className="text-xs text-muted-foreground/80 leading-relaxed">
              Sie haben das Recht, die Einschränkung der Verarbeitung Ihrer personenbezogenen Daten zu verlangen. Das Recht auf Einschränkung der Verarbeitung besteht in folgenden Fällen: Wenn Sie die Richtigkeit Ihrer bei uns gespeicherten personenbezogenen Daten bestreiten, wenn die Verarbeitung unrechtmäßig ist, wenn wir die Daten nicht mehr benötigen oder wenn Sie Widerspruch eingelegt haben.
            </p>
          </div>
        </section>

        <section className="space-y-4">
          <h2 className="text-base font-semibold">4. Datenerfassung auf dieser Website</h2>

          <div className="space-y-3">
            <h3 className="text-sm font-semibold">Cookies</h3>
            <p className="text-xs text-muted-foreground/80 leading-relaxed">
              Unsere Internetseiten verwenden so genannte „Cookies". Cookies sind kleine Datenpakete und richten auf Ihrem Endgerät keinen Schaden an. Sie werden entweder vorübergehend für die Dauer einer Sitzung (Session-Cookies) oder dauerhaft (permanente Cookies) auf Ihrem Endgerät gespeichert. Session-Cookies werden nach Ende Ihres Besuchs automatisch gelöscht. Permanente Cookies bleiben auf Ihrem Endgerät gespeichert, bis Sie diese selbst löschen oder eine automatische Löschung durch Ihren Webbrowser erfolgt.
            </p>
            <p className="text-xs text-muted-foreground/80 leading-relaxed">
              Cookies, die zur Durchführung des elektronischen Kommunikationsvorgangs, zur Bereitstellung bestimmter, von Ihnen erwünschter Funktionen oder zur Optimierung der Website erforderlich sind (notwendige Cookies), werden auf Grundlage von Art. 6 Abs. 1 lit. f DSGVO gespeichert, sofern keine andere Rechtsgrundlage angegeben wird.
            </p>
            <p className="text-xs text-muted-foreground/80 leading-relaxed">
              Sie können Ihren Browser so einstellen, dass Sie über das Setzen von Cookies informiert werden und Cookies nur im Einzelfall erlauben, die Annahme von Cookies für bestimmte Fälle oder generell ausschließen sowie das automatische Löschen der Cookies beim Schließen des Browsers aktivieren. Bei der Deaktivierung von Cookies kann die Funktionalität dieser Website eingeschränkt sein.
            </p>
          </div>
        </section>

        <section className="pt-4 border-t border-border/40">
          <p className="text-xs text-muted-foreground/60 leading-relaxed">
            Quelle:{" "}
            <a href="https://www.e-recht24.de" className="hover:underline" target="_blank" rel="noopener noreferrer">
              https://www.e-recht24.de
            </a>
          </p>
        </section>
      </motion.main>
    </div>
  );
};

export default DatenschutzPage;
