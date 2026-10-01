// Texte je Plattform für ein Thema: zuerst per Claude (claude-sonnet-5), sonst Vorlage.
//
// Jede Fassung — ob von Claude oder aus der Vorlage — läuft durch pruefeTexte(). Was dort
// durchfällt, wird für dieses Feld durch die Vorlage ersetzt. Die Prüfung hängt am Bau,
// nicht daneben: ein zu langer oder zitatfälschender Text kann den Plan nicht erreichen.
import { claudeSchluessel, themenLink } from "./umgebung.mjs";

export const MODELL = "claude-sonnet-5";
export const GRENZEN = { x: 280, bluesky: 300, facebook: 2000, instagram: 2200, tiktok: 2200 };
const VIDEO_GRENZE = 190; // Zeichen je Videotafel (Links/Rechts/Mitte)

export const BEREICH_NAME = {
  innenpolitik: "Innenpolitik", aussenpolitik: "Außenpolitik", europa: "Europa",
  wirtschaft: "Wirtschaft", soziales: "Soziales", migration: "Migration", klima: "Klima & Energie",
  sicherheit: "Sicherheit", digitales: "Digitales", bildung: "Bildung & Familie",
};
export const TAG_NAME = { gleich: "Gleiche Position", gegensaetzlich: "Gegensätzlich", teilweise: "Teilweise gleich" };

// ── Längen ────────────────────────────────────────────────────────────────────

/** Bluesky zählt Grapheme (sichtbare Zeichen), nicht Bytes. */
export function grapheme(text) {
  return [...new Intl.Segmenter("de", { granularity: "grapheme" }).segment(text)].length;
}

/** X-Länge: jede Adresse zählt 23, lateinische Zeichen 1, alles andere (Emoji, CJK) 2. */
export function xLaenge(text) {
  const ohneLinks = text.replace(/https?:\/\/\S+/g, () => "\u0000".repeat(23));
  let n = 0;
  for (const g of new Intl.Segmenter("de", { granularity: "grapheme" }).segment(ohneLinks)) {
    const c = g.segment.codePointAt(0);
    const leicht = c <= 0x10ff || (c >= 0x2000 && c <= 0x200d) || (c >= 0x2010 && c <= 0x201f) || (c >= 0x2032 && c <= 0x2037);
    n += leicht && g.segment.length <= 2 ? 1 : 2;
  }
  return n;
}

function kuerze(text, max) {
  // An einer Satz- oder Wortgrenze kürzen, nie mitten im Wort.
  const t = text.replace(/\s+/g, " ").trim();
  if (t.length <= max) return t;
  const satz = t.slice(0, max).match(/^(.*[.!?])\s/);
  if (satz && satz[1].length > max * 0.55) return satz[1];
  const wort = t.slice(0, max - 1).replace(/\s+\S*$/, "");
  return wort.replace(/[,;:–-]\s*$/, "") + "…";
}

/** Erster Satz bzw. gekürzt — für die Vorlage. */
function kern(text, max) {
  const erster = text.replace(/\s+/g, " ").trim().match(/^(.+?[.!?])(\s|$)/);
  if (erster && erster[1].length <= max) return erster[1];
  return kuerze(text, max);
}

// ── Prüfung ───────────────────────────────────────────────────────────────────

function normal(s) {
  return s.toLowerCase().replace(/[„“”"»«‚‘’'.,;:!?()\-–—…]/g, " ").replace(/\s+/g, " ").trim();
}

/** Alles in Anführungszeichen muss wörtlich im Thema stehen — sonst ist es ein erfundenes Zitat. */
export function erfundeneZitate(text, thema) {
  const quelle = normal([
    thema.topic, thema.left_position, thema.left_quote, thema.left_speaker,
    thema.right_position, thema.right_quote, thema.right_speaker, thema.mitte_view,
  ].join(" "));
  const funde = [];
  for (const m of text.matchAll(/[„"»“]([^„"»“”«]{6,}?)[“”"«]/g)) {
    if (!quelle.includes(normal(m[1]))) funde.push(m[1].slice(0, 60));
  }
  return funde;
}

// Simon 01.10.: „für X einfach ein Bild zum text ohne link posten, im bild ist alles zum thema bereits
// enthalten - so stelle ich es mir bei den anderen posts auch vor". Also: KEIN Link in keinem Text.
// Auf X zusaetzlich auch keine nackte Adresse (dasdenktdeutschland.de) — X verlinkt sie selbst, und
// ein Post mit URL kostet 0,20 $ statt 0,015 $ (docs.x.com/x-api/getting-started/pricing, 01.10.).
const HAT_LINK = /https?:\/\/|www\./i;
const HAT_ADRESSE = /\b[a-z0-9-]+\.(de|com|fun|world|app|net|org)\b/i;

export function pruefeTexte(t, thema) {
  const fehler = {};
  const merke = (feld, grund) => { (fehler[feld] ||= []).push(grund); };
  if (xLaenge(t.x) > GRENZEN.x) merke("x", `zu lang (${xLaenge(t.x)} > 280)`);
  if (HAT_LINK.test(t.x) || HAT_ADRESSE.test(t.x)) merke("x", "Link/Adresse im X-Text (kostet 0,20 $)");
  if (grapheme(t.bluesky) > GRENZEN.bluesky) merke("bluesky", `zu lang (${grapheme(t.bluesky)} > 300 Grapheme)`);
  if (t.facebook.length > GRENZEN.facebook) merke("facebook", "zu lang");
  for (const f of ["bluesky", "facebook", "instagram", "tiktok"]) if (HAT_LINK.test(t[f])) merke(f, "Link im Text (Simon: nur Bild + Text)");
  if (t.instagram.length > GRENZEN.instagram) merke("instagram", "zu lang");
  if (t.tiktok.length > GRENZEN.tiktok) merke("tiktok", "zu lang");
  for (const f of ["instagram", "tiktok"]) if (!/dasdenktdeutschland\.de/i.test(t[f])) merke(f, "Adresse fehlt");
  for (const f of ["links", "rechts", "mitte"]) {
    if (!t.video[f] || t.video[f].length > VIDEO_GRENZE) merke("video", `${f}: leer oder > ${VIDEO_GRENZE} Zeichen`);
  }
  for (const f of ["x", "bluesky", "facebook", "instagram", "tiktok"]) {
    const z = erfundeneZitate(t[f], thema);
    if (z.length) merke(f, "Zitat steht nicht im Thema: " + z.join(" | "));
  }
  for (const f of ["links", "rechts", "mitte"]) {
    const z = erfundeneZitate(t.video[f] || "", thema);
    if (z.length) merke("video", `${f}: Zitat steht nicht im Thema`);
  }
  return fehler;
}

// ── Vorlage ohne KI ───────────────────────────────────────────────────────────

export function vorlage(thema) {
  const ruf = "Links, Mitte oder Rechts – wo stehst du?";
  const bereich = BEREICH_NAME[thema.bereich] ? `#${BEREICH_NAME[thema.bereich].replace(/[^\p{L}]/gu, "")}` : "";

  let topicX = thema.topic;
  let x = `${topicX}\n\n${ruf}`;
  while (xLaenge(x) > GRENZEN.x) { topicX = kuerze(topicX, topicX.length - 10); x = `${topicX}\n\n${ruf}`; }

  // Beide Seiten nur, wenn ihr erster Satz GANZ hineinpasst — ein abgehackter Halbsatz
  // („…") liest sich wie Parteinahme. Sonst nur Frage + Aufruf.
  const ersterSatz = (s) => (s.replace(/\s+/g, " ").trim().match(/^(.+?[.!?])(\s|$)/) || [, null])[1];
  const ls = ersterSatz(thema.left_position), rs = ersterSatz(thema.right_position);
  let bluesky = ls && rs ? `${thema.topic}\n\nLinks: ${ls}\nRechts: ${rs}\n\nWo stehst du? Stimm ab auf dasdenktdeutschland.de` : "";
  if (!bluesky || grapheme(bluesky) > GRENZEN.bluesky) bluesky = `${kuerze(thema.topic, 200)}\n\n${ruf}`;

  const facebook = [
    thema.topic, "",
    `⬅ Links: ${thema.left_position}`, "",
    `➡ Rechts: ${thema.right_position}`, "",
    `⚖ Die Mitte: ${kuerze(thema.mitte_view, 600)}`, "",
    `Was denkst du? Stimm ab auf dasdenktdeutschland.de – Links, Mitte oder Rechts.`,
  ].join("\n");

  const instagram = [
    thema.topic, "",
    `Links: ${kern(thema.left_position, 220)}`, "",
    `Rechts: ${kern(thema.right_position, 220)}`, "",
    `Mitte: ${kern(thema.mitte_view, 260)}`, "",
    "Was denkst du? Stimm ab auf dasdenktdeutschland.de (Link in der Bio).", "",
    `#DasDenktDeutschland #Politik #Deutschland ${bereich}`.trim(),
  ].join("\n");

  const tiktok = `${kuerze(thema.topic, 140)} – Links, Mitte oder Rechts? Stimm ab auf dasdenktdeutschland.de #DasDenktDeutschland #Politik ${bereich}`.trim();

  return {
    x, bluesky, facebook, instagram, tiktok,
    video: {
      links: kuerze(kern(thema.left_position, VIDEO_GRENZE), VIDEO_GRENZE),
      rechts: kuerze(kern(thema.right_position, VIDEO_GRENZE), VIDEO_GRENZE),
      mitte: kuerze(kern(thema.mitte_view, VIDEO_GRENZE), VIDEO_GRENZE),
    },
  };
}

// ── Claude ────────────────────────────────────────────────────────────────────

const SCHEMA = {
  type: "object",
  additionalProperties: false,
  required: ["x", "bluesky", "facebook", "instagram", "tiktok", "video"],
  properties: {
    x: { type: "string" },
    bluesky: { type: "string" },
    facebook: { type: "string" },
    instagram: { type: "string" },
    tiktok: { type: "string" },
    video: {
      type: "object",
      additionalProperties: false,
      required: ["links", "rechts", "mitte"],
      properties: { links: { type: "string" }, rechts: { type: "string" }, mitte: { type: "string" } },
    },
  },
};

const SYSTEM = `Du schreibst Social-Media-Beiträge für „DAS DENKT DEUTSCHLAND" (DDD), ein überparteiliches Abstimmungsportal.
Zu jedem Thema gibt es eine linke Position, eine rechte Position und eine Mitte-Einordnung; Leser stimmen ab: Links, Mitte oder Rechts.

Regeln:
- Streng neutral. Links und Rechts gleich lang, gleich fair, gleich respektvoll. Keine Wertung, keine eigene Meinung, kein Spott.
- Nur Inhalte aus dem gelieferten Thema. Nichts hinzuerfinden: keine Zahlen, Namen, Ereignisse oder Zitate, die nicht drinstehen.
- Setze NICHTS in Anführungszeichen, außer es steht wörtlich so im Thema.
- Jeder Beitrag erscheint ZUSAMMEN mit einem Bild, das Thema, Links, Mitte, Rechts und die Adresse schon zeigt. Der Text begleitet das Bild, er muss es nicht wiederholen.
- KEINE Links und keine URLs, in keinem Feld.
- Deutsch, klar, ohne Floskeln. Höchstens ein Emoji pro Beitrag, gern keins.

Felder:
- x: höchstens 200 Zeichen. Frage zuspitzen, endet mit einer Frage an den Leser (z. B. „Wo stehst du?"). KEINE Webadresse, auch nicht „dasdenktdeutschland.de" (X macht daraus einen Link). Keine Hashtags.
- bluesky: höchstens 280 Zeichen. Thema in einem Satz, dann „Links:" und „Rechts:" mit je einem sehr kurzen Halbsatz, endet mit „Stimm ab auf dasdenktdeutschland.de".
- facebook: 400–900 Zeichen. Thema, Absatz „Links:", Absatz „Rechts:", Absatz „Die Mitte:", endet mit „Stimm ab auf dasdenktdeutschland.de".
- instagram: 400–900 Zeichen Bildunterschrift für ein Reel. Absätze beginnen mit „Links:", „Rechts:", „Die Mitte:". Endet mit „Stimm ab auf dasdenktdeutschland.de (Link in der Bio)". Am Ende 3–5 sachliche Hashtags, darunter #DasDenktDeutschland.
- tiktok: höchstens 300 Zeichen; endet mit „Stimm ab auf dasdenktdeutschland.de" und 2–4 Hashtags, darunter #DasDenktDeutschland.
- video.links / video.rechts / video.mitte: je EIN Satz, höchstens 150 Zeichen, die Kernaussage der jeweiligen Seite für eine Videotafel. Ohne Vorsilbe wie „Links:".`;

async function claudeFassung(thema, schluessel, hinweis = "") {
  const eingabe = {
    thema: thema.topic,
    bereich: BEREICH_NAME[thema.bereich] || null,
    links: { position: thema.left_position, zitat: thema.left_quote, sprecher: thema.left_speaker },
    rechts: { position: thema.right_position, zitat: thema.right_quote, sprecher: thema.right_speaker },
    mitte: thema.mitte_view,
  };
  const r = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: { "content-type": "application/json", "x-api-key": schluessel, "anthropic-version": "2023-06-01" },
    body: JSON.stringify({
      model: MODELL,
      max_tokens: 8000,
      system: SYSTEM,
      output_config: { effort: "low", format: { type: "json_schema", schema: SCHEMA } },
      messages: [{ role: "user", content: "Thema als JSON:\n" + JSON.stringify(eingabe, null, 2) + (hinweis ? "\n\n" + hinweis : "") }],
    }),
  });
  if (!r.ok) throw new Error(`Claude HTTP ${r.status}: ${(await r.text()).slice(0, 200)}`);
  const antwort = await r.json();
  if (antwort.stop_reason === "refusal") throw new Error("Claude hat abgelehnt");
  if (antwort.stop_reason === "max_tokens") throw new Error("Claude-Antwort abgeschnitten (max_tokens)");
  const text = antwort.content.filter((b) => b.type === "text").map((b) => b.text).join("");
  const roh = JSON.parse(text);
  const ersetze = (s) => s.replaceAll("{LINK}", "").trim();   // Sicherheitsnetz: falls doch ein Platzhalter kommt
  return {
    x: ersetze(roh.x), bluesky: ersetze(roh.bluesky), facebook: ersetze(roh.facebook),
    instagram: ersetze(roh.instagram), tiktok: ersetze(roh.tiktok),
    video: { links: roh.video.links.trim(), rechts: roh.video.rechts.trim(), mitte: roh.video.mitte.trim() },
    _nutzung: antwort.usage,
  };
}

/**
 * Texte bauen. Rückgabe: { texte, herkunft: {feld: "claude"|"vorlage"}, befunde }.
 * Ein Feld, das bei Claude durchfällt, kommt aus der Vorlage — nicht der ganze Satz.
 */
export async function texteFuerThema(thema, { ohneKi = false } = {}) {
  const v = vorlage(thema);
  const vFehler = pruefeTexte(v, thema);
  if (Object.keys(vFehler).length) throw new Error("Vorlage selbst fällt durch: " + JSON.stringify(vFehler));

  const befunde = [];
  const { schluessel, quelle } = ohneKi ? { schluessel: null } : claudeSchluessel();
  if (!ohneKi && !schluessel) befunde.push("kein Claude-Schlüssel gefunden → Vorlage");

  // Bis zu zwei Fassungen. Die zweite bekommt die Prüfbefunde der ersten als Hinweis.
  // Je Feld gilt die erste Fassung, die die Prüfung besteht; sonst die Vorlage.
  const FELDER = ["x", "bluesky", "facebook", "instagram", "tiktok", "video"];
  const texte = {};
  const herkunft = {};
  const nutzung = [];
  let offen = [...FELDER];
  let hinweis = "";
  for (let versuch = 1; schluessel && versuch <= 2 && offen.length; versuch++) {
    let k;
    try { k = await claudeFassung(thema, schluessel, hinweis); }
    catch (e) { befunde.push(`Claude Versuch ${versuch}: ${e.message}`); continue; }
    nutzung.push(k._nutzung);
    const kFehler = pruefeTexte(k, thema);
    for (const f of offen) {
      if (!kFehler[f]) { texte[f] = k[f]; herkunft[f] = `claude${versuch > 1 ? " (2. Fassung)" : ""}`; }
      else befunde.push(`${f} Fassung ${versuch} verworfen: ${kFehler[f].join("; ")}`);
    }
    offen = offen.filter((f) => !texte[f]);
    hinweis = "Deine vorige Fassung fiel in diesen Feldern durch — halte die Grenzen diesmal sicher ein:\n" +
      offen.map((f) => `- ${f}: ${kFehler[f].join("; ")}`).join("\n");
  }
  for (const f of offen) { texte[f] = v[f]; herkunft[f] = "vorlage"; }
  return { texte, herkunft, befunde, schluesselQuelle: schluessel ? quelle : null, nutzung };
}
