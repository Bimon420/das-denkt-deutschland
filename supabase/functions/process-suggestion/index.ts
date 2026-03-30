import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const VERIFICATION_PERSPECTIVES = [
  { name: "Politischer Faktenprüfer", focus: "Titel korrekt? Beschreibt genau EIN Ereignis? Passen Links/Rechts/Mitte zum Titel? WICHTIG: Bei Liveblogs/Eilmeldungen innere Konsistenz prüfen und nicht allein wegen fehlender Echtzeit-Verifizierbarkeit ablehnen." },
  { name: "Personen-Zuordnungsprüfer", focus: "Zitate zur jeweiligen Position passend? WICHTIG: Generische Sprecher wie 'Politischer Beobachter', 'Experten', 'Kritiker' sind ERLAUBT und kein Ablehnungsgrund. Prüfe nur ob Zitat inhaltlich zur Position (links/rechts) passt." },
  { name: "Gesellschaftlicher Kohärenzprüfer", focus: "Echte gesellschaftliche Debatte? Links/Rechts/Mitte logisch zum selben Thema?" },
  { name: "Wirtschaftlicher Plausibilitätsprüfer", focus: "Wirtschaftliche Argumente plausibel? Fakten korrekt?" },
  { name: "Gesundheitspolitischer Prüfer", focus: "Gesundheitliche Aussagen korrekt? Keine irreführenden Behauptungen? Wenn kein Gesundheitsthema: automatisch APPROVED." },
  { name: "Historischer Kontextprüfer", focus: "Historische Referenzen korrekt? Mitte-Standpunkt historisch fundiert?" },
  { name: "Sprachlicher Präzisionsprüfer", focus: "Begriffe korrekt und präzise? Zitate realistisch? Ton sachlich?" },
  { name: "Quellen-Plausibilitätsprüfer", focus: "Quellen echte existierende Medien/Organisationen? WICHTIG: Wenn keine expliziten Quellen angegeben sind, ist das KEIN Ablehnungsgrund — der Artikel-Link selbst ist die Quelle." },
  { name: "Bias-Detektor", focus: "Linke Position fair? Rechte Position fair? Mitte ausgewogen? Strohmann-Argumente?" },
  { name: "Abschluss-Integritätsprüfer", focus: "Titel/Links/Rechts/Mitte ZWEIFELSFREI zum selben Thema? Publizierbar?" },
];

async function runVerification(topic: any, apiKey: string, sourceUrl: string): Promise<{ approved: boolean; rejectedBy: string[]; reasons: string[] }> {
  const formatSources = (sources: unknown): string => {
    if (!Array.isArray(sources) || sources.length === 0) return "keine expliziten Quellen";
    return sources
      .map((s: any) => {
        const label = typeof s?.label === "string" && s.label.trim() ? s.label.trim() : "Unbekannte Quelle";
        const url = typeof s?.url === "string" && s.url.trim() ? s.url.trim() : "";
        return url ? `${label} (${url})` : label;
      })
      .join("; ");
  };

  const hasExplicitSources =
    (Array.isArray(topic?.left_sources) && topic.left_sources.length > 0) ||
    (Array.isArray(topic?.right_sources) && topic.right_sources.length > 0);

  const topicText = `TITEL: ${topic.topic}
ARTIKEL-QUELLE (verlinkter Einreichungslink): ${sourceUrl}
LINKS: ${topic.left_position}
  Zitat: „${topic.left_quote}" — ${topic.left_speaker}
  Quellen: ${formatSources(topic.left_sources)}
RECHTS: ${topic.right_position}
  Zitat: „${topic.right_quote}" — ${topic.right_speaker}
  Quellen: ${formatSources(topic.right_sources)}
MITTE: ${topic.mitte_view}`;

  const results = await Promise.all(
    VERIFICATION_PERSPECTIVES.map(async (p) => {
      try {
        const res = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
          method: "POST",
          headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
          body: JSON.stringify({
            model: "google/gemini-2.5-flash-lite",
            messages: [
              { role: "system", content: `Du bist "${p.name}". Fokus: ${p.focus}\nAntworte NUR mit JSON: {"approved": true/false, "reason": "..."}` },
              { role: "user", content: `Prüfe dieses Thema:\n\n${topicText}\n\nJSON-Antwort:` },
            ],
          }),
        });
        if (!res.ok) return { name: p.name, approved: false, reason: `API error ${res.status}` };
        const data = await res.json();
        let raw = data.choices?.[0]?.message?.content || "";
        raw = raw.replace(/```json\n?/g, "").replace(/```\n?/g, "").trim();
        const parsed = JSON.parse(raw);
        return { name: p.name, approved: parsed.approved !== false, reason: parsed.reason || "" };
      } catch (e) {
        return { name: p.name, approved: false, reason: "Parse/network error" };
      }
    })
  );

  const normalizedResults = results.map((r) => {
    const isSourceVerifier = r.name === "Quellen-Plausibilitätsprüfer";
    const missingExplicitSourcesOnly = /keine\s+(expliziten|konkreten)\s+quellen|keine\s+quellenangaben|rein\s+deskriptiv|hypothetisch/i.test(r.reason || "");

    if (isSourceVerifier && !hasExplicitSources && sourceUrl && missingExplicitSourcesOnly) {
      return {
        ...r,
        approved: true,
        reason: "Artikel-Link ist als Primärquelle vorhanden.",
      };
    }

    return r;
  });

  const rejectedBy: string[] = [];
  const reasons: string[] = [];
  for (const r of normalizedResults) {
    if (!r.approved) {
      rejectedBy.push(r.name);
      if (r.reason) reasons.push(`[${r.name}]: ${r.reason}`);
    }
  }
  return { approved: rejectedBy.length === 0, rejectedBy, reasons };
}

async function generateTopicFromUrl(url: string, apiKey: string): Promise<any> {
  const aiRes = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
    method: "POST",
    headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      model: "google/gemini-2.5-flash",
      response_format: { type: "json_object" },
      messages: [
        {
          role: "system",
          content: `Du bist ein redaktioneller KI-Assistent für "Das Denkt Deutschland". Du erhältst einen Link zu einem Nachrichtenartikel und musst daraus EIN politisches Thema generieren.

REGELN:
- Das Thema muss sich EXAKT auf den verlinkten Artikel beziehen
- Links = progressive Position
- Rechts = konservative Position
- Mitte = ausgewogene, historisch bewusste Einordnung (3-5 Sätze)
- tag_type: "gleich", "gegensaetzlich" oder "teilweise"
- category: immer "politik"
- KEINE erfundenen Zitate — wenn unklar, nutze "Politische Beobachter" o.ä.
- Gib echte URLs zu Nachrichtenartikeln an. Wenn unsicher, "url" leer lassen ("")
- Quellen: nur echte Medien/Organisationen mit echten Links

WICHTIG: Antworte AUSSCHLIESSLICH mit einem validen JSON-Objekt. Kein Text davor oder danach. Kein Markdown.`,
        },
        {
          role: "user",
          content: `Analysiere diesen Artikel und generiere ein Thema als JSON: ${url}

Exakte JSON-Struktur (keine anderen Felder):
{
  "topic": "Thementitel",
  "tag_type": "gleich" | "gegensaetzlich" | "teilweise",
  "category": "politik",
  "left_position": "...", "left_quote": "...", "left_speaker": "...",
  "left_hidden_meaning": "...", "left_negative_effects": "...",
  "left_sources": [{"type": "article", "label": "Quellenname", "url": "https://echte-url.de/..."}],
  "right_position": "...", "right_quote": "...", "right_speaker": "...",
  "right_hidden_meaning": "...", "right_negative_effects": "...",
  "right_sources": [{"type": "article", "label": "Quellenname", "url": "https://echte-url.de/..."}],
  "mitte_view": "..."
}`,
        },
      ],
    }),
  });

  if (!aiRes.ok) {
    const errText = await aiRes.text();
    console.error("AI error:", aiRes.status, errText);
    throw new Error(`AI error: ${aiRes.status}`);
  }

  const aiData = await aiRes.json();
  let content = aiData.choices?.[0]?.message?.content || "";
  content = content.replace(/```json\n?/g, "").replace(/```\n?/g, "").trim();

  const jsonMatch = content.match(/\{[\s\S]*\}/);
  if (!jsonMatch) {
    console.error("AI returned non-JSON:", content.substring(0, 200));
    throw new Error("Die AI konnte den Artikel nicht verarbeiten. Bitte versuche einen anderen Link.");
  }

  return JSON.parse(jsonMatch[0]);
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { url } = await req.json();
    if (!url || typeof url !== "string" || url.length > 500) {
      return new Response(JSON.stringify({ error: "Ungültige URL" }), { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY not configured");

    const SUPABASE_URL = Deno.env.get("SUPABASE_URL");
    const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
    if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) throw new Error("Supabase not configured");

    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

    // Save suggestion
    await supabase.from("topic_suggestions").insert({ title: url, url });

    const maxAttempts = 3;
    let topic: any = null;
    let verification: { approved: boolean; rejectedBy: string[]; reasons: string[] } | null = null;

    for (let attempt = 1; attempt <= maxAttempts; attempt++) {
      try {
        console.log(`Attempt ${attempt}/${maxAttempts}: Generating topic from URL:`, url);
        topic = await generateTopicFromUrl(url, LOVABLE_API_KEY);
        console.log("Generated topic:", topic.topic);

        console.log(`Attempt ${attempt}/${maxAttempts}: Running 10-fold verification...`);
        verification = await runVerification(topic, LOVABLE_API_KEY, url);

        if (verification.approved) {
          break;
        }

        console.warn(`Attempt ${attempt}/${maxAttempts} REJECTED:`, verification.rejectedBy.join(", "));
      } catch (attemptError) {
        console.error(`Attempt ${attempt}/${maxAttempts} failed:`, attemptError);
        if (attempt === maxAttempts) throw attemptError;
      }
    }

    if (!verification?.approved || !topic) {
      return new Response(
        JSON.stringify({
          success: false,
          error: "Das Thema hat die Qualitätsprüfung nicht bestanden.",
          details: verification?.reasons ?? ["Bitte mit einem weiteren Link erneut versuchen."],
        }),
        { status: 422, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Step 3: Save approved topic
    console.log("Topic approved! Saving...");
    const today = new Date().toISOString().split("T")[0];

    const row = {
      topic: topic.topic,
      tag_type: topic.tag_type,
      category: "politik",
      left_position: topic.left_position,
      left_quote: topic.left_quote,
      left_speaker: topic.left_speaker,
      left_hidden_meaning: topic.left_hidden_meaning || null,
      left_negative_effects: topic.left_negative_effects || null,
      left_sources: topic.left_sources || [],
      right_position: topic.right_position,
      right_quote: topic.right_quote,
      right_speaker: topic.right_speaker,
      right_hidden_meaning: topic.right_hidden_meaning || null,
      right_negative_effects: topic.right_negative_effects || null,
      right_sources: topic.right_sources || [],
      mitte_view: topic.mitte_view,
      published_at: today,
    };

    const { data, error } = await supabase.from("topics").insert(row).select();
    if (error) throw new Error(`DB error: ${error.message}`);

    return new Response(
      JSON.stringify({ success: true, topic: data[0] }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Error:", error);
    const msg = error instanceof Error ? error.message : "Unknown error";
    return new Response(JSON.stringify({ success: false, error: msg }), { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
  }
});
