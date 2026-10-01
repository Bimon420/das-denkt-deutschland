// Bild und Video aus den HTML-Vorlagen erzeugen: Playwright (unsichtbarer Chromium) + ffmpeg.
import fs from "node:fs";
import { spawn } from "node:child_process";
import { createRequire } from "node:module";
import { htmlBild, htmlVideo, VIDEO_DAUER } from "./vorlagen.mjs";

// Playwright liegt nicht in diesem Projekt, sondern im Monfetti-Werkzeugordner.
const PLAYWRIGHT = process.env.DDD_PLAYWRIGHT ||
  "C:/users/monster/desktop/claude-code/Monfetti-bot/erster bot/story-muse-generator-main/node_modules/playwright";
export const FPS = 30;

let _browser = null;
async function browser() {
  if (_browser) return _browser;
  const { chromium } = createRequire(import.meta.url)(PLAYWRIGHT);
  _browser = await chromium.launch({ headless: true }); // headless: kein Fenster
  return _browser;
}
export async function schliessen() {
  if (_browser) await _browser.close();
  _browser = null;
}

async function seite(breite, hoehe, html) {
  const b = await browser();
  const p = await b.newPage({ viewport: { width: breite, height: hoehe }, deviceScaleFactor: 1 });
  await p.setContent(html, { waitUntil: "load" });
  await p.waitForFunction(() => window.__fertig === true, null, { timeout: 20000 });
  return p;
}

/** Standbild als JPEG (Instagram verlangt JPEG, Bluesky ≤ 2 MB). Gibt Überlauf-Funde zurück. */
export async function baueBild(thema, texte, ziel) {
  const p = await seite(1080, 1350, htmlBild(thema, texte));
  const funde = await p.evaluate(() => pruefe());
  await p.screenshot({ path: ziel, type: "jpeg", quality: 92 });
  await p.close();
  return { funde, bytes: fs.statSync(ziel).size };
}

/**
 * Video 1080x1920, 30 fps: jedes Einzelbild wird zur Zeit t = i/30 gesetzt, fotografiert
 * und per Rohrleitung an ffmpeg gereicht (keine Zwischendateien). Stille Tonspur, weil
 * Reels laut Doku eine AAC-Spur erwarten — Musik gibt es bewusst keine (Rechte).
 */
export async function baueVideo(thema, texte, ziel) {
  const p = await seite(1080, 1920, htmlVideo(thema, texte));
  const funde = await p.evaluate(() => pruefe());
  const bilder = Math.round(VIDEO_DAUER * FPS);
  const ff = spawn("ffmpeg", [
    "-y", "-loglevel", "error",
    "-f", "image2pipe", "-framerate", String(FPS), "-c:v", "mjpeg", "-i", "-",
    "-f", "lavfi", "-i", "anullsrc=r=48000:cl=stereo",
    "-map", "0:v", "-map", "1:a", "-shortest",
    "-c:v", "libx264", "-preset", "medium", "-crf", "20", "-pix_fmt", "yuv420p", "-profile:v", "high",
    "-g", String(FPS * 2), "-r", String(FPS),
    "-c:a", "aac", "-b:a", "128k", "-ar", "48000",
    "-movflags", "+faststart", ziel,
  ], { windowsHide: true, stdio: ["pipe", "ignore", "pipe"] });
  let fehler = "";
  ff.stderr.on("data", (d) => (fehler += d));
  const ende = new Promise((ok, nein) => ff.on("close", (c) => (c === 0 ? ok() : nein(new Error("ffmpeg: " + fehler.slice(0, 400))))));
  for (let i = 0; i < bilder; i++) {
    await p.evaluate((t) => window.setze(t), i / FPS);
    const bild = await p.screenshot({ type: "jpeg", quality: 93 });
    if (!ff.stdin.write(bild)) await new Promise((r) => ff.stdin.once("drain", r));
  }
  ff.stdin.end();
  await ende;
  await p.close();
  return { funde, bilder, bytes: fs.statSync(ziel).size };
}
