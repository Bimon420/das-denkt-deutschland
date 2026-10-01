// DDD-Social: Bau eines Tages — Themen lesen, Texte, Bild, Video, Zeitplan.
//
//   node social/pipeline.mjs                 heute, plant ab jetzt bis 21:00
//   node social/pipeline.mjs --ganzer-tag    plant 08:00–21:00, auch wenn es schon später ist
//   node social/pipeline.mjs --datum 2026-10-01 --ohne-ki
//
// Der Bau ist wiederholbar: Themen, die schon im Plan stehen, werden nicht neu gebaut.
// Kommen tagsüber neue Themen dazu (generate-topics läuft morgens UND abends), werden sie
// in die verbleibende Zeit bis 21:00 eingeplant. Ist es dafür zu spät (nach 20:30), bleiben
// sie ungeplant und laufen am nächsten Tag als „Nachzügler" mit. So fällt kein Thema heraus.
//
// Gesendet wird hier NICHTS — das macht dauerauftrag.mjs.
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { AUSGABE_DIR, heuteBerlin, berlinZeitpunkt, isoBerlin, vortag, themenLink, json } from "./lib/umgebung.mjs";
import { themenDesTages } from "./lib/themen.mjs";
import { texteFuerThema } from "./lib/texte.mjs";
import { baueBild, baueVideo, schliessen } from "./lib/darstellen.mjs";

export const FENSTER = { von: 8 * 60, bis: 21 * 60, letzterStart: 20 * 60 + 30 };
// Je Plattform leicht versetzt, damit nicht alles in derselben Minute erscheint.
export const VERSATZ = { x: 0, bluesky: 4, facebook: 9, instagram: 15, tiktok: 22 };

function minutenBerlin(d) {
  const [h, m] = new Intl.DateTimeFormat("de-DE", { timeZone: "Europe/Berlin", hour: "2-digit", minute: "2-digit", hour12: false })
    .format(d).split(":").map(Number);
  return h * 60 + m;
}

function ladePlan(datum) {
  const datei = path.join(AUSGABE_DIR, datum, "plan.json");
  return fs.existsSync(datei) ? JSON.parse(fs.readFileSync(datei, "utf8")) : null;
}

export async function bauen({ datum, jetzt = new Date(), ohneKi = false, ganzerTag = false, still = false } = {}) {
  datum ||= heuteBerlin(jetzt);
  const log = (...a) => { if (!still) console.log(...a); };
  const dir = path.join(AUSGABE_DIR, datum);
  const plan = ladePlan(datum) || {
    datum, fenster: "08:00–21:00 (Europe/Berlin)", versatz_minuten: VERSATZ, themen: [], posts: [], zurueckgestellt: [],
  };

  // Themen des Tages + Nachzügler vom Vortag (nur wenn der Vortag gebaut wurde).
  const themen = (await themenDesTages(datum)).map((t) => ({ ...t, nachzuegler: false }));
  const gestern = ladePlan(vortag(datum));
  if (gestern) {
    const bekannt = new Set(gestern.themen.map((t) => t.id));
    for (const t of await themenDesTages(vortag(datum))) if (!bekannt.has(t.id)) themen.push({ ...t, nachzuegler: true });
  }
  const geplant = new Set(plan.themen.map((t) => t.id));
  const neue = themen.filter((t) => !geplant.has(t.id));
  log(`[bau ${datum}] ${themen.length} Themen, davon neu: ${neue.length}`);
  if (!neue.length) return plan;

  // Fenster: ab jetzt (+10 min) bis 21:00. Heute schon zu spät → morgen als Nachzügler.
  const istHeute = datum === heuteBerlin(jetzt);
  let start = FENSTER.von;
  if (!ganzerTag && istHeute) start = Math.max(FENSTER.von, Math.ceil((minutenBerlin(jetzt) + 10) / 5) * 5);
  if (start > FENSTER.letzterStart) {
    for (const t of neue) if (!plan.zurueckgestellt.includes(t.id)) plan.zurueckgestellt.push(t.id);
    log(`[bau] nach 20:30 — ${neue.length} Thema/Themen auf morgen verschoben (Nachzügler)`);
    json(path.join(dir, "plan.json"), plan);
    return plan;
  }
  plan.zurueckgestellt = plan.zurueckgestellt.filter((id) => !neue.some((t) => t.id === id));

  const alleTexte = fs.existsSync(path.join(dir, "texte.json")) ? JSON.parse(fs.readFileSync(path.join(dir, "texte.json"), "utf8")) : {};
  try {
    for (let i = 0; i < neue.length; i++) {
      const t = neue[i];
      const kurz = t.id.slice(0, 8);
      const tdir = path.join(dir, kurz);
      fs.mkdirSync(tdir, { recursive: true });
      log(`[bau] (${i + 1}/${neue.length}) ${t.topic}`);

      const tx = await texteFuerThema(t, { ohneKi });
      alleTexte[t.id] = { topic: t.topic, link: themenLink(t.id), herkunft: tx.herkunft, befunde: tx.befunde, ...tx.texte };
      json(path.join(dir, "texte.json"), alleTexte);
      if (tx.befunde.length) log("   Texte:", tx.befunde.join(" · "));

      const bild = await baueBild(t, tx.texte, path.join(tdir, "bild.jpg"));
      const t0 = Date.now();
      const video = await baueVideo(t, tx.texte, path.join(tdir, "video.mp4"));
      log(`   Bild ${Math.round(bild.bytes / 1024)} KB · Video ${video.bilder} Bilder, ${Math.round(video.bytes / 1024)} KB, ${Math.round((Date.now() - t0) / 1000)} s`);

      // Tor: Läuft ein Textkasten über, wird das Thema NICHT eingeplant.
      const ueberlauf = [...bild.funde, ...video.funde].filter((f) => !f.hinweis);
      const hinweise = [...bild.funde, ...video.funde].filter((f) => f.hinweis);
      const minute = Math.round(start + ((i + 0.5) * (FENSTER.bis - start)) / neue.length);
      const eintrag = {
        id: t.id, topic: t.topic, bereich: t.bereich, nachzuegler: t.nachzuegler, link: themenLink(t.id),
        slot: isoBerlin(berlinZeitpunkt(datum, minute)),
        texte_herkunft: tx.herkunft, claude_schluessel_aus: tx.schluesselQuelle,
        bild: `${kurz}/bild.jpg`, video: `${kurz}/video.mp4`,
        ueberlauf, hinweise, gesperrt: ueberlauf.length > 0,
      };
      plan.themen.push(eintrag);
      if (eintrag.gesperrt) { log("   ⚠ GESPERRT, Text läuft über:", JSON.stringify(ueberlauf)); continue; }

      const alt = `${t.topic} — Links: ${tx.texte.video.links} Mitte: ${tx.texte.video.mitte} Rechts: ${tx.texte.video.rechts}`;
      for (const [plattform, versatz] of Object.entries(VERSATZ)) {
        plan.posts.push({
          schluessel: `${t.id}:${plattform}`, thema_id: t.id, plattform,
          zeit: isoBerlin(berlinZeitpunkt(datum, minute + versatz)),
          text: tx.texte[plattform],
          medium: plattform === "instagram" || plattform === "tiktok" ? eintrag.video : eintrag.bild,
          alt,
        });
      }
    }
  } finally {
    await schliessen();
    plan.posts.sort((a, b) => a.zeit.localeCompare(b.zeit));
    plan.stand = isoBerlin(new Date());
    json(path.join(dir, "plan.json"), plan);
  }
  return plan;
}

// ── Aufruf von der Kommandozeile ──────────────────────────────────────────────
if (process.argv[1] && path.resolve(process.argv[1]).toLowerCase() === fileURLToPath(import.meta.url).toLowerCase()) {
  const a = process.argv.slice(2);
  const wert = (n) => { const i = a.indexOf(n); return i >= 0 ? a[i + 1] : undefined; };
  const plan = await bauen({
    datum: wert("--datum"),
    ohneKi: a.includes("--ohne-ki"),
    ganzerTag: a.includes("--ganzer-tag"),
  });
  console.log(`[bau] Plan: ${plan.themen.length} Themen, ${plan.posts.length} Posts → social/ausgabe/${plan.datum}/plan.json`);
}
