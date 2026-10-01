// Instagram (Content Publishing API): Reel aus öffentlicher video_url.
// Ablauf: Container anlegen (media_type=REELS) → warten bis status_code=FINISHED → media_publish.
// Doku: https://developers.facebook.com/docs/instagram-platform/content-publishing
// Grenzen laut Doku: 100 API-Posts je 24 h; Reels MP4/H.264, 23–60 fps, 3 s–15 min, ≤ 300 MB.
// Instagram holt das Video SELBST ab — deshalb braucht es eine öffentliche Adresse (lib/medien.mjs).
import { zugang, fehlendeZugaenge } from "../lib/umgebung.mjs";
import { abruf, uebersprungen, warte } from "../lib/netz.mjs";
import { oeffentlicheAdresse, MEDIEN_ZUGANG } from "../lib/medien.mjs";

export const NAME = "instagram";
export const ZUGANG = ["IG_USER_ID", "IG_TOKEN", ...MEDIEN_ZUGANG];

export async function senden(post, { echt }) {
  const fehlt = fehlendeZugaenge(ZUGANG);
  if (fehlt.length) return uebersprungen(fehlt);
  if (!echt) return { status: "trocken", grund: "Zugangsdaten vorhanden, --echt fehlt" };
  const z = zugang();
  // graph.facebook.com für „Instagram API mit Facebook-Login", graph.instagram.com für „mit Instagram-Login".
  const basis = `https://${z("IG_API_HOST") || "graph.facebook.com"}/${z("IG_GRAPH_VERSION") || "v26.0"}`;
  const ablage = await oeffentlicheAdresse(post.video, `${post.datum}/${post.thema_id}.mp4`, "video/mp4");
  if (ablage.fehlt) return uebersprungen(ablage.fehlt);

  const p = new URLSearchParams({
    media_type: "REELS", video_url: ablage.url, caption: post.text, share_to_feed: "true", access_token: z("IG_TOKEN"),
  });
  const container = await abruf(`${basis}/${z("IG_USER_ID")}/media`, { method: "POST", body: p });
  let stand = "";
  for (let i = 0; i < 40; i++) { // bis ~10 Minuten
    await warte(15000);
    const s = await abruf(`${basis}/${container.id}?fields=status_code,status&access_token=${encodeURIComponent(z("IG_TOKEN"))}`);
    stand = s.status_code;
    if (stand === "FINISHED") break;
    if (stand === "ERROR" || stand === "EXPIRED") return { status: "fehler", grund: `Container ${stand}: ${s.status || ""}` };
  }
  if (stand !== "FINISHED") return { status: "fehler", grund: `Container nach 10 min nicht fertig (${stand})` };
  const fertig = await abruf(`${basis}/${z("IG_USER_ID")}/media_publish`, {
    method: "POST", body: new URLSearchParams({ creation_id: container.id, access_token: z("IG_TOKEN") }),
  });
  return { status: "gesendet", id: fertig.id };
}
