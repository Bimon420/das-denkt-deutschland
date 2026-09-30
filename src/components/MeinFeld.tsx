import { useState } from "react";
import { BEREICHE } from "@/lib/bereiche";

type Props = {
  angemeldet: boolean;
  mitgliedBis: string | null;
  bereiche: string[];
  laedt: boolean;
  onSpeichern: (neu: string[]) => Promise<boolean>;
  onAnmelden: (provider: "twitch" | "google") => void;
  onAbmelden: () => void;
};

// Simon 30.09.: „wer monverse mitglied ist kann themenbereiche angeben und bekommt ein sortiertes feld".
// Die Reihenfolge der Wahl ist die Reihenfolge im Feld.
const MeinFeld = ({ angemeldet, mitgliedBis, bereiche, laedt, onSpeichern, onAnmelden, onAbmelden }: Props) => {
  const [offen, setOffen] = useState(false);
  const [hinweis, setHinweis] = useState("");
  const chip = "px-3 py-2 min-h-[44px] rounded-full border text-sm transition-colors touch-manipulation";

  if (laedt) return null;

  if (!angemeldet) {
    return (
      <div className="max-w-5xl mx-auto mb-6 rounded-2xl border border-border bg-card p-4 text-sm">
        <p className="font-bold text-foreground">Dein Feld, sortiert nach deinen Themen</p>
        <p className="text-muted-foreground mt-1">MONVERSE-Mitglieder wählen ihre Themenbereiche und sehen die Debatten des Tages danach sortiert.</p>
        <div className="flex flex-wrap gap-2 mt-3">
          <button className={`${chip} bg-[#9146ff] text-white border-transparent font-bold`} onClick={() => onAnmelden("twitch")}>Mit Twitch anmelden</button>
          <button className={`${chip} border-border`} onClick={() => onAnmelden("google")}>Mit Google anmelden</button>
        </div>
        <p className="text-muted-foreground mt-2 text-xs">Mitglied wirst du z. B. mit einem Twitch-Abo bei MON — <a className="underline" href="https://monverse.fun/twitch">monverse.fun/twitch</a></p>
      </div>
    );
  }

  if (!mitgliedBis) {
    return (
      <div className="max-w-5xl mx-auto mb-6 rounded-2xl border border-border bg-card p-4 text-sm">
        <p className="font-bold text-foreground">Themenbereiche sind für MONVERSE-Mitglieder</p>
        <p className="text-muted-foreground mt-1">Du bist angemeldet, aber gerade kein Mitglied. Ein Twitch-Abo bei MON bringt dir einen Monat — einlösen auf <a className="underline" href="https://monverse.fun/twitch">monverse.fun/twitch</a>.</p>
        <button className="text-xs text-muted-foreground underline mt-2 min-h-[44px]" onClick={onAbmelden}>Abmelden</button>
      </div>
    );
  }

  const umschalten = async (id: string) => {
    const neu = bereiche.includes(id) ? bereiche.filter((b) => b !== id) : [...bereiche, id];
    const ok = await onSpeichern(neu);
    setHinweis(ok ? "Gespeichert." : "Speichern hat nicht geklappt — versuch es gleich noch einmal.");
  };

  return (
    <div className="max-w-5xl mx-auto mb-6 rounded-2xl border border-border bg-card p-4 text-sm">
      <button className="w-full flex items-center justify-between min-h-[44px] text-left" onClick={() => setOffen(!offen)} aria-expanded={offen}>
        <span className="font-bold text-foreground">Mein Feld {bereiche.length > 0 ? `· ${bereiche.length} ${bereiche.length === 1 ? "Bereich" : "Bereiche"}` : "· noch keine Bereiche"}</span>
        <span className="text-muted-foreground text-xs">{offen ? "schließen" : "anpassen"}</span>
      </button>
      {offen && (
        <>
          <p className="text-muted-foreground mt-1">Tipp deine Bereiche in der Reihenfolge an, in der du sie sehen willst.</p>
          <div className="flex flex-wrap gap-2 mt-3">
            {BEREICHE.map((b) => {
              const platz = bereiche.indexOf(b.id);
              return (
                <button key={b.id} onClick={() => umschalten(b.id)} aria-pressed={platz !== -1}
                        className={`${chip} ${platz !== -1 ? "bg-primary text-primary-foreground border-transparent" : "border-border text-foreground"}`}>
                  {platz !== -1 ? `${platz + 1}. ` : ""}{b.name}
                </button>
              );
            })}
          </div>
          <p className="text-xs text-muted-foreground mt-2 min-h-[1.2em]" role="status">{hinweis}</p>
          <p className="text-xs text-muted-foreground mt-1">MONVERSE-Mitglied bis {new Date(mitgliedBis).toLocaleDateString("de-DE")} · <button className="underline min-h-[44px]" onClick={onAbmelden}>Abmelden</button></p>
        </>
      )}
    </div>
  );
};

export default MeinFeld;
