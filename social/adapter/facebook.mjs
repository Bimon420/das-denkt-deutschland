// Facebook-Seite (Graph API): Foto mit Text auf die DDD-Seite, direkt als Datei hochgeladen.
// Doku: https://developers.facebook.com/docs/pages-api/posts · Version v26.0 (29.07.2026,
// https://developers.facebook.com/docs/graph-api/changelog). Braucht ein Seiten-Token mit
// pages_manage_posts + pages_read_engagement.
import fs from "node:fs";
import { zugang, fehlendeZugaenge } from "../lib/umgebung.mjs";
import { abruf, uebersprungen } from "../lib/netz.mjs";

export const NAME = "facebook";
export const ZUGANG = ["FB_PAGE_ID", "FB_PAGE_TOKEN"];

export async function senden(post, { echt }) {
  const fehlt = fehlendeZugaenge(ZUGANG);
  if (fehlt.length) return uebersprungen(fehlt);
  if (!echt) return { status: "trocken", grund: "Zugangsdaten vorhanden, --echt fehlt" };
  const z = zugang();
  const version = z("FB_GRAPH_VERSION") || "v26.0";
  const form = new FormData();
  form.append("message", post.text);
  form.append("source", new Blob([fs.readFileSync(post.bild)], { type: "image/jpeg" }), "ddd.jpg");
  form.append("access_token", z("FB_PAGE_TOKEN"));
  const antwort = await abruf(`https://graph.facebook.com/${version}/${z("FB_PAGE_ID")}/photos`, { method: "POST", body: form }, 120000);
  const id = antwort.post_id || antwort.id;
  return { status: "gesendet", id, url: `https://www.facebook.com/${id}` };
}
