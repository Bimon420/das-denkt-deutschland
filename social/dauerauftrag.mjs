// DDD-Social Dauerauftrag — stündlich aufrufbar.
//
//   node social/dauerauftrag.mjs            TROCKEN: baut, zeigt Fälliges, sendet nichts
//   node social/dauerauftrag.mjs --echt     sendet fällige Posts (nur Plattformen mit Zugangsdaten)
//   Weitere Schalter: --nur bluesky,x · --ohne-bau · --ohne-ki · --jetzt 2026-10-01T14:40+02:00
//
// Ablauf je Lauf:
//   1. Sperre setzen (zwei gleichzeitige Läufe könnten sonst doppelt posten).
//   2. Bau (pipeline.mjs): neue Themen des Tages ergänzen; Fertiges bleibt unangetastet.
//   3. Jeden Post aus plan.json prüfen: noch nicht fällig · fällig · verpasst (> 3 h drüber).
//   4. Fällige senden; jede Entscheidung in ausgabe/<datum>/protokoll.jsonl festhalten.
//
// Doppelschutz: Vor dem Senden wird „begonnen" geschrieben. Steht im Protokoll ein
// „begonnen" ohne Ergebnis (Absturz, Netz weg), wird dieser Post NIE automatisch wiederholt —
// lieber einer zu wenig als einer doppelt. Er erscheint als „unklar" zur Handprüfung.
import fs from "node:fs";
import path from "node:path";
import { AUSGABE_DIR, heuteBerlin, isoBerlin, fehlendeZugaenge } from "./lib/umgebung.mjs";
import { bauen } from "./pipeline.mjs";
import * as bluesky from "./adapter/bluesky.mjs";
import * as x from "./adapter/x.mjs";
import * as facebook from "./adapter/facebook.mjs";
import * as instagram from "./adapter/instagram.mjs";
import * as tiktok from "./adapter/tiktok.mjs";

const ADAPTER = { x, bluesky, facebook, instagram, tiktok };
const SPAETESTENS_MS = 3 * 3600 * 1000; // so lange darf ein Post nach seiner Zeit noch raus
const MAX_FEHLVERSUCHE = 3;

const a = process.argv.slice(2);
const wert = (n) => { const i = a.indexOf(n); return i >= 0 ? a[i + 1] : undefined; };
const echt = a.includes("--echt");
const modus = echt ? "echt" : "trocken";
const jetzt = wert("--jetzt") ? new Date(wert("--jetzt")) : new Date();
const nur = wert("--nur") ? wert("--nur").split(",") : null;
const datum = heuteBerlin(jetzt);
const dir = path.join(AUSGABE_DIR, datum);
fs.mkdirSync(dir, { recursive: true });
const protokollDatei = path.join(dir, "protokoll.jsonl");

function protokoll(eintrag) {
  fs.appendFileSync(protokollDatei, JSON.stringify({ zeit: isoBerlin(new Date()), modus, ...eintrag }) + "\n", "utf8");
}

// ── Sperre ────────────────────────────────────────────────────────────────────
const sperre = path.join(dir, ".sperre");
if (fs.existsSync(sperre)) {
  const alt = Date.now() - fs.statSync(sperre).mtimeMs;
  if (alt < 50 * 60000) { console.log(`[dauerauftrag] anderer Lauf aktiv (Sperre ${Math.round(alt / 60000)} min alt) — Ende`); process.exit(0); }
  console.log("[dauerauftrag] alte Sperre (> 50 min) übernommen");
}
fs.writeFileSync(sperre, String(process.pid));

let code = 0;
try {
  if (!a.includes("--ohne-bau")) {
    try { await bauen({ datum, jetzt, ohneKi: a.includes("--ohne-ki") }); }
    catch (e) { console.log("[dauerauftrag] Bau fehlgeschlagen:", e.message); protokoll({ status: "baufehler", grund: e.message }); code = 1; }
  }
  const planDatei = path.join(dir, "plan.json");
  if (!fs.existsSync(planDatei)) { console.log("[dauerauftrag] kein Plan für", datum); process.exit(code); }
  const plan = JSON.parse(fs.readFileSync(planDatei, "utf8"));

  // Protokoll lesen: Verlauf je Post-Schlüssel (nur Einträge des aktuellen Modus).
  const verlauf = {};
  if (fs.existsSync(protokollDatei)) {
    for (const z of fs.readFileSync(protokollDatei, "utf8").split("\n").filter(Boolean)) {
      try { const e = JSON.parse(z); if (e.schluessel && e.modus === modus) (verlauf[e.schluessel] ||= []).push(e); } catch { /* kaputte Zeile überspringen */ }
    }
  }
  const zaehler = {};
  const zaehle = (s) => (zaehler[s] = (zaehler[s] || 0) + 1);

  for (const post of plan.posts) {
    if (nur && !nur.includes(post.plattform)) continue;
    const v = verlauf[post.schluessel] || [];
    const letzter = v[v.length - 1];
    const basis = { schluessel: post.schluessel, plattform: post.plattform, thema_id: post.thema_id, geplant: post.zeit };

    if (v.some((e) => e.status === "gesendet")) { zaehle("schon gesendet"); continue; }
    if (v.some((e) => e.status === "verpasst" || e.status === "unklar")) { zaehle(letzter.status); continue; }
    if (letzter?.status === "begonnen") { protokoll({ ...basis, status: "unklar", grund: "begonnen ohne Ergebnis — von Hand prüfen, ob der Post existiert" }); zaehle("unklar"); continue; }
    if (v.filter((e) => e.status === "fehler").length >= MAX_FEHLVERSUCHE) { zaehle("aufgegeben"); continue; }
    if (!echt && letzter?.status === "trocken") { zaehle("trocken (schon vermerkt)"); continue; }

    const faellig = new Date(post.zeit).getTime();
    if (jetzt.getTime() < faellig) { zaehle("noch nicht fällig"); continue; }
    if (jetzt.getTime() > faellig + SPAETESTENS_MS) { protokoll({ ...basis, status: "verpasst", grund: "mehr als 3 h nach der geplanten Zeit" }); zaehle("verpasst"); continue; }

    const medium = path.join(dir, post.medium);
    const auftrag = { ...post, datum, bild: medium, video: medium };
    const adapter = ADAPTER[post.plattform];
    let ergebnis;
    const fehlt = fehlendeZugaenge(adapter.ZUGANG);
    if (fehlt.length) {
      ergebnis = { status: "übersprungen", grund: "Zugangsdaten fehlen: " + fehlt.join(", ") };
      // Nur einmal je Grund vermerken, nicht stündlich neu. Kommt der Zugang später, wird
      // der Post (solange er noch in seinem 3-h-Fenster liegt) ganz normal gesendet.
      if (!(letzter && letzter.status === "übersprungen" && letzter.grund === ergebnis.grund)) protokoll({ ...basis, ...ergebnis });
    } else {
      if (echt) protokoll({ ...basis, status: "begonnen" });
      try { ergebnis = await adapter.senden(auftrag, { echt }); }
      catch (e) { ergebnis = { status: "fehler", grund: e.message }; }
      protokoll({ ...basis, ...ergebnis });
    }
    zaehle(ergebnis.status);
    console.log(`[${post.plattform}] ${post.zeit.slice(11, 16)} ${ergebnis.status}${ergebnis.grund ? " — " + ergebnis.grund : ""}${ergebnis.url ? " " + ergebnis.url : ""}`);
  }
  console.log(`[dauerauftrag ${modus} ${isoBerlin(jetzt)}]`, JSON.stringify(zaehler));
  if (zaehler.fehler) code = 1;
} finally {
  fs.rmSync(sperre, { force: true }); // eigene Sperrdatei, kein Inhalt von Wert
}
process.exit(code);
