import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const SYSTEM_PROMPT = `Du bist ein redaktioneller KI-Assistent für "Das Denkt Deutschland" — eine Plattform, die aktuelle politische Themen aus drei Perspektiven darstellt: Links, Rechts und Die Mitte.

AUFGABE: Generiere genau 10 aktuelle deutsche politische Nachrichtenthemen mit folgender Struktur für jedes Thema.

REGELN:
- Jedes Thema muss ein aktuelles, relevantes Thema der deutschen Politik/Gesellschaft sein
- Links = progressive, egalitäre, ökologische, kollektivistische Position
- Rechts = konservative, nationale, marktwirtschaftliche, traditionsbewahrende Position
- Mitte = informiert, historisch bewusst, realistisch, weder zynisch noch naiv
- tag_type: "gleich" wenn beide Seiten ähnlich denken, "gegensaetzlich" bei starkem Gegensatz, "teilweise" bei Teilüberschneidungen
- category: immer "politik"
- Alle 10 Themen müssen category "politik" haben — KEIN Boulevard
- Zitate müssen realistisch klingen und einer benannten Person/Organisation zugeordnet sein
- hidden_meaning und negative_effects sollen ehrlich und kritisch beide Seiten beleuchten
- Die Mitte-Perspektive soll 3-5 Sätze lang sein, historisch verankert und ausgewogen

THEMEN-INTEGRITÄT — EXTREM WICHTIG:
- Jedes Thema muss GENAU EIN konkretes Ereignis oder EINE konkrete Debatte behandeln
- NIEMALS verschiedene Nachrichten, Personen oder Debatten in einem Thema vermischen
- Wenn eine Person zitiert wird, muss das Zitat nachweislich von dieser Person stammen — KEINE erfundenen oder zugeschriebenen Zitate
- Zitate die nicht eindeutig einer konkreten Person zugeordnet werden können, MÜSSEN als "Konservative Kommentatoren" o.ä. gekennzeichnet werden, NIEMALS einer konkreten Person in den Mund gelegt werden
- Verwechsle NICHT Personen die ein Thema kommentieren mit Personen die vom Thema betroffen sind

QUELLEN — EXTREM WICHTIG:
- Generiere KEINE URLs. URLs sind verboten, da sie fast immer falsch sind.
- Gib stattdessen nur den Namen der Quelle an (z.B. "Spiegel Online", "ARD Tagesschau", "DIW Studie 2024")
- Das Feld "url" muss immer ein leerer String "" sein
- Quellen müssen echte, existierende Organisationen, Medien oder Studien sein
- Erfinde KEINE Quellen. Wenn du dir nicht sicher bist, lass die Quelle weg.
- Es darf NICHTS Erfundenes oder Falsches generiert werden.

Antworte NUR mit dem JSON-Array, keine weiteren Erklärungen.`;

const USER_PROMPT = `Generiere 10 aktuelle deutsche politische Nachrichtenthemen für heute. Beziehe dich auf reale aktuelle Ereignisse und Debatten in Deutschland. NUR Politik, KEIN Boulevard.

Jedes Thema als JSON-Objekt mit dieser Struktur:
{
  "topic": "Thementitel",
  "tag_type": "gleich" | "gegensaetzlich" | "teilweise",
  "category": "politik",
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
- Alle 10 Themen mit category "politik" — KEIN Boulevard
- KEINE URLs generieren! "url" muss IMMER "" sein. Nur den Quellennamen im "label".
- Es darf NICHTS Erfundenes auf der Seite landen.
- Jedes Thema = EIN Ereignis. Keine Vermischung verschiedener Nachrichten oder Personen.

Antworte NUR mit einem JSON-Array von 10 Objekten.`;

// ─── 10 verification perspectives ───────────────────────────────────────────
const VERIFICATION_PERSPECTIVES = [
  {
    name: "Politischer Faktenprüfer",
    prompt: `Du bist ein politischer Faktenprüfer. Prüfe dieses Thema auf:
- Ist der Titel korrekt und beschreibt genau EIN Ereignis?
- Passt die linke Position tatsächlich zum Titel?
- Passt die rechte Position tatsächlich zum Titel?
- Passt die Mitte-Perspektive zum Titel?
- Werden verschiedene Ereignisse vermischt?`,
  },
  {
    name: "Personen-Zuordnungsprüfer",
    prompt: `Du bist ein Experte für Personenzuordnung in Nachrichten. Prüfe:
- Werden Zitate der richtigen Person zugeordnet?
- Wird eine Person, die das Thema kommentiert, mit einer betroffenen Person verwechselt?
- Werden Aussagen fälschlicherweise einer konkreten Person in den Mund gelegt?
- Stimmen Sprecher und Zitat zusammen?`,
  },
  {
    name: "Gesellschaftlicher Kohärenzprüfer",
    prompt: `Du bist ein Gesellschaftsanalyst. Prüfe:
- Beschreibt das Thema eine echte gesellschaftliche Debatte?
- Passen Links, Rechts und Mitte logisch zum selben Thema?
- Werden gesellschaftliche Aspekte korrekt dargestellt?
- Ist die Darstellung fair und nicht irreführend?`,
  },
  {
    name: "Wirtschaftlicher Plausibilitätsprüfer",
    prompt: `Du bist ein Wirtschaftsexperte. Prüfe:
- Falls wirtschaftliche Argumente gemacht werden: Sind sie plausibel?
- Werden wirtschaftliche Fakten korrekt dargestellt?
- Passen wirtschaftliche Positionen zum Thementitel?
- Werden Links und Rechts korrekt wirtschaftlich eingeordnet?`,
  },
  {
    name: "Gesundheitspolitischer Prüfer",
    prompt: `Du bist ein Gesundheitsexperte. Prüfe:
- Falls gesundheitliche Aspekte erwähnt werden: Sind sie korrekt?
- Werden medizinische oder gesundheitliche Behauptungen korrekt dargestellt?
- Passen gesundheitliche Argumente zum Thementitel?
- Gibt es irreführende Gesundheitsaussagen?`,
  },
  {
    name: "Historischer Kontextprüfer",
    prompt: `Du bist Historiker. Prüfe:
- Werden historische Vergleiche oder Referenzen korrekt verwendet?
- Ist der Mitte-Standpunkt historisch fundiert?
- Werden keine falschen historischen Parallelen gezogen?
- Ist der historische Kontext angemessen?`,
  },
  {
    name: "Sprachlicher Präzisionsprüfer",
    prompt: `Du bist Linguist und Medienethiker. Prüfe:
- Werden Begriffe korrekt und präzise verwendet?
- Werden Sachverhalte sprachlich korrekt dargestellt, nicht aufgebauscht?
- Sind Zitate realistisch formuliert?
- Ist der Ton sachlich und fair für alle Perspektiven?`,
  },
  {
    name: "Quellen-Plausibilitätsprüfer",
    prompt: `Du bist Quellenanalyst. Prüfe:
- Sind die genannten Quellen echte, existierende Medien oder Organisationen?
- Passen die Quellen zum jeweiligen Thema?
- Werden keine erfundenen Quellen oder Studien zitiert?
- Sind Quellentypen (article, video, quote) korrekt zugeordnet?`,
  },
  {
    name: "Bias-Detektor",
    prompt: `Du bist ein Bias-Detektor. Prüfe:
- Wird die linke Position fair dargestellt (nicht karikiert)?
- Wird die rechte Position fair dargestellt (nicht karikiert)?
- Ist die Mitte wirklich ausgewogen oder tendiert sie zu einer Seite?
- Werden Strohmann-Argumente verwendet?`,
  },
  {
    name: "Abschluss-Integritätsprüfer",
    prompt: `Du bist der finale Integritätsprüfer. Mache einen Gesamtcheck:
- Gehören Titel, Links, Rechts und Mitte ZWEIFELSFREI zum selben Thema?
- Gibt es IRGENDEINEN Widerspruch oder eine Vermischung?
- Würde ein informierter Leser sofort erkennen, dass alles zusammenpasst?
- Ist das Thema als Ganzes publizierbar ohne Risiko von Fehlinformation?`,
  },
];

function buildVerificationPrompt(perspective: typeof VERIFICATION_PERSPECTIVES[0], topic: any): string {
  return `${perspective.prompt}

Hier ist das zu prüfende Thema:

TITEL: ${topic.topic}

LINKS:
- Position: ${topic.left_position}
- Zitat: „${topic.left_quote}" — ${topic.left_speaker}
- Versteckte Bedeutung: ${topic.left_hidden_meaning || "–"}
- Negative Auswirkungen: ${topic.left_negative_effects || "–"}

RECHTS:
- Position: ${topic.right_position}
- Zitat: „${topic.right_quote}" — ${topic.right_speaker}
- Versteckte Bedeutung: ${topic.right_hidden_meaning || "–"}
- Negative Auswirkungen: ${topic.right_negative_effects || "–"}

MITTE: ${topic.mitte_view}

Antworte NUR mit einem JSON-Objekt:
{
  "approved": true/false,
  "reason": "Kurze Begründung falls abgelehnt, sonst leer"
}`;
}

async function verifyTopic(
  topic: any,
  apiKey: string,
): Promise<{ approved: boolean; rejectedBy: string[]; reasons: string[] }> {
  const rejectedBy: string[] = [];
  const reasons: string[] = [];

  // Run all 10 checks in parallel
  const results = await Promise.all(
    VERIFICATION_PERSPECTIVES.map(async (perspective) => {
      try {
        const res = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
          method: "POST",
          headers: {
            Authorization: `Bearer ${apiKey}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            model: "google/gemini-2.5-flash-lite",
            messages: [
              {
                role: "system",
                content: "Du bist ein strenger Faktenprüfer. Antworte NUR mit dem geforderten JSON-Objekt.",
              },
              { role: "user", content: buildVerificationPrompt(perspective, topic) },
            ],
          }),
        });

        if (!res.ok) {
          // On API error, fail safe — reject the topic
          const errText = await res.text();
          console.error(`Verification "${perspective.name}" API error: ${res.status}`, errText);
          return { name: perspective.name, approved: false, reason: `API error ${res.status}` };
        }

        const data = await res.json();
        let raw = data.choices?.[0]?.message?.content || "";
        raw = raw.replace(/```json\n?/g, "").replace(/```\n?/g, "").trim();

        const parsed = JSON.parse(raw);
        return {
          name: perspective.name,
          approved: parsed.approved === true,
          reason: parsed.reason || "",
        };
      } catch (e) {
        console.error(`Verification "${perspective.name}" failed:`, e);
        return { name: perspective.name, approved: false, reason: "Parse/network error" };
      }
    })
  );

  for (const r of results) {
    if (!r.approved) {
      rejectedBy.push(r.name);
      if (r.reason) reasons.push(`[${r.name}]: ${r.reason}`);
    }
  }

  return { approved: rejectedBy.length === 0, rejectedBy, reasons };
}

// ─── URL validation ─────────────────────────────────────────────────────────
async function isUrlReachable(url: string): Promise<boolean> {
  if (!url || url.trim() === "") return false;
  try {
    const res = await fetch(url, {
      method: "HEAD",
      redirect: "follow",
      signal: AbortSignal.timeout(5000),
    });
    return res.ok;
  } catch {
    return false;
  }
}

async function sanitizeSources(sources: any[]): Promise<any[]> {
  if (!Array.isArray(sources)) return [];
  return Promise.all(
    sources.map(async (s: any) => {
      const url = s.url?.trim() || "";
      const reachable = url ? await isUrlReachable(url) : false;
      return { type: s.type || "article", label: s.label || "", url: reachable ? url : "" };
    })
  );
}

// ─── Main handler ───────────────────────────────────────────────────────────
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

    // ── Step 1: Generate topics ──
    console.log("Step 1/3: Generating topics via AI...");

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
    content = content.replace(/```json\n?/g, "").replace(/```\n?/g, "").trim();

    const topicsArray = JSON.parse(content);
    if (!Array.isArray(topicsArray) || topicsArray.length === 0) {
      throw new Error("AI returned invalid topics format");
    }

    console.log(`Generated ${topicsArray.length} topics. Starting 10-pass verification...`);

    // ── Step 2: 10-pass verification for each topic ──
    console.log("Step 2/3: Running 10-pass verification on each topic...");

    const verificationResults = await Promise.all(
      topicsArray.map(async (topic: any, idx: number) => {
        const result = await verifyTopic(topic, LOVABLE_API_KEY);
        if (result.approved) {
          console.log(`  ✅ Topic ${idx + 1} "${topic.topic}" — ALL 10 checks passed`);
        } else {
          console.warn(
            `  ❌ Topic ${idx + 1} "${topic.topic}" — REJECTED by: ${result.rejectedBy.join(", ")}`
          );
          for (const r of result.reasons) console.warn(`     ${r}`);
        }
        return { topic, ...result };
      })
    );

    const approvedTopics = verificationResults.filter((r) => r.approved).map((r) => r.topic);
    const rejectedCount = verificationResults.length - approvedTopics.length;

    console.log(`Verification complete: ${approvedTopics.length} approved, ${rejectedCount} rejected`);

    if (approvedTopics.length === 0) {
      return new Response(
        JSON.stringify({
          success: false,
          error: "All topics failed verification. None published.",
          details: verificationResults
            .filter((r) => !r.approved)
            .map((r) => ({ topic: r.topic.topic, rejectedBy: r.rejectedBy, reasons: r.reasons })),
        }),
        { status: 422, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // ── Step 3: Save approved topics ──
    console.log("Step 3/3: Saving approved topics...");

    const today = new Date().toISOString().split("T")[0];

    const rows = await Promise.all(
      approvedTopics.map(async (t: any) => ({
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

    const { data, error } = await supabase.from("topics").insert(rows).select();

    if (error) {
      console.error("Database insert error:", error);
      throw new Error(`Failed to save topics: ${error.message}`);
    }

    console.log(`Successfully saved ${data.length} verified topics (${rejectedCount} rejected)`);

    return new Response(
      JSON.stringify({
        success: true,
        count: data.length,
        rejected: rejectedCount,
        rejectionDetails: verificationResults
          .filter((r) => !r.approved)
          .map((r) => ({ topic: r.topic.topic, rejectedBy: r.rejectedBy, reasons: r.reasons })),
        topics: data,
      }),
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
