// TikTok (Content Posting API, Direct Post): Video per FILE_UPLOAD in einem Stück.
// Doku: https://developers.tiktok.com/doc/content-posting-api-reference-direct-post
// ⚠ Ohne Audit durch TikTok gehen Posts NUR als SELF_ONLY (privat) — die Voreinstellung hier.
//   Öffentlich erst nach Audit UND mit TIKTOK_SICHTBARKEIT=PUBLIC_TO_EVERYONE.
// Token: Zugriffstoken lebt ~24 h; mit Refresh-Token + Client-Schlüssel erneuert sich das
// Skript selbst und legt das neue Paar in social/.tiktok_token.json ab (nie committen).
import fs from "node:fs";
import path from "node:path";
import { zugang, fehlendeZugaenge, SOCIAL_DIR } from "../lib/umgebung.mjs";
import { abruf, uebersprungen, warte } from "../lib/netz.mjs";

export const NAME = "tiktok";
export const ZUGANG = ["TIKTOK_CLIENT_KEY", "TIKTOK_CLIENT_SECRET", "TIKTOK_REFRESH_TOKEN"];
const API = "https://open.tiktokapis.com";
const TOKEN_DATEI = path.join(SOCIAL_DIR, ".tiktok_token.json");

async function zugriffstoken(z) {
  let refresh = z("TIKTOK_REFRESH_TOKEN");
  try {
    const gemerkt = JSON.parse(fs.readFileSync(TOKEN_DATEI, "utf8"));
    if (gemerkt.access_token && gemerkt.gueltig_bis > Date.now() + 10 * 60000) return gemerkt.access_token;
    if (gemerkt.refresh_token) refresh = gemerkt.refresh_token;
  } catch { /* noch keine Datei */ }
  const t = await abruf(`${API}/v2/oauth/token/`, {
    method: "POST", headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      client_key: z("TIKTOK_CLIENT_KEY"), client_secret: z("TIKTOK_CLIENT_SECRET"),
      grant_type: "refresh_token", refresh_token: refresh,
    }),
  });
  fs.writeFileSync(TOKEN_DATEI, JSON.stringify({
    access_token: t.access_token, refresh_token: t.refresh_token || refresh,
    gueltig_bis: Date.now() + (t.expires_in || 86400) * 1000,
  }));
  return t.access_token;
}

export async function senden(post, { echt }) {
  const fehlt = fehlendeZugaenge(ZUGANG);
  if (fehlt.length) return uebersprungen(fehlt);
  if (!echt) return { status: "trocken", grund: "Zugangsdaten vorhanden, --echt fehlt" };
  const z = zugang();
  const token = await zugriffstoken(z);
  const kopf = { Authorization: "Bearer " + token, "Content-Type": "application/json; charset=UTF-8" };

  const info = await abruf(`${API}/v2/post/publish/creator_info/query/`, { method: "POST", headers: kopf });
  const wunsch = z("TIKTOK_SICHTBARKEIT") || "SELF_ONLY";
  const erlaubt = info.data?.privacy_level_options || [];
  if (!erlaubt.includes(wunsch)) return { status: "fehler", grund: `Sichtbarkeit ${wunsch} nicht erlaubt (erlaubt: ${erlaubt.join(", ")})` };

  const groesse = fs.statSync(post.video).size;
  const init = await abruf(`${API}/v2/post/publish/video/init/`, {
    method: "POST", headers: kopf,
    body: JSON.stringify({
      post_info: {
        title: post.text, privacy_level: wunsch,
        disable_duet: false, disable_comment: false, disable_stitch: false,
        video_cover_timestamp_ms: 1500, brand_content_toggle: false, brand_organic_toggle: false,
      },
      source_info: { source: "FILE_UPLOAD", video_size: groesse, chunk_size: groesse, total_chunk_count: 1 },
    }),
  });
  const { publish_id, upload_url } = init.data;
  await abruf(upload_url, {
    method: "PUT",
    headers: { "Content-Type": "video/mp4", "Content-Length": String(groesse), "Content-Range": `bytes 0-${groesse - 1}/${groesse}` },
    body: fs.readFileSync(post.video),
  }, 300000);
  for (let i = 0; i < 30; i++) {
    await warte(10000);
    const s = await abruf(`${API}/v2/post/publish/status/fetch/`, { method: "POST", headers: kopf, body: JSON.stringify({ publish_id }) });
    const st = s.data?.status;
    if (st === "PUBLISH_COMPLETE") return { status: "gesendet", id: publish_id, sichtbarkeit: wunsch };
    if (st === "FAILED") return { status: "fehler", grund: "TikTok: " + (s.data?.fail_reason || "FAILED") };
  }
  return { status: "unklar", id: publish_id, grund: "Status nach 5 min nicht abgeschlossen — in der App nachsehen" };
}
