// Profilbilder und Banner für die DDD-Konten (01.10.2026, damit Simon beim Anlegen nur noch hochladen muss).
//   node social/profil.mjs   → social/profil/*.png
// Look wie lib/vorlagen.mjs: Schwarz/Rot/Gold, Playfair Display + Nunito Sans, heller Grund.
// Wichtiges steht in der Mitte: X legt das Profilbild unten links über den Banner, Facebook schneidet
// auf dem Handy links und rechts ab.
import fs from "node:fs";
import path from "node:path";
import { createRequire } from "node:module";
import { PROJEKT_DIR, SOCIAL_DIR } from "./lib/umgebung.mjs";

const { chromium } = createRequire(import.meta.url)("C:/users/monster/desktop/claude-code/Monfetti-bot/erster bot/story-muse-generator-main/node_modules/playwright");
const AUS = path.join(SOCIAL_DIR, "profil");
fs.mkdirSync(AUS, { recursive: true });
const b64 = (d) => fs.readFileSync(path.join(PROJEKT_DIR, "public", d)).toString("base64");
const font = (f, w, d) => `@font-face{font-family:'${f}';font-weight:${w};src:url(data:font/woff2;base64,${b64("fonts/" + d)}) format('woff2');}`;
const KOPF = `<meta charset="utf-8"><style>
${font("Nunito Sans", 700, "NunitoSans-Bold.woff2")}${font("Nunito Sans", 800, "NunitoSans-ExtraBold.woff2")}${font("Playfair Display", 700, "PlayfairDisplay-Bold.woff2")}
*{margin:0;box-sizing:border-box}html,body{width:100%;height:100%}
body{background:hsl(45 25% 97%);color:hsl(0 0% 8%);font-family:'Nunito Sans',sans-serif;display:flex;align-items:center;justify-content:center;overflow:hidden}
.logo{display:block}
.marke{font:800 1em 'Nunito Sans';letter-spacing:.14em;line-height:1.1}
.spruch{font-family:'Playfair Display',serif;font-weight:700;line-height:1.1}
.drei{display:flex;gap:.35em;font:800 1em 'Nunito Sans'}
.drei span{padding:.35em .9em;border-radius:.35em;color:#fff}
.l{background:hsl(0 0% 12%)}.m{background:hsl(46 100% 50%);color:hsl(0 0% 8%)!important}.r{background:hsl(0 80% 45%)}
</style>`;
const LOGO = `data:image/png;base64,${b64("logo.png")}`;

const BILDER = {
  // Rund zugeschnitten auf allen Plattformen → Logo mit Rand, nichts in den Ecken
  "profilbild.png": [1000, 1000, `<img class="logo" src="${LOGO}" style="width:86%">`],   // Ecken bei 86 % ~440 px vom Mittelpunkt < 500 = bleibt im Kreis
  // X 1500x500 · Bluesky 3000x1000 (gleiches Verhältnis, doppelte Auflösung über deviceScaleFactor)
  "banner_x_bluesky.png": [1500, 500, `<div style="display:flex;flex-direction:column;align-items:center;gap:22px;font-size:26px;padding-left:120px">
     <div style="display:flex;align-items:center;gap:26px"><img class="logo" src="${LOGO}" style="height:78px"><div class="marke" style="font-size:30px">DAS DENKT<br>DEUTSCHLAND</div></div>
     <div class="spruch" style="font-size:48px">Jeden Tag die Themen, über die Deutschland streitet.</div>
     <div class="drei"><span class="l">← Links</span><span class="m">Mitte</span><span class="r">Rechts →</span><span style="color:hsl(0 0% 8%);padding-left:.3em">– und du stimmst ab.</span></div></div>`],
  // Facebook-Titelbild 1640x624 (Handy schneidet seitlich) → alles schmal in die Mitte
  "banner_facebook.png": [1640, 624, `<div style="display:flex;flex-direction:column;align-items:center;gap:26px;font-size:28px">
     <div style="display:flex;align-items:center;gap:28px"><img class="logo" src="${LOGO}" style="height:86px"><div class="marke" style="font-size:32px">DAS DENKT<br>DEUTSCHLAND</div></div>
     <div class="spruch" style="font-size:50px;text-align:center">Jeden Tag die Themen,<br>über die Deutschland streitet.</div>
     <div class="drei"><span class="l">← Links</span><span class="m">Mitte</span><span class="r">Rechts →</span></div></div>`],
};

const browser = await chromium.launch();
for (const [datei, [b, h, inhalt]] of Object.entries(BILDER)) {
  const faktor = datei.startsWith("banner_x") ? 2 : 1;
  const seite = await browser.newPage({ viewport: { width: b, height: h }, deviceScaleFactor: faktor });
  await seite.setContent(`<!doctype html><html><head>${KOPF}</head><body>${inhalt}</body></html>`);
  await seite.evaluate(() => document.fonts.ready);
  const ueber = await seite.evaluate(() => document.body.scrollWidth > innerWidth + 1 || document.body.scrollHeight > innerHeight + 1);
  await seite.screenshot({ path: path.join(AUS, datei) });
  console.log(datei, `${b * faktor}x${h * faktor}`, ueber ? "⚠️ läuft über" : "ok");
  await seite.close();
}
await browser.close();
