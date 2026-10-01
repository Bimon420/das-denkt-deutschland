// WOFÜR STIMME ICH? (01.10.2026, Simon: „ich muss genau wissen, wofür ich entscheide")
//
// Unter dem Regler stand nur „← Links · Mitte · Rechts →". Was „links" bei DIESEM Thema heißt,
// stand oben auf der Karte — und auf der Bürgervoting-Seite gar nicht, dort gibt es nur den Titel.
// Jetzt steht beim Abstimmen da, wofür die aktuelle Reglerstellung steht: links die linke Position,
// rechts die rechte, dazwischen der Mitte-Text. Beide Pole bleiben kurz sichtbar.
// Schwellen wie die Reglerbeschriftung (getLabel): ≤15 klar links, ≤35 eher links, >85 klar rechts.
interface Props {
  wert: number;
  links?: string | null;
  rechts?: string | null;
  mitte?: string | null;
}

const kurz = (t: string, n: number) => (t.length > n ? t.slice(0, n - 1).trimEnd() + "…" : t);

const WofuerStimme = ({ wert, links, rechts, mitte }: Props) => {
  if (!links && !rechts) return null;
  const seite = wert <= 35 ? "links" : wert >= 65 ? "rechts" : "mitte";
  const text = seite === "links" ? links : seite === "rechts" ? rechts : mitte || null;
  const titel =
    seite === "links" ? (wert <= 15 ? "Du stimmst klar für" : "Du neigst zu")
    : seite === "rechts" ? (wert > 85 ? "Du stimmst klar für" : "Du neigst zu")
    : "Du stehst dazwischen";
  return (
    <div className="mt-3 space-y-2">
      <div
        className={`rounded-lg px-3 py-2 text-xs leading-snug border ${
          seite === "links" ? "border-left/40 bg-left-light/60" : seite === "rechts" ? "border-right-red/40 bg-right-light/60" : "border-border bg-secondary/40"
        }`}
        aria-live="polite"
      >
        <span className="font-semibold">{titel}: </span>
        <span className="text-foreground/85">
          {text ? kurz(text, 220) : "beide Seiten haben einen Punkt — weder die linke noch die rechte Position ganz."}
        </span>
      </div>
      <div className="grid grid-cols-2 gap-2 text-[10px] leading-snug text-muted-foreground">
        {links && <p><span className="font-semibold text-left-blue">← Links:</span> {kurz(links, 70)}</p>}
        {rechts && <p className="text-right"><span className="font-semibold text-right-red">Rechts →:</span> {kurz(rechts, 70)}</p>}
      </div>
    </div>
  );
};

export default WofuerStimme;
