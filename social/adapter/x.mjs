// X (API v2): Bild hochladen (v2 media upload, gestückelt), dann POST /2/tweets.
// Anmeldung: OAuth 1.0a User Context — vier Werte aus der X Developer Console.
// Doku (Stand 01.10.2026): https://docs.x.com/x-api/posts/create-post
//                          https://docs.x.com/x-api/media/quickstart/media-upload-chunked
// KOSTEN: X rechnet pro Aufruf ab (Guthaben vorab). Ein Post MIT Link kostet laut
// https://docs.x.com/x-api/getting-started/pricing 0,20 $, ohne Link 0,015 $.
// ⚠ Die Upload-Abfolge ist nach der Doku gebaut, aber mangels Konto NIE gegen X gelaufen.
import fs from "node:fs";
import crypto from "node:crypto";
import { zugang, fehlendeZugaenge } from "../lib/umgebung.mjs";
import { abruf, uebersprungen } from "../lib/netz.mjs";

export const NAME = "x";
export const ZUGANG = ["X_API_KEY", "X_API_SECRET", "X_ACCESS_TOKEN", "X_ACCESS_SECRET"];
const API = "https://api.x.com";

const pct = (s) => encodeURIComponent(s).replace(/[!'()*]/g, (c) => "%" + c.charCodeAt(0).toString(16).toUpperCase());

/** OAuth-1.0a-Kopfzeile (HMAC-SHA1). JSON- und Multipart-Körper fließen nicht in die Signatur ein. */
export function oauthKopf(methode, url, z, abfrage = {}) {
  const o = {
    oauth_consumer_key: z("X_API_KEY"),
    oauth_nonce: crypto.randomBytes(16).toString("hex"),
    oauth_signature_method: "HMAC-SHA1",
    oauth_timestamp: String(Math.floor(Date.now() / 1000)),
    oauth_token: z("X_ACCESS_TOKEN"),
    oauth_version: "1.0",
  };
  const u = new URL(url);
  const alle = { ...abfrage, ...Object.fromEntries(u.searchParams), ...o };
  const param = Object.keys(alle).sort().map((k) => `${pct(k)}=${pct(alle[k])}`).join("&");
  const basis = [methode.toUpperCase(), pct(u.origin + u.pathname), pct(param)].join("&");
  const sig = crypto.createHmac("sha1", `${pct(z("X_API_SECRET"))}&${pct(z("X_ACCESS_SECRET"))}`).update(basis).digest("base64");
  return "OAuth " + Object.entries({ ...o, oauth_signature: sig }).map(([k, v]) => `${pct(k)}="${pct(v)}"`).join(", ");
}

async function bildHochladen(datei, z) {
  const daten = fs.readFileSync(datei);
  const u1 = `${API}/2/media/upload/initialize`;
  const init = await abruf(u1, {
    method: "POST",
    headers: { Authorization: oauthKopf("POST", u1, z), "Content-Type": "application/json" },
    body: JSON.stringify({ media_type: "image/jpeg", total_bytes: daten.length, media_category: "tweet_image" }),
  });
  const id = init.data.id;
  const u2 = `${API}/2/media/upload/${id}/append`;
  const form = new FormData();
  form.append("segment_index", "0");
  form.append("media", new Blob([daten], { type: "image/jpeg" }), "bild.jpg");
  await abruf(u2, { method: "POST", headers: { Authorization: oauthKopf("POST", u2, z) }, body: form });
  const u3 = `${API}/2/media/upload/${id}/finalize`;
  await abruf(u3, { method: "POST", headers: { Authorization: oauthKopf("POST", u3, z) } });
  return id;
}

export async function senden(post, { echt }) {
  const fehlt = fehlendeZugaenge(ZUGANG);
  if (fehlt.length) return uebersprungen(fehlt);
  if (!echt) return { status: "trocken", grund: "Zugangsdaten vorhanden, --echt fehlt" };
  const z = zugang();
  const ohneBild = (z("X_OHNE_BILD") || "").toLowerCase() === "ja";
  const koerper = { text: post.text };
  if (!ohneBild) koerper.media = { media_ids: [await bildHochladen(post.bild, z)] };
  const url = `${API}/2/tweets`;
  const antwort = await abruf(url, {
    method: "POST",
    headers: { Authorization: oauthKopf("POST", url, z), "Content-Type": "application/json" },
    body: JSON.stringify(koerper),
  });
  return { status: "gesendet", id: antwort.data.id, url: `https://x.com/i/web/status/${antwort.data.id}` };
}
