// Umgebung für die DDD-Social-Pipeline: Pfade, Zugangsdaten, Schlüssel.
//
// Grundsatz: Geheimnisse werden NUR gelesen, nie ausgegeben und nie ins Protokoll
// geschrieben. Wer etwas meldet, meldet „vorhanden" / „fehlt", nie den Wert.
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

export const SOCIAL_DIR = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
export const PROJEKT_DIR = path.resolve(SOCIAL_DIR, "..");
export const AUSGABE_DIR = path.join(SOCIAL_DIR, "ausgabe");
export const SEITE = "https://dasdenktdeutschland.de";
export const SUPABASE_URL = "https://kkqxqnhwaallpliqkypl.supabase.co";

/** Liest eine .env-Datei (KEY=wert, # Kommentare) ohne etwas zu verändern. */
export function leseEnvDatei(datei) {
  const werte = {};
  if (!fs.existsSync(datei)) return werte;
  for (const zeile of fs.readFileSync(datei, "utf8").split(/\r?\n/)) {
    const m = zeile.match(/^\s*([A-Za-z_][A-Za-z0-9_]*)\s*=\s*(.*)\s*$/);
    if (!m) continue;
    let v = m[2];
    if ((v.startsWith('"') && v.endsWith('"')) || (v.startsWith("'") && v.endsWith("'"))) v = v.slice(1, -1);
    werte[m[1]] = v;
  }
  return werte;
}

let _zugang = null;
/** Zugangsdaten der Plattformen: nur aus social/.env.social (plus Prozess-Umgebung). */
export function zugang() {
  if (_zugang) return _zugang;
  const datei = leseEnvDatei(path.join(SOCIAL_DIR, ".env.social"));
  _zugang = (name) => {
    const v = process.env[name] ?? datei[name];
    return v && v.trim() ? v.trim() : null;
  };
  return _zugang;
}

/** Prüft, ob alle genannten Zugangswerte da sind; gibt die fehlenden NAMEN zurück. */
export function fehlendeZugaenge(namen) {
  const z = zugang();
  return namen.filter((n) => !z(n));
}

/**
 * Claude-Schlüssel suchen: Prozess-Umgebung → social/.env.social → Projekt-.env →
 * Nachbarprojekte, die denselben Schlüsselnamen führen. Gibt {schluessel, quelle} zurück,
 * die Quelle nur als Dateiname (für das Protokoll), nie den Wert.
 */
export function claudeSchluessel() {
  const z = zugang();
  if (z("ANTHROPIC_API_KEY")) return { schluessel: z("ANTHROPIC_API_KEY"), quelle: "env/.env.social" };
  const basis = path.resolve(PROJEKT_DIR, "..");
  const kandidaten = [
    path.join(PROJEKT_DIR, ".env"),
    path.join(PROJEKT_DIR, ".env.local"),
    path.join(basis, "monfetti", ".env.local"),
    path.join(basis, "warteschlange", ".env.local"),
    path.join(basis, "ki-pnp", ".env.local"),
    path.join(basis, "VOID", ".env.local"),
  ];
  for (const k of kandidaten) {
    const w = leseEnvDatei(k);
    if (w.ANTHROPIC_API_KEY) return { schluessel: w.ANTHROPIC_API_KEY, quelle: path.relative(basis, k) };
  }
  return { schluessel: null, quelle: null };
}

/**
 * Öffentlicher Lesezugang der Seite (Rolle „anon", derselbe Schlüssel, den jeder Browser
 * bekommt): zuerst aus .env.social (DDD_SUPABASE_ANON_KEY), sonst aus dem ausgelieferten
 * Bündel von dasdenktdeutschland.de gelesen — genau das, was das Frontend benutzt.
 */
export async function oeffentlicherSchluessel() {
  const z = zugang();
  if (z("DDD_SUPABASE_ANON_KEY")) return z("DDD_SUPABASE_ANON_KEY");
  const start = await fetch("https://www.dasdenktdeutschland.de/", { redirect: "follow" });
  const html = await start.text();
  const js = html.match(/\/assets\/index-[A-Za-z0-9_-]+\.js/);
  if (!js) throw new Error("Seitenbündel nicht gefunden (Startseite ohne /assets/index-*.js)");
  const quelle = await (await fetch("https://www.dasdenktdeutschland.de" + js[0])).text();
  for (const k of new Set(quelle.match(/eyJhbGciOiJIUzI1NiIs[A-Za-z0-9_\-.]+/g) || [])) {
    try {
      const nutz = JSON.parse(Buffer.from(k.split(".")[1], "base64url").toString("utf8"));
      // Nur den Browser-Schlüssel nehmen — ein anderer hätte im Bündel nichts verloren.
      if (nutz.role === "anon" && nutz.ref === "kkqxqnhwaallpliqkypl") return k;
    } catch { /* kein JWT */ }
  }
  throw new Error("Kein anon-Schlüssel im Seitenbündel gefunden");
}

/** Datum in Berlin als JJJJ-MM-TT. */
export function heuteBerlin(d = new Date()) {
  return new Intl.DateTimeFormat("sv-SE", { timeZone: "Europe/Berlin" }).format(d);
}

/** Versatz Berlin↔UTC in Minuten für einen Zeitpunkt (Sommer-/Winterzeit). */
function berlinVersatzMin(d) {
  const teil = new Intl.DateTimeFormat("en-US", { timeZone: "Europe/Berlin", timeZoneName: "longOffset" })
    .formatToParts(d).find((p) => p.type === "timeZoneName").value; // z. B. GMT+02:00
  const m = teil.match(/GMT([+-])(\d{2}):(\d{2})/);
  if (!m) return 0;
  return (m[1] === "-" ? -1 : 1) * (parseInt(m[2]) * 60 + parseInt(m[3]));
}

/** Berliner Wandzeit (Datum + Minuten seit Mitternacht) → Date. */
export function berlinZeitpunkt(datum, minuten) {
  const [j, mo, t] = datum.split("-").map(Number);
  const roh = Date.UTC(j, mo - 1, t, 0, minuten);
  const versatz = berlinVersatzMin(new Date(roh));
  return new Date(roh - versatz * 60000);
}

/** Date → ISO mit Berliner Versatz, z. B. 2026-10-01T10:10:00+02:00 (lesbar für Simon). */
export function isoBerlin(d) {
  const v = berlinVersatzMin(d);
  const lokal = new Date(d.getTime() + v * 60000).toISOString().slice(0, 19);
  const s = v >= 0 ? "+" : "-";
  const a = Math.abs(v);
  return `${lokal}${s}${String(Math.floor(a / 60)).padStart(2, "0")}:${String(a % 60).padStart(2, "0")}`;
}

export function vortag(datum) {
  const d = new Date(datum + "T12:00:00Z");
  d.setUTCDate(d.getUTCDate() - 1);
  return d.toISOString().slice(0, 10);
}

export function themenLink(id) {
  return `${SEITE}/thema/${id}`;
}

export function json(datei, wert) {
  fs.mkdirSync(path.dirname(datei), { recursive: true });
  fs.writeFileSync(datei, JSON.stringify(wert, null, 2) + "\n", "utf8");
}
