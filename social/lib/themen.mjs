// Themen eines Tages aus app_ddd.topics lesen — mit dem öffentlichen Lesezugang der Seite.
import { SUPABASE_URL, oeffentlicherSchluessel } from "./umgebung.mjs";

const FELDER = [
  "id", "topic", "tag_type", "bereich", "category", "published_at", "created_at",
  "left_position", "left_quote", "left_speaker",
  "right_position", "right_quote", "right_speaker",
  "mitte_view",
].join(",");

export async function themenDesTages(datum) {
  const k = await oeffentlicherSchluessel();
  const url = `${SUPABASE_URL}/rest/v1/topics?published_at=eq.${datum}&select=${FELDER}&order=created_at.asc,id.asc`;
  const r = await fetch(url, {
    headers: { apikey: k, Authorization: "Bearer " + k, "Accept-Profile": "app_ddd" },
  });
  if (!r.ok) throw new Error(`Themen lesen fehlgeschlagen: HTTP ${r.status}`);
  const zeilen = await r.json();
  // Nur vollständige Themen: ohne beide Seiten und Mitte gibt es keinen fairen Beitrag.
  return zeilen.filter((t) => t.topic && t.left_position && t.right_position && t.mitte_view);
}
