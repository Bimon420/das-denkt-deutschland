// Öffentliche Medienadresse für Instagram (Reels holt Instagram selbst per video_url ab).
//
// Weg: Supabase Storage im gemeinsamen Projekt, ein ÖFFENTLICHER Eimer (Simon legt ihn an,
// Name in DDD_MEDIEN_EIMER), hochgeladen mit dem Service-Schlüssel aus .env.social.
// Ohne diese beiden Werte gibt es keine Adresse — Instagram wird dann übersprungen.
import fs from "node:fs";
import { SUPABASE_URL, zugang, fehlendeZugaenge } from "./umgebung.mjs";
import { abruf } from "./netz.mjs";

export const MEDIEN_ZUGANG = ["DDD_MEDIEN_EIMER", "SUPABASE_SERVICE_ROLE_KEY"];

export async function oeffentlicheAdresse(datei, pfadImEimer, inhaltstyp) {
  const fehlt = fehlendeZugaenge(MEDIEN_ZUGANG);
  if (fehlt.length) return { fehlt };
  const z = zugang();
  const eimer = z("DDD_MEDIEN_EIMER");
  await abruf(`${SUPABASE_URL}/storage/v1/object/${eimer}/${pfadImEimer}`, {
    method: "POST",
    headers: {
      Authorization: "Bearer " + z("SUPABASE_SERVICE_ROLE_KEY"),
      apikey: z("SUPABASE_SERVICE_ROLE_KEY"),
      "Content-Type": inhaltstyp,
      "x-upsert": "true",
    },
    body: fs.readFileSync(datei),
  }, 180000);
  return { url: `${SUPABASE_URL}/storage/v1/object/public/${eimer}/${pfadImEimer}` };
}
