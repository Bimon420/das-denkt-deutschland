// Bluesky (AT-Protokoll): Anmeldung mit Handle + App-Passwort, Bild hochladen, Beitrag anlegen.
// Doku: https://atproto.com/blog/create-post · Bildgrenze 2.000.000 Byte (Lexikon app.bsky.embed.images)
import fs from "node:fs";
import { zugang, fehlendeZugaenge } from "../lib/umgebung.mjs";
import { abruf, uebersprungen } from "../lib/netz.mjs";

export const NAME = "bluesky";
export const ZUGANG = ["BLUESKY_HANDLE", "BLUESKY_APP_PASSWORT"];

/** Klickbare Links brauchen „Facets" mit BYTE-Positionen (UTF-8), nicht Zeichenpositionen. */
export function linkFacets(text) {
  const facets = [];
  for (const m of text.matchAll(/https?:\/\/[^\s]+/g)) {
    const start = Buffer.byteLength(text.slice(0, m.index), "utf8");
    const ende = start + Buffer.byteLength(m[0], "utf8");
    facets.push({ index: { byteStart: start, byteEnd: ende }, features: [{ $type: "app.bsky.richtext.facet#link", uri: m[0] }] });
  }
  return facets;
}

export async function senden(post, { echt }) {
  const fehlt = fehlendeZugaenge(ZUGANG);
  if (fehlt.length) return uebersprungen(fehlt);
  const bild = fs.readFileSync(post.bild);
  if (bild.length > 2_000_000) return { status: "fehler", grund: `Bild zu groß für Bluesky (${bild.length} Byte)` };
  if (!echt) return { status: "trocken", grund: "Zugangsdaten vorhanden, --echt fehlt" };

  const z = zugang();
  const pds = z("BLUESKY_PDS") || "https://bsky.social";
  const sitzung = await abruf(`${pds}/xrpc/com.atproto.server.createSession`, {
    method: "POST", headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ identifier: z("BLUESKY_HANDLE"), password: z("BLUESKY_APP_PASSWORT") }),
  });
  const auth = { Authorization: "Bearer " + sitzung.accessJwt };
  const blob = await abruf(`${pds}/xrpc/com.atproto.repo.uploadBlob`, {
    method: "POST", headers: { ...auth, "Content-Type": "image/jpeg" }, body: bild,
  });
  const record = {
    $type: "app.bsky.feed.post",
    text: post.text,
    createdAt: new Date().toISOString(),
    langs: ["de"],
    facets: linkFacets(post.text),
    embed: {
      $type: "app.bsky.embed.images",
      images: [{ alt: post.alt.slice(0, 1000), image: blob.blob, aspectRatio: { width: 1080, height: 1350 } }],
    },
  };
  const antwort = await abruf(`${pds}/xrpc/com.atproto.repo.createRecord`, {
    method: "POST", headers: { ...auth, "Content-Type": "application/json" },
    body: JSON.stringify({ repo: sitzung.did, collection: "app.bsky.feed.post", record }),
  });
  const rkey = antwort.uri.split("/").pop();
  return { status: "gesendet", id: antwort.uri, url: `https://bsky.app/profile/${sitzung.handle}/post/${rkey}` };
}
