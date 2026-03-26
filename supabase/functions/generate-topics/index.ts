import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const SYSTEM_PROMPT = `Du bist ein redaktioneller KI-Assistent für "Das Denkt Deutschland" — eine Plattform, die aktuelle politische Themen aus drei Perspektiven darstellt: Links, Rechts und Die Mitte.

AUFGABE: Generiere genau 10 aktuelle deutsche Nachrichtenthemen mit folgender Struktur für jedes Thema.

REGELN:
- Jedes Thema muss ein aktuelles, relevantes Thema der deutschen Politik/Gesellschaft sein
- Links = progressive, egalitäre, ökologische, kollektivistische Position
- Rechts = konservative, nationale, marktwirtschaftliche, traditionsbewahrende Position
- Mitte = informiert, historisch bewusst, realistisch, weder zynisch noch naiv
- tag_type: "gleich" wenn beide Seiten ähnlich denken, "gegensaetzlich" bei starkem Gegensatz, "teilweise" bei Teilüberschneidungen
- category: "politik" für politische Themen, "boulevard" für genau EIN Boulevard-/Promi-/Gesellschafts-Thema
- Genau 9 Themen mit category "politik" und genau 1 Thema mit category "boulevard"
- Zitate müssen realistisch klingen und einer benannten Person/Organisation zugeordnet sein
- hidden_meaning und negative_effects sollen ehrlich und kritisch beide Seiten beleuchten
- Die Mitte-Perspektive soll 3-5 Sätze lang sein, historisch verankert und ausgewogen

THEMEN-INTEGRITÄT — EXTREM WICHTIG:
- Jedes Thema muss GENAU EIN konkretes Ereignis oder EINE konkrete Debatte behandeln
- NIEMALS verschiedene Nachrichten, Personen oder Debatten in einem Thema vermischen
- Besonders bei Boulevard: Prüfe, ob alle Zitate, Positionen und Quellen sich auf DASSELBE Ereignis beziehen
- Wenn eine Person zitiert wird, muss das Zitat nachweislich von dieser Person stammen — KEINE erfundenen oder zugeschriebenen Zitate
- Zitate die nicht eindeutig einer konkreten Person zugeordnet werden können, MÜSSEN als "Konservative Kommentatoren" o.ä. gekennzeichnet werden, NIEMALS einer konkreten Person in den Mund gelegt werden
- Verwechsle NICHT Personen die ein Thema kommentieren mit Personen die vom Thema betroffen sind
- Prüfe bei Boulevard-Themen besonders: Geht es um Person A oder um Person B? Werden Aussagen richtig zugeordnet?

QUELLEN — EXTREM WICHTIG:
- Generiere KEINE URLs. URLs sind verboten, da sie fast immer falsch sind.
- Gib stattdessen nur den Namen der Quelle an (z.B. "Spiegel Online", "ARD Tagesschau", "DIW Studie 2024")
- Das Feld "url" muss immer ein leerer String "" sein
- Quellen müssen echte, existierende Organisationen, Medien oder Studien sein
- Erfinde KEINE Quellen. Wenn du dir nicht sicher bist, lass die Quelle weg.
- Es darf NICHTS Erfundenes oder Falsches generiert werden.

Antworte NUR mit dem JSON-Array, keine weiteren Erklärungen.`;

const USER_PROMPT = `Generiere 10 aktuelle deutsche Nachrichtenthemen für heute. Beziehe dich auf reale aktuelle Ereignisse und Debatten in Deutschland.

Jedes Thema als JSON-Objekt mit dieser Struktur:
{
  "topic": "Thementitel",
  "tag_type": "gleich" | "gegensaetzlich" | "teilweise",
  "category": "politik" | "boulevard",
  "left_position": "Position Links",
  "left_quote": "Zitat",
  "left_speaker": "Sprecher/Organisation",
  "left_hidden_meaning": "Versteckte Bedeutung",
  "left_negative_effects": "Mögliche negative Auswirkungen",
  "left_sources": [{"type": "article"|"document"|"video"|"quote", "label": "Quellenname (z.B. Spiegel Online)", "url": ""}],
  "right_position": "Position Rechts",
  "right_quote": "Zitat",
  "right_speaker": "Sprecher/Organisation",
  "right_hidden_meaning": "Versteckte Bedeutung",
  "right_negative_effects": "Mögliche negative Auswirkungen",
  "right_sources": [{"type": "article"|"document"|"video"|"quote", "label": "Quellenname", "url": ""}],
  "mitte_view": "Die Mitte-Perspektive (3-5 Sätze)"
}

WICHTIG:
- Genau 9x "politik" und 1x "boulevard"
- KEINE URLs generieren! "url" muss IMMER "" sein. Nur den Quellennamen im "label".
- Es darf NICHTS Erfundenes auf der Seite landen.

Antworte NUR mit einem JSON-Array von 10 Objekten.`;

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY is not configured");

    const SUPABASE_URL = Deno.env.get("SUPABASE_URL");
    const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
    if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
      throw new Error("Supabase credentials not configured");
    }

    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

    console.log("Calling AI to generate topics...");

    const aiResponse = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          { role: "system", content: SYSTEM_PROMPT },
          { role: "user", content: USER_PROMPT },
        ],
      }),
    });

    if (!aiResponse.ok) {
      const errorText = await aiResponse.text();
      console.error("AI gateway error:", aiResponse.status, errorText);
      if (aiResponse.status === 429) {
        return new Response(JSON.stringify({ error: "Rate limited, try again later" }), {
          status: 429,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (aiResponse.status === 402) {
        return new Response(JSON.stringify({ error: "Credits exhausted" }), {
          status: 402,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      throw new Error(`AI gateway error: ${aiResponse.status}`);
    }

    const aiData = await aiResponse.json();
    let content = aiData.choices?.[0]?.message?.content || "";

    // Strip markdown code fences if present
    content = content.replace(/```json\n?/g, "").replace(/```\n?/g, "").trim();

    console.log("Parsing AI response...");
    const topicsArray = JSON.parse(content);

    if (!Array.isArray(topicsArray) || topicsArray.length === 0) {
      throw new Error("AI returned invalid topics format");
    }

    const today = new Date().toISOString().split("T")[0];

    // Validate a single URL — returns true only if reachable (no 4xx/5xx)
    const isUrlReachable = async (url: string): Promise<boolean> => {
      if (!url || url.trim() === "") return false;
      try {
        const res = await fetch(url, {
          method: "HEAD",
          redirect: "follow",
          signal: AbortSignal.timeout(5000),
        });
        return res.ok; // 2xx only
      } catch {
        return false;
      }
    };

    // Validate all sources: check each URL, remove broken ones
    const sanitizeSources = async (sources: any[]): Promise<any[]> => {
      if (!Array.isArray(sources)) return [];
      const validated = await Promise.all(
        sources.map(async (s: any) => {
          const url = s.url?.trim() || "";
          const reachable = url ? await isUrlReachable(url) : false;
          return {
            type: s.type || "article",
            label: s.label || "",
            url: reachable ? url : "", // Only keep verified URLs
          };
        })
      );
      return validated;
    };

    // Insert topics into database — validate all URLs in parallel
    console.log("Validating source URLs...");
    const rows = await Promise.all(
      topicsArray.map(async (t: any) => ({
        topic: t.topic,
        tag_type: t.tag_type,
        category: t.category || "politik",
        left_position: t.left_position,
        left_quote: t.left_quote,
        left_speaker: t.left_speaker,
        left_hidden_meaning: t.left_hidden_meaning || null,
        left_negative_effects: t.left_negative_effects || null,
        left_sources: await sanitizeSources(t.left_sources),
        right_position: t.right_position,
        right_quote: t.right_quote,
        right_speaker: t.right_speaker,
        right_hidden_meaning: t.right_hidden_meaning || null,
        right_negative_effects: t.right_negative_effects || null,
        right_sources: await sanitizeSources(t.right_sources),
        mitte_view: t.mitte_view,
        published_at: today,
      }))
    );
    console.log("URL validation complete.");

    const { data, error } = await supabase.from("topics").insert(rows).select();

    if (error) {
      console.error("Database insert error:", error);
      throw new Error(`Failed to save topics: ${error.message}`);
    }

    console.log(`Successfully generated and saved ${data.length} topics`);

    return new Response(
      JSON.stringify({ success: true, count: data.length, topics: data }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Error generating topics:", error);
    const msg = error instanceof Error ? error.message : "Unknown error";
    return new Response(JSON.stringify({ success: false, error: msg }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});