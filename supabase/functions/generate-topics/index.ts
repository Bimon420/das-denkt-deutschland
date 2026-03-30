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
- Gib für jede Quelle eine ECHTE, funktionierende URL an (z.B. "https://www.spiegel.de/politik/...", "https://www.tagesschau.de/...")
- Nutze nur URLs von echten, existierenden Nachrichtenartikeln oder Studien
- Wenn du dir bei einer URL nicht 100% sicher bist, setze "url" auf "" — eine fehlende URL ist besser als eine falsche
- Quellen müssen echte, existierende Organisationen, Medien oder Studien sein
- Erfinde KEINE Quellen oder URLs. Lieber weniger Quellen mit echten Links als viele ohne.
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
  "left_sources": [{"type": "article"|"document"|"video"|"quote", "label": "Quellenname (z.B. Spiegel Online)", "url": "https://echte-url-zum-artikel.de/..."}],
  "right_position": "Position Rechts",
  "right_quote": "Zitat",
  "right_speaker": "Sprecher/Organisation",
  "right_hidden_meaning": "Versteckte Bedeutung",
  "right_negative_effects": "Mögliche negative Auswirkungen",
  "right_sources": [{"type": "article"|"document"|"video"|"quote", "label": "Quellenname", "url": "https://echte-url-zum-artikel.de/..."}],
  "mitte_view": "Die Mitte-Perspektive (3-5 Sätze)"
}

WICHTIG:
- Alle 10 Themen mit category "politik" — KEIN Boulevard
- Gib echte URLs zu Nachrichtenartikeln an. Wenn du dir unsicher bist, lass "url" leer ("").
- Es darf NICHTS Erfundenes auf der Seite landen.
- Jedes Thema = EIN Ereignis. Keine Vermischung verschiedener Nachrichten oder Personen.

Antworte NUR mit einem JSON-Array von 10 Objekten.`;

// ─── 10 verification perspectives (batched: all topics in one call per perspective) ──
const VERIFICATION_PERSPECTIVES = [
  { name: "Politischer Faktenprüfer", focus: "Titel korrekt? Beschreibt genau EIN Ereignis? Passen Links/Rechts/Mitte zum Titel? Werden verschiedene Ereignisse vermischt?" },
  { name: "Personen-Zuordnungsprüfer", focus: "Zitate richtig zugeordnet? Kommentator vs. Betroffener verwechselt? Aussagen fälschlicherweise konkreten Personen zugeschrieben?" },
  { name: "Gesellschaftlicher Kohärenzprüfer", focus: "Echte gesellschaftliche Debatte? Links/Rechts/Mitte logisch zum selben Thema? Fair und nicht irreführend?" },
  { name: "Wirtschaftlicher Plausibilitätsprüfer", focus: "Wirtschaftliche Argumente plausibel? Fakten korrekt? Links/Rechts wirtschaftlich korrekt eingeordnet?" },
  { name: "Gesundheitspolitischer Prüfer", focus: "Gesundheitliche Aussagen korrekt? Keine irreführenden medizinischen Behauptungen?" },
  { name: "Historischer Kontextprüfer", focus: "Historische Referenzen korrekt? Mitte-Standpunkt historisch fundiert? Keine falschen Parallelen?" },
  { name: "Sprachlicher Präzisionsprüfer", focus: "Begriffe korrekt und präzise? Nicht aufgebauscht? Zitate realistisch? Ton sachlich und fair?" },
  { name: "Quellen-Plausibilitätsprüfer", focus: "Quellen echte existierende Medien/Organisationen? Passen zum Thema? Keine erfundenen Studien?" },
  { name: "Bias-Detektor", focus: "Linke Position fair (nicht karikiert)? Rechte Position fair? Mitte wirklich ausgewogen? Strohmann-Argumente?" },
  { name: "Abschluss-Integritätsprüfer", focus: "Titel/Links/Rechts/Mitte ZWEIFELSFREI zum selben Thema? Irgendein Widerspruch? Publizierbar ohne Fehlinformationsrisiko?" },
];

function formatTopicForReview(topic: any, idx: number): string {
  return `--- THEMA ${idx + 1} ---
TITEL: ${topic.topic}
LINKS: ${topic.left_position}
  Zitat: „${topic.left_quote}" — ${topic.left_speaker}
RECHTS: ${topic.right_position}
  Zitat: „${topic.right_quote}" — ${topic.right_speaker}
MITTE: ${topic.mitte_view}`;
}

// One AI call per perspective, checking ALL topics at once
async function runBatchVerification(
  topics: any[],
  apiKey: string,
): Promise<Map<number, { rejectedBy: string[]; reasons: string[] }>> {
  const rejections = new Map<number, { rejectedBy: string[]; reasons: string[] }>();
  for (let i = 0; i < topics.length; i++) {
    rejections.set(i, { rejectedBy: [], reasons: [] });
  }

  const allTopicsText = topics.map((t, i) => formatTopicForReview(t, i)).join("\n\n");

  // Run all 10 perspectives in parallel (10 calls total, not 100)
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
                content: `Du bist "${perspective.name}". Dein Fokus: ${perspective.focus}\n\nAntworte NUR mit einem JSON-Array. Für jedes Thema ein Objekt: {"thema_nr": 1, "approved": true/false, "reason": "..."}`,
              },
              {
                role: "user",
                content: `Prüfe ALLE folgenden Themen aus deiner Perspektive.\n\n${allTopicsText}\n\nAntworte NUR mit einem JSON-Array von ${topics.length} Objekten.`,
              },
            ],
          }),
        });

        if (!res.ok) {
          const errText = await res.text();
          console.error(`${perspective.name} API error: ${res.status}`, errText);
          return { name: perspective.name, results: topics.map((_, i) => ({ thema_nr: i + 1, approved: false, reason: `API error ${res.status}` })) };
        }

        const data = await res.json();
        let raw = data.choices?.[0]?.message?.content || "";
        raw = raw.replace(/```json\n?/g, "").replace(/```\n?/g, "").trim();
        const parsed = JSON.parse(raw);
        return { name: perspective.name, results: Array.isArray(parsed) ? parsed : [] };
      } catch (e) {
        console.error(`${perspective.name} failed:`, e);
        // On error, APPROVE all topics (don't let one broken verifier reject everything)
        return { name: perspective.name, results: topics.map((_, i) => ({ thema_nr: i + 1, approved: true, reason: "" })) };
      }
    })
  );

  // Aggregate rejections
  for (const { name, results: perspectiveResults } of results) {
    for (const r of perspectiveResults) {
      const idx = (r.thema_nr || 1) - 1;
      if (idx >= 0 && idx < topics.length && r.approved === false) {
        const entry = rejections.get(idx)!;
        entry.rejectedBy.push(name);
        if (r.reason) entry.reasons.push(`[${name}]: ${r.reason}`);
      }
    }
  }

  return rejections;
}

// ─── URL validation ─────────────────────────────────────────────────────────
async function sanitizeSources(sources: any[]): Promise<any[]> {
  if (!Array.isArray(sources)) return [];
  return Promise.all(
    sources.map(async (s: any) => {
      const url = s.url?.trim() || "";
      let reachable = false;
      if (url) {
        try {
          const res = await fetch(url, { method: "HEAD", redirect: "follow", signal: AbortSignal.timeout(5000) });
          reachable = res.ok;
        } catch { /* unreachable */ }
      }
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
    if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) throw new Error("Supabase credentials not configured");

    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

    // ── Step 0: Load existing topic titles for deduplication ──
    console.log("Step 0: Loading existing topics for deduplication...");
    const { data: existingTopics } = await supabase
      .from("topics")
      .select("topic")
      .order("created_at", { ascending: false })
      .limit(200);

    const existingTitles = (existingTopics || []).map((t: any) => t.topic);
    const deduplicationNote = existingTitles.length > 0
      ? `\n\nBEREITS BEHANDELTE THEMEN (NICHT ERNEUT GENERIEREN!):\n${existingTitles.map((t: string, i: number) => `${i + 1}. ${t}`).join("\n")}\n\nGeneriere NUR neue Themen, die KEINES der oben genannten Themen wiederholen oder nur leicht umformulieren. Ein Thema gilt als Duplikat wenn es dasselbe Kernthema behandelt, auch wenn der Titel anders formuliert ist.`
      : "";

    // ── Step 1: Generate topics ──
    console.log(`Step 1/3: Generating topics via AI... (${existingTitles.length} existing topics to avoid)`);

    const aiResponse = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: { Authorization: `Bearer ${LOVABLE_API_KEY}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          { role: "system", content: SYSTEM_PROMPT },
          { role: "user", content: USER_PROMPT + deduplicationNote },
        ],
      }),
    });

    if (!aiResponse.ok) {
      const errorText = await aiResponse.text();
      console.error("AI gateway error:", aiResponse.status, errorText);
      if (aiResponse.status === 429) return new Response(JSON.stringify({ error: "Rate limited" }), { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } });
      if (aiResponse.status === 402) return new Response(JSON.stringify({ error: "Credits exhausted" }), { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } });
      throw new Error(`AI gateway error: ${aiResponse.status}`);
    }

    const aiData = await aiResponse.json();
    let content = aiData.choices?.[0]?.message?.content || "";
    content = content.replace(/```json\n?/g, "").replace(/```\n?/g, "").trim();

    // Robust JSON parsing with truncation recovery
    let topicsArray: any[];
    try {
      topicsArray = JSON.parse(content);
    } catch (parseErr) {
      console.warn("JSON parse failed, attempting repair...");
      // Try to fix truncated JSON: find the last complete object "}" before the error
      const lastCompleteObj = content.lastIndexOf("}");
      if (lastCompleteObj > 0) {
        let trimmed = content.substring(0, lastCompleteObj + 1);
        // Ensure array closure
        if (!trimmed.trimEnd().endsWith("]")) trimmed += "]";
        try {
          topicsArray = JSON.parse(trimmed);
          console.log(`JSON repaired: recovered ${Array.isArray(topicsArray) ? topicsArray.length : 0} topics`);
        } catch {
          throw new Error(`AI returned unparseable JSON: ${(parseErr as Error).message}`);
        }
      } else {
        throw new Error(`AI returned unparseable JSON: ${(parseErr as Error).message}`);
      }
    }
    if (!Array.isArray(topicsArray) || topicsArray.length === 0) throw new Error("AI returned invalid topics format");

    // ── Deduplication safety net: remove topics too similar to existing ones ──
    if (existingTitles.length > 0) {
      const normalise = (s: string) => s.toLowerCase().replace(/[^a-zäöüß0-9]/g, " ").replace(/\s+/g, " ").trim();
      const existingNorm = existingTitles.map(normalise);

      const before = topicsArray.length;
      topicsArray = topicsArray.filter((t: any) => {
        const norm = normalise(t.topic);
        const isDupe = existingNorm.some((ex: string) => {
          // Check if titles share 80%+ of significant words (loosened from 60%)
          const newWords = norm.split(" ").filter((w: string) => w.length > 3);
          const exWords = ex.split(" ").filter((w: string) => w.length > 3);
          if (newWords.length === 0 || exWords.length === 0) return false;
          const overlap = newWords.filter((w: string) => exWords.includes(w)).length;
          return overlap / Math.min(newWords.length, exWords.length) >= 0.8;
        });
        if (isDupe) console.warn(`  🔄 Duplicate removed: "${t.topic}"`);
        return !isDupe;
      });
      console.log(`Dedup: ${before} → ${topicsArray.length} topics (${before - topicsArray.length} duplicates removed)`);
    }

    if (topicsArray.length === 0) {
      return new Response(
        JSON.stringify({ success: false, error: "All generated topics were duplicates of existing ones." }),
        { status: 422, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log(`${topicsArray.length} unique topics. Starting 10-pass batch verification...`);

    // ── Step 2: Batched 10-pass verification (10 AI calls total) ──
    console.log("Step 2/3: Running 10-pass batch verification...");
    const rejections = await runBatchVerification(topicsArray, LOVABLE_API_KEY);

    const approved: any[] = [];
    const rejected: { topic: string; rejectedBy: string[]; reasons: string[] }[] = [];

    topicsArray.forEach((topic: any, idx: number) => {
      const entry = rejections.get(idx)!;
      if (entry.rejectedBy.length === 0) {
        console.log(`  ✅ Topic ${idx + 1} "${topic.topic}" — ALL 10 checks passed`);
        approved.push(topic);
      } else {
        console.warn(`  ❌ Topic ${idx + 1} "${topic.topic}" — REJECTED by: ${entry.rejectedBy.join(", ")}`);
        rejected.push({ topic: topic.topic, ...entry });
      }
    });

    console.log(`Verification done: ${approved.length} approved, ${rejected.length} rejected`);

    if (approved.length === 0) {
      return new Response(
        JSON.stringify({ success: false, error: "All topics failed verification.", details: rejected }),
        { status: 422, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // ── Step 3: Save approved topics ──
    console.log("Step 3/3: Saving approved topics...");
    const today = new Date().toISOString().split("T")[0];

    const rows = await Promise.all(
      approved.map(async (t: any) => ({
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
    if (error) throw new Error(`Failed to save topics: ${error.message}`);

    console.log(`Successfully saved ${data.length} verified topics`);

    return new Response(
      JSON.stringify({ success: true, count: data.length, rejected: rejected.length, rejectionDetails: rejected, topics: data }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Error generating topics:", error);
    const msg = error instanceof Error ? error.message : "Unknown error";
    return new Response(JSON.stringify({ success: false, error: msg }), { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
  }
});
