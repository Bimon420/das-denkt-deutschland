// HTML-Vorlagen im DDD-Look: Bild 1080x1350 und Hochkant-Animation 1080x1920.
//
// Farben und Schriften stammen aus src/index.css (Hellmodus) und public/fonts —
// Schwarz/Rot/Gold wie das Logo, Playfair Display für Überschriften, Nunito Sans für Text.
// Die Schriften werden als data:-Adressen eingebettet: kein Netz, kein file://-Streit.
import fs from "node:fs";
import path from "node:path";
import { PROJEKT_DIR } from "./umgebung.mjs";
import { BEREICH_NAME, TAG_NAME } from "./texte.mjs";

const FARBE = {
  grund: "hsl(45 25% 97%)",      // --background
  karte: "hsl(45 18% 94%)",      // --card
  text: "hsl(0 0% 8%)",          // --foreground
  leise: "hsl(0 0% 40%)",        // --muted-foreground
  rand: "hsl(45 15% 85%)",       // --border
  links: "hsl(0 0% 12%)",        // --left
  rechts: "hsl(0 80% 45%)",      // --right
  mitte: "hsl(46 100% 50%)",     // --mitte
  mitteHell: "hsl(46 60% 92%)",  // --mitte-light
};

function b64(datei) {
  return fs.readFileSync(path.join(PROJEKT_DIR, "public", datei)).toString("base64");
}

let _kopf = null;
function schriftKopf() {
  if (_kopf) return _kopf;
  const f = (familie, gewicht, stil, datei) =>
    `@font-face{font-family:'${familie}';font-weight:${gewicht};font-style:${stil};src:url(data:font/woff2;base64,${b64("fonts/" + datei)}) format('woff2');}`;
  _kopf = [
    f("Nunito Sans", 400, "normal", "NunitoSans-Regular.woff2"),
    f("Nunito Sans", 700, "normal", "NunitoSans-Bold.woff2"),
    f("Nunito Sans", 800, "normal", "NunitoSans-ExtraBold.woff2"),
    f("Playfair Display", 400, "normal", "PlayfairDisplay-Regular.woff2"),
    f("Playfair Display", 700, "normal", "PlayfairDisplay-Bold.woff2"),
  ].join("\n");
  return _kopf;
}

let _logo = null;
const logo = () => (_logo ||= `data:image/png;base64,${b64("logo.png")}`);

function esc(s) {
  return String(s ?? "").replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));
}

// Schrift so lange verkleinern, bis der Text in seinen Kasten passt. Deterministisch.
// Danach meldet pruefe() jeden Kasten, der trotzdem überläuft — das liest der Bau aus.
const PASSEN_JS = `
function passe(el){
  const max=+el.dataset.max, min=+el.dataset.min;
  let s=max; el.style.fontSize=s+'px';
  while(s>min && (el.scrollHeight>el.clientHeight+1 || el.scrollWidth>el.clientWidth+1)){ s-=1; el.style.fontSize=s+'px'; }
  el.dataset.groesse=s;
}
function pruefe(){
  const funde=[];
  for(const el of document.querySelectorAll('[data-max]')){
    const ueber = el.scrollHeight>el.clientHeight+1 || el.scrollWidth>el.clientWidth+1;
    if(ueber) funde.push({kasten:el.dataset.name, schrift:+el.dataset.groesse, hoehe:el.scrollHeight, platz:el.clientHeight});
    else if(+el.dataset.groesse<=+el.dataset.min && el.dataset.name) funde.push({kasten:el.dataset.name, schrift:+el.dataset.groesse, hinweis:'Mindestgröße erreicht'});
  }
  const seite = document.documentElement;
  if(seite.scrollHeight>innerHeight+1||seite.scrollWidth>innerWidth+1) funde.push({kasten:'seite', hoehe:seite.scrollHeight, breite:seite.scrollWidth});
  return funde;
}`;

function kopfzeile(thema) {
  const bereich = BEREICH_NAME[thema.bereich];
  const tag = TAG_NAME[thema.tag_type];
  return `<div class="kopf">
    <img class="logo" src="${logo()}" alt="">
    <div class="marke">DAS DENKT<br>DEUTSCHLAND</div>
    <div class="marken">${bereich ? `<span class="pille">${esc(bereich)}</span>` : ""}${tag ? `<span class="pille tag-${esc(thema.tag_type)}">${esc(tag)}</span>` : ""}</div>
  </div>`;
}

const GRUND_CSS = (b, h) => `
*{box-sizing:border-box;margin:0;padding:0}
html,body{width:${b}px;height:${h}px;overflow:hidden;background:${FARBE.grund};color:${FARBE.text};font-family:'Nunito Sans',sans-serif;-webkit-font-smoothing:antialiased}
.kopf{display:flex;align-items:center;gap:22px}
.logo{height:62px}
.marke{font-weight:800;font-size:22px;line-height:1.05;letter-spacing:.14em}
.marken{margin-left:auto;display:flex;gap:10px}
.pille{border:2px solid ${FARBE.rand};background:#fff;border-radius:999px;padding:8px 18px;font-size:21px;font-weight:800;letter-spacing:.06em;text-transform:uppercase;white-space:nowrap}
.tag-gegensaetzlich{color:${FARBE.rechts};border-color:hsl(0 80% 45% / .35)}
.tag-gleich{background:${FARBE.mitteHell};border-color:hsl(46 100% 50% / .5)}
.tag-teilweise{color:${FARBE.leise}}
.frage{font-family:'Playfair Display',serif;font-weight:700;line-height:1.12;overflow:hidden}
.seite{border-radius:22px;padding:26px 32px;display:flex;flex-direction:column;gap:8px;overflow:hidden}
.seite .name{font-weight:800;letter-spacing:.16em;text-transform:uppercase;font-size:24px}
.seite .satz{line-height:1.3;overflow:hidden;flex:1}
.s-links{background:${FARBE.links};color:#fff}
.s-rechts{background:${FARBE.rechts};color:#fff}
.s-mitte{background:${FARBE.mitte};color:${FARBE.text}}
.knoepfe{display:flex;gap:14px}
.knopf{flex:1;text-align:center;border-radius:16px;padding:18px 0;font-weight:800;font-size:30px;letter-spacing:.04em}
.k-links{background:${FARBE.links};color:#fff}.k-mitte{background:${FARBE.mitte};color:${FARBE.text}}.k-rechts{background:${FARBE.rechts};color:#fff}
.adresse{font-weight:800;letter-spacing:.02em}
`;

/** Standbild 1080x1350 (4:5) für X, Bluesky, Facebook. */
export function htmlBild(thema, texte) {
  return `<!doctype html><html lang="de"><head><meta charset="utf-8"><style>${schriftKopf()}
${GRUND_CSS(1080, 1350)}
.rahmen{position:absolute;inset:0;padding:56px 60px 52px;display:flex;flex-direction:column;gap:26px}
.frage{height:262px;font-size:64px}
.spalten{display:flex;flex-direction:column;gap:16px;flex:1;min-height:0}
.spalten .seite{flex:1;min-height:0}
.fuss{display:flex;flex-direction:column;gap:16px}
.ruf{display:flex;align-items:baseline;justify-content:space-between;gap:20px}
.ruf .was{font-family:'Playfair Display',serif;font-weight:700;font-size:40px}
.ruf .adresse{font-size:30px}
</style></head><body><div class="rahmen">
  ${kopfzeile(thema)}
  <div class="frage" data-name="frage" data-max="66" data-min="40">${esc(thema.topic)}</div>
  <div class="spalten">
    <div class="seite s-links"><div class="name">← Links</div><div class="satz" data-name="links" data-max="36" data-min="24">${esc(texte.video.links)}</div></div>
    <div class="seite s-mitte"><div class="name">Die Mitte</div><div class="satz" data-name="mitte" data-max="36" data-min="24">${esc(texte.video.mitte)}</div></div>
    <div class="seite s-rechts"><div class="name">Rechts →</div><div class="satz" data-name="rechts" data-max="36" data-min="24">${esc(texte.video.rechts)}</div></div>
  </div>
  <div class="fuss">
    <div class="ruf"><span class="was">Was denkst du? Stimm ab.</span><span class="adresse">dasdenktdeutschland.de</span></div>
  </div>
</div>
<script>${PASSEN_JS}
document.fonts.ready.then(()=>{document.querySelectorAll('[data-max]').forEach(passe);window.__fertig=true;});
</script></body></html>`;
}

/** Zeitplan der Animation in Sekunden. */
export const SZENEN = [
  { name: "frage", von: 0, bis: 4.0 },
  { name: "links", von: 4.0, bis: 7.8 },
  { name: "rechts", von: 7.8, bis: 11.6 },
  { name: "mitte", von: 11.6, bis: 15.2 },
  { name: "abstimmen", von: 15.2, bis: 18.5 },
];
export const VIDEO_DAUER = 18.5;

/**
 * Hochkant-Animation 1080x1920. window.setze(t) stellt den Zustand zur Zeit t her —
 * rein aus t berechnet, ohne Uhr und ohne CSS-Übergänge, damit jedes Einzelbild
 * reproduzierbar ist. Inhalte halten Abstand zu den Rändern, an denen TikTok und
 * Instagram ihre Knöpfe und Bildunterschriften einblenden (unten ~420 px, rechts ~140 px).
 */
export function htmlVideo(thema, texte) {
  const szenen = JSON.stringify(SZENEN);
  return `<!doctype html><html lang="de"><head><meta charset="utf-8"><style>${schriftKopf()}
${GRUND_CSS(1080, 1920)}
.kopfbereich{position:absolute;left:70px;right:70px;top:110px}
.kleinfrage{position:absolute;left:70px;right:150px;top:230px;height:200px;font-size:44px;color:${FARBE.text}}
.szene{position:absolute;left:70px;right:150px;top:470px;height:980px;display:flex;flex-direction:column;justify-content:center}
.sz-frage{top:330px;height:1120px}
.sz-frage .ueber{font-weight:800;letter-spacing:.18em;text-transform:uppercase;font-size:30px;color:${FARBE.rechts};margin-bottom:28px}
.sz-frage{justify-content:flex-start;padding-top:120px}
.sz-frage .frage{height:760px;font-size:96px}
.szene .seite{height:860px;padding:48px 48px;gap:22px;border-radius:30px}
.szene .seite .name{font-size:40px}
.szene .seite .satz{font-size:56px;line-height:1.28}
.sz-abstimmen{text-align:left;gap:40px;justify-content:center}
.sz-abstimmen .was{font-family:'Playfair Display',serif;font-weight:700;font-size:110px;line-height:1.05}
.sz-abstimmen .knoepfe{flex-direction:column;gap:22px}
.sz-abstimmen .knopf{font-size:48px;padding:30px 0;border-radius:22px}
.sz-abstimmen .adresse{font-size:54px}
.balken{position:absolute;left:70px;right:150px;top:1480px;height:10px;border-radius:5px;background:${FARBE.rand};overflow:hidden;display:flex}
.balken i{display:block;height:100%}
</style></head><body>
<div class="kopfbereich">${kopfzeile(thema)}</div>
<div class="kleinfrage frage" id="kleinfrage" data-name="kleinfrage" data-max="46" data-min="30">${esc(thema.topic)}</div>
<div class="szene sz-frage" id="sz-frage">
  <div class="ueber">Die Frage des Tages</div>
  <div class="frage" data-name="frage" data-max="100" data-min="56">${esc(thema.topic)}</div>
</div>
<div class="szene" id="sz-links"><div class="seite s-links"><div class="name">← Links sagt</div><div class="satz" data-name="links" data-max="70" data-min="40">${esc(texte.video.links)}</div></div></div>
<div class="szene" id="sz-rechts"><div class="seite s-rechts"><div class="name">Rechts sagt →</div><div class="satz" data-name="rechts" data-max="70" data-min="40">${esc(texte.video.rechts)}</div></div></div>
<div class="szene" id="sz-mitte"><div class="seite s-mitte"><div class="name">Die Mitte</div><div class="satz" data-name="mitte" data-max="70" data-min="40">${esc(texte.video.mitte)}</div></div></div>
<div class="szene sz-abstimmen" id="sz-abstimmen">
  <div class="was">Was denkst du?</div>
  <div class="knoepfe"><div class="knopf k-links">← Links</div><div class="knopf k-mitte">Mitte</div><div class="knopf k-rechts">Rechts →</div></div>
  <div class="adresse">Stimm ab: dasdenktdeutschland.de</div>
</div>
<div class="balken"><i id="b1" style="background:${FARBE.links}"></i><i id="b2" style="background:${FARBE.rechts}"></i><i id="b3" style="background:${FARBE.mitte}"></i></div>
<script>${PASSEN_JS}
const SZ=${szenen}, DAUER=${VIDEO_DAUER};
const glatt=x=>x<=0?0:x>=1?1:x*x*(3-2*x);
function ein(t,von,bis,rein=.55,raus=.4,letzte=false){
  const a=glatt((t-von)/rein), b=letzte?1:1-glatt((t-(bis-raus))/raus);
  return Math.max(0,Math.min(a,b));
}
// Für die Schriftanpassung müssen alle Kästen sichtbar und unverschoben sein.
function setze(t){
  for(const s of SZ){
    const el=document.getElementById('sz-'+s.name);
    const o=ein(t,s.von,s.bis,.55,.4,s.name==='abstimmen');
    el.style.opacity=o;
    const dy=(1-glatt((t-s.von)/.55))*60;
    el.style.transform='translateY('+dy.toFixed(2)+'px)';
    el.style.visibility=o>0.001?'visible':'hidden';
  }
  const k=document.getElementById('kleinfrage');
  const ko=Math.min(glatt((t-SZ[1].von+.2)/.5),1-glatt((t-(SZ[3].bis-.4))/.4));
  k.style.opacity=Math.max(0,ko); k.style.visibility=ko>0.001?'visible':'hidden';
  const anteil=Math.max(0,Math.min(1,t/DAUER));
  document.getElementById('b1').style.width=(Math.min(anteil,1/3)*100)+'%';
  document.getElementById('b2').style.width=(Math.max(0,Math.min(anteil-1/3,1/3))*100)+'%';
  document.getElementById('b3').style.width=(Math.max(0,anteil-2/3)*100)+'%';
}
window.setze=setze;
document.fonts.ready.then(()=>{document.querySelectorAll('[data-max]').forEach(passe);setze(0);window.__fertig=true;});
</script></body></html>`;
}
