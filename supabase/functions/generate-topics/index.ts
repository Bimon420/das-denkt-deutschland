import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

// ─── LLM: Anthropic direkt (weg von Lovable, Simon 07-10) ────────────────────
const MODEL_GEN = "claude-opus-5";
const MODEL_VERIFY = "claude-opus-5";

async function askClaude(opts: { apiKey: string; model: string; system: string; user: string; maxTokens: number }): Promise<string> {
  const res = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "x-api-key": opts.apiKey,
      "anthropic-version": "2023-06-01",
      "content-type": "application/json",
    },
    body: JSON.stringify({
      model: opts.model,
      max_tokens: opts.maxTokens,
      // Opus 5: Thinking default-AN zählt gegen max_tokens — hier aus (Paritäts-Migration)
      thinking: { type: "disabled" },
      system: opts.system,
      messages: [{ role: "user", content: opts.user }],
    }),
  });
  if (!res.ok) {
    const errText = await res.text();
    throw new Error(`Anthropic ${res.status}: ${errText.slice(0, 300)}`);
  }
  const data = await res.json();
  return (data.content ?? [])
    .filter((b: any) => b.type === "text")
    .map((b: any) => b.text)
    .join("");
}

// ─── ECHTE Nachrichten als Fundament ─────────────────────────────────────────
// Der Kernumbau (2026-07-10): Das LLM erfindet keine Themen/Quellen mehr aus dem
// Kopf. Stattdessen: RSS der großen Häuser fetchen → LLM clustert die ECHTEN
// Schlagzeilen zu Debatten und zitiert AUSSCHLIESSLICH Artikel aus dem Katalog.
// Jede Quelle auf der Seite ist damit klickbar und existierte vor dem Text.

const FEEDS = [
  { outlet: "tagesschau", lean: "öffentlich-rechtlich", url: "https://www.tagesschau.de/xml/rss2/" },
  { outlet: "Deutschlandfunk", lean: "öffentlich-rechtlich", url: "https://www.deutschlandfunk.de/politikportal-100.rss" },
  { outlet: "Spiegel", lean: "eher links-liberal", url: "https://www.spiegel.de/politik/index.rss" },
  { outlet: "Zeit", lean: "eher links-liberal", url: "https://newsfeed.zeit.de/politik/index" },
  { outlet: "Süddeutsche", lean: "eher links-liberal", url: "https://rss.sueddeutsche.de/rss/Politik" },
  { outlet: "taz", lean: "links", url: "https://taz.de/Politik/!p4615;rss/" },
  { outlet: "FAZ", lean: "konservativ-liberal", url: "https://www.faz.net/rss/aktuell/politik/" },
  { outlet: "Welt", lean: "konservativ", url: "https://www.welt.de/feeds/section/politik.rss" },
];

const MAX_PER_FEED = 20;
const MAX_AGE_HOURS = 72;

type Article = {
  id: number;
  outlet: string;
  lean: string;
  title: string;
  url: string;
  teaser: string;
  pubDate: string;
};

function decodeEntities(s: string): string {
  return s
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#0?39;|&apos;/g, "'")
    .replace(/&#(\d+);/g, (_, n) => String.fromCodePoint(Number(n)))
    .replace(/&nbsp;/g, " ");
}

function extractTag(block: string, tag: string): string {
  const m = block.match(new RegExp(`<${tag}[^>]*>([\\s\\S]*?)</${tag}>`, "i"));
  let v = m?.[1] ?? "";
  v = v.replace(/<!\[CDATA\[([\s\S]*?)\]\]>/g, "$1");
  v = v.replace(/<[^>]+>/g, " ");
  return decodeEntities(v).replace(/\s+/g, " ").trim();
}

function parseRss(xml: string, outlet: string, lean: string): Omit<Article, "id">[] {
  const out: Omit<Article, "id">[] = [];
  const blocks = xml.split(/<item[\s>]/).slice(1);
  for (const block of blocks.slice(0, MAX_PER_FEED)) {
    const title = extractTag(block, "title");
    const url = extractTag(block, "link");
    const teaser = extractTag(block, "description").slice(0, 220);
    const pubDate = extractTag(block, "pubDate");
    if (!title || !url.startsWith("http")) continue;
    // Nur frische Artikel (unparsbare Daten lassen wir durch)
    const ts = Date.parse(pubDate);
    if (!Number.isNaN(ts) && Date.now() - ts > MAX_AGE_HOURS * 3600_000) continue;
    out.push({ outlet, lean, title, url, teaser, pubDate });
  }
  return out;
}

async function fetchCatalog(): Promise<Article[]> {
  const results = await Promise.allSettled(
    FEEDS.map(async (f) => {
      const res = await fetch(f.url, {
        headers: { "User-Agent": "Mozilla/5.0 (DasDenktDeutschland-Bot)" },
        signal: AbortSignal.timeout(10_000),
      });
      if (!res.ok) throw new Error(`${f.outlet}: HTTP ${res.status}`);
      return parseRss(await res.text(), f.outlet, f.lean);
    })
  );
  const articles: Article[] = [];
  const seenUrls = new Set<string>();
  results.forEach((r, i) => {
    if (r.status === "rejected") {
      console.warn(`Feed ${FEEDS[i].outlet} failed:`, r.reason?.message ?? r.reason);
      return;
    }
    for (const a of r.value) {
      if (seenUrls.has(a.url)) continue;
      seenUrls.add(a.url);
      articles.push({ ...a, id: articles.length + 1 });
    }
  });
  return articles;
}

function catalogText(articles: Article[]): string {
  return articles
    .map((a) => `[${a.id}] (${a.outlet} · ${a.lean}) ${a.title} :: ${a.teaser}`)
    .join("\n");
}

// ─── Prompts ─────────────────────────────────────────────────────────────────
const SYSTEM_PROMPT = `Du bist ein redaktioneller KI-Assistent für "Das Denkt Deutschland" — eine Plattform, die aktuelle politische Themen aus drei Perspektiven darstellt: Links, Rechts und Die Mitte.

Du bekommst einen KATALOG ECHTER, HEUTE GEFETCHTER Nachrichtenartikel (nummeriert). Deine gesamte Arbeit gründet AUSSCHLIESSLICH auf diesem Katalog.

AUFGABE: Identifiziere die wichtigsten politischen Debatten des Tages (maximal 10) und stelle jede aus drei Perspektiven dar.

HARTE REGELN:
- Jedes Thema muss durch MINDESTENS ZWEI Katalog-Artikel belegt sein. Kein Thema ohne Beleg.
- Jedes Thema behandelt GENAU EIN konkretes Ereignis / EINE konkrete Debatte. Keine Vermischung.
- left_source_ids / right_source_ids: 1-3 Katalog-Nummern pro Seite, die diese Perspektive belegen oder das Ereignis berichten. NUR Nummern aus dem Katalog. Beide Seiten brauchen mindestens 1.
- Links = progressive, egalitäre, ökologische, kollektivistische Position
- Rechts = konservative, nationale, marktwirtschaftliche, traditionsbewahrende Position
- Mitte = informiert, historisch bewusst, realistisch, weder zynisch noch naiv (3-5 Sätze)
- tag_type: "gleich" | "gegensaetzlich" | "teilweise"
- category: immer "politik", KEIN Boulevard

ZITAT-REGELN (EXTREM WICHTIG):
- Ein WÖRTLICHES Zitat ist NUR erlaubt, wenn der Wortlaut 1:1 in Titel oder Teaser eines zitierten Katalog-Artikels steht.
- Sonst: formuliere die Kernposition des Lagers und setze als Sprecher eine GRUPPE ("Unionspolitiker", "Gewerkschaften", "Klimaaktivisten") — NIEMALS eine konkrete Person, der der Wortlaut nicht nachweislich gehört.
- Es darf NICHTS Erfundenes generiert werden. Was nicht im Katalog steht, behauptest du nicht.

Antworte NUR mit dem JSON-Array, keine weiteren Erklärungen.`;

function buildUserPrompt(catalog: string, deduplicationNote: string): string {
  return `Hier der Katalog echter Artikel von heute:

${catalog}

Identifiziere daraus die wichtigsten politischen Debatten (maximal 10) und liefere jedes Thema als JSON-Objekt:
{
  "topic": "Thementitel",
  "tag_type": "gleich" | "gegensaetzlich" | "teilweise",
  "category": "politik",
  "left_position": "Position Links",
  "left_quote": "Kernaussage (wörtlich NUR wenn 1:1 im Katalog)",
  "left_speaker": "Gruppe/Lager (konkrete Person NUR bei wörtlichem Katalog-Zitat)",
  "left_hidden_meaning": "Versteckte Bedeutung",
  "left_negative_effects": "Mögliche negative Auswirkungen",
  "left_source_ids": [Katalog-Nummern, 1-3],
  "right_position": "Position Rechts",
  "right_quote": "Kernaussage (wörtlich NUR wenn 1:1 im Katalog)",
  "right_speaker": "Gruppe/Lager (konkrete Person NUR bei wörtlichem Katalog-Zitat)",
  "right_hidden_meaning": "Versteckte Bedeutung",
  "right_negative_effects": "Mögliche negative Auswirkungen",
  "right_source_ids": [Katalog-Nummern, 1-3],
  "mitte_view": "Die Mitte-Perspektive (3-5 Sätze)"
}
${deduplicationNote}
Antworte NUR mit einem JSON-Array.`;
}

// ─── 10 verification perspectives (batched: all topics in one call per perspective) ──
const VERIFICATION_PERSPECTIVES = [
  { name: "Politischer Faktenprüfer", focus: "Titel korrekt? Beschreibt genau EIN Ereignis? Passen Links/Rechts/Mitte zum Titel? Wird das Thema von den zitierten Artikeln gedeckt?" },
  { name: "Quellen-Deckungsprüfer", focus: "Belegen die zitierten Artikel (Titel/Teaser mitgeliefert) tatsächlich das Thema und die jeweilige Perspektive? Wird etwas behauptet, das KEIN zitierter Artikel hergibt?" },
  { name: "Personen-Zuordnungsprüfer", focus: "Wörtliche Zitate nur mit Katalog-Beleg? Sprecher korrekt als Gruppe benannt, wenn kein Beleg? Keine konkrete Person ohne nachweisbaren Wortlaut?" },
  { name: "Gesellschaftlicher Kohärenzprüfer", focus: "Echte gesellschaftliche Debatte? Links/Rechts/Mitte logisch zum selben Thema? Fair und nicht irreführend?" },
  { name: "Wirtschaftlicher Plausibilitätsprüfer", focus: "Wirtschaftliche Argumente plausibel und von den Artikeln gedeckt? Links/Rechts wirtschaftlich korrekt eingeordnet?" },
  { name: "Historischer Kontextprüfer", focus: "Historische Referenzen korrekt? Mitte-Standpunkt historisch fundiert? Keine falschen Parallelen?" },
  { name: "Sprachlicher Präzisionsprüfer", focus: "Begriffe korrekt und präzise? Nicht aufgebauscht? Ton sachlich und fair?" },
  { name: "Bias-Detektor", focus: "Linke Position fair (nicht karikiert)? Rechte Position fair? Mitte wirklich ausgewogen? Strohmann-Argumente?" },
  { name: "Aktualitätsprüfer", focus: "Ist das Thema wirklich die aktuelle Debatte aus den zitierten Artikeln — oder ein generisches Dauerthema, das nur angeklebt wurde?" },
  { name: "Abschluss-Integritätsprüfer", focus: "Titel/Links/Rechts/Mitte ZWEIFELSFREI zum selben Thema? Quellen beider Seiten vorhanden? Publizierbar ohne Fehlinformationsrisiko?" },
];

function formatTopicForReview(topic: any, idx: number, articleById: Map<number, Article>): string {
  const cite = (ids: number[] | undefined) =>
    (ids || [])
      .map((id) => {
        const a = articleById.get(id);
        return a ? `    [${id}] (${a.outlet}) ${a.title} :: ${a.teaser.slice(0, 120)}` : `    [${id}] UNBEKANNT`;
      })
      .join("\n");
  return `--- THEMA ${idx + 1} ---
TITEL: ${topic.topic}
LINKS: ${topic.left_position}
  Aussage: „${topic.left_quote}" — ${topic.left_speaker}
  Quellen:
${cite(topic.left_source_ids)}
RECHTS: ${topic.right_position}
  Aussage: „${topic.right_quote}" — ${topic.right_speaker}
  Quellen:
${cite(topic.right_source_ids)}
MITTE: ${topic.mitte_view}`;
}

// One AI call per perspective, checking ALL topics at once.
// Fail-closed: bricht ein Prüfer ab, enthält er sich; brechen ≥3 ab, wird der ganze Lauf abgebrochen.
async function runBatchVerification(
  topics: any[],
  articleById: Map<number, Article>,
  apiKey: string,
): Promise<{ rejections: Map<number, { rejectedBy: string[]; reasons: string[] }>; failedPerspectives: string[] }> {
  const rejections = new Map<number, { rejectedBy: string[]; reasons: string[] }>();
  for (let i = 0; i < topics.length; i++) {
    rejections.set(i, { rejectedBy: [], reasons: [] });
  }

  const allTopicsText = topics.map((t, i) => formatTopicForReview(t, i, articleById)).join("\n\n");
  const failedPerspectives: string[] = [];

  const results = await Promise.all(
    VERIFICATION_PERSPECTIVES.map(async (perspective) => {
      try {
        let raw = await askClaude({
          apiKey,
          model: MODEL_VERIFY,
          maxTokens: 4000,
          system: `Du bist "${perspective.name}". Dein Fokus: ${perspective.focus}\n\nDie Themen wurden aus ECHTEN Artikeln generiert; die zitierten Artikel (Titel+Teaser) stehen bei jedem Thema. Prüfe gegen diese Belege, nicht gegen Vermutungen.\n\nAntworte NUR mit einem JSON-Array. Für jedes Thema ein Objekt: {"thema_nr": 1, "approved": true/false, "reason": "..."}`,
          user: `Prüfe ALLE folgenden Themen aus deiner Perspektive.\n\n${allTopicsText}\n\nAntworte NUR mit einem JSON-Array von ${topics.length} Objekten.`,
        });
        raw = raw.replace(/```json\n?/g, "").replace(/```\n?/g, "").trim();
        const arrMatch = raw.match(/\[[\s\S]*\]/);
        const parsed = JSON.parse(arrMatch ? arrMatch[0] : raw);
        return { name: perspective.name, failed: false, results: Array.isArray(parsed) ? parsed : [] };
      } catch (e) {
        console.error(`${perspective.name} failed:`, e);
        return { name: perspective.name, failed: true, results: [] as any[] };
      }
    })
  );

  for (const { name, failed, results: perspectiveResults } of results) {
    if (failed) {
      failedPerspectives.push(name);
      continue;
    }
    for (const r of perspectiveResults) {
      const idx = (r.thema_nr || 1) - 1;
      if (idx >= 0 && idx < topics.length && r.approved === false) {
        const entry = rejections.get(idx)!;
        entry.rejectedBy.push(name);
        if (r.reason) entry.reasons.push(`[${name}]: ${r.reason}`);
      }
    }
  }

  return { rejections, failedPerspectives };
}

// ─── Quellen aus Katalog-IDs bauen (URLs sind konstruktionsbedingt echt) ─────
function sourcesFromIds(ids: unknown, articleById: Map<number, Article>): any[] {
  if (!Array.isArray(ids)) return [];
  const seen = new Set<string>();
  const out: any[] = [];
  for (const rawId of ids.slice(0, 4)) {
    const a = articleById.get(Number(rawId));
    if (!a || seen.has(a.url)) continue;
    seen.add(a.url);
    out.push({ type: "article", label: a.outlet, url: a.url, title: a.title });
  }
  return out;
}

// ─── Main handler: antwortet sofort, Pipeline läuft im Hintergrund ──────────
// Sonnet braucht für 10 gründliche Themen länger als das ~150s-Response-Limit
// des Function-Gateways → EdgeRuntime.waitUntil; Ergebnis in topics/generation_logs.
serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const ANTHROPIC_API_KEY = Deno.env.get("ANTHROPIC_API_KEY");
    if (!ANTHROPIC_API_KEY) throw new Error("ANTHROPIC_API_KEY is not configured");

    const SUPABASE_URL = Deno.env.get("SUPABASE_URL");
    const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
    if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) throw new Error("Supabase credentials not configured");

    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
    const force = new URL(req.url).searchParams.get("force") === "1";

    // ── Guard: Skip if topics were already generated today ──
    const today = new Date().toISOString().split("T")[0];
    if (!force) {
      const { count: todayCount } = await supabase
        .from("topics")
        .select("id", { count: "exact", head: true })
        .eq("published_at", today);

      if ((todayCount ?? 0) >= 5) {
        console.log(`Already ${todayCount} topics for ${today}, skipping generation.`);
        return new Response(
          JSON.stringify({ success: true, skipped: true, message: `Already ${todayCount} topics for today` }),
          { headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
    }

    const job = runPipeline(supabase, ANTHROPIC_API_KEY, today).catch(async (error) => {
      console.error("Pipeline error:", error);
      const msg = error instanceof Error ? error.message : "Unknown error";
      try {
        await supabase.from("generation_logs").insert({ success: false, error_message: msg });
      } catch (_e) { /* Logging darf den Fehler nicht verschlucken lassen */ }
    });
    // @ts-ignore — EdgeRuntime existiert in Supabase Edge Functions
    EdgeRuntime.waitUntil(job);

    return new Response(
      JSON.stringify({ success: true, started: true, message: "Generierung läuft im Hintergrund — Ergebnis in topics/generation_logs." }),
      { status: 202, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Error starting generation:", error);
    const msg = error instanceof Error ? error.message : "Unknown error";
    return new Response(JSON.stringify({ success: false, error: msg }), { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
  }
});

async function runPipeline(supabase: any, ANTHROPIC_API_KEY: string, today: string): Promise<void> {
    // ── Step 0a: ECHTE Artikel holen ──
    console.log("Step 0a: Fetching real articles from RSS...");
    const articles = await fetchCatalog();
    console.log(`Fetched ${articles.length} real articles from ${FEEDS.length} feeds.`);
    if (articles.length < 20) {
      throw new Error(`Only ${articles.length} articles fetched — refusing to generate without solid grounding.`);
    }
    const articleById = new Map(articles.map((a) => [a.id, a]));

    // ── Step 0b: Load existing topic titles for deduplication ──
    console.log("Step 0b: Loading existing topics for deduplication...");
    const { data: existingTopics } = await supabase
      .from("topics")
      .select("topic")
      .order("created_at", { ascending: false })
      .limit(100);

    const existingTitles = (existingTopics || []).map((t: any) => t.topic);
    const deduplicationNote = existingTitles.length > 0
      ? `\nBEREITS BEHANDELTE THEMEN (NICHT ERNEUT GENERIEREN!):\n${existingTitles.map((t: string, i: number) => `${i + 1}. ${t}`).join("\n")}\n\nGeneriere NUR neue Themen, die KEINES der oben genannten Themen wiederholen oder nur leicht umformulieren.\n`
      : "";

    // ── Step 1: Generate topics from the real catalog ──
    console.log(`Step 1/3: Generating topics grounded in ${articles.length} articles...`);

    let content = await askClaude({
      apiKey: ANTHROPIC_API_KEY,
      model: MODEL_GEN,
      maxTokens: 16000,
      system: SYSTEM_PROMPT,
      user: buildUserPrompt(catalogText(articles), deduplicationNote),
    });
    content = content.replace(/```json\n?/g, "").replace(/```\n?/g, "").trim();
    const arrStart = content.indexOf("[");
    if (arrStart > 0) content = content.slice(arrStart);

    // Robust JSON parsing with truncation recovery
    let topicsArray: any[];
    try {
      topicsArray = JSON.parse(content);
    } catch (parseErr) {
      console.warn("JSON parse failed, attempting repair...");
      const lastCompleteObj = content.lastIndexOf("}");
      if (lastCompleteObj > 0) {
        let trimmed = content.substring(0, lastCompleteObj + 1);
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

    // ── Grounding-Gate: Pflichtfelder + gültige Quellen beider Seiten, sonst raus ──
    const REQUIRED_FIELDS = ["topic", "left_position", "left_quote", "left_speaker", "right_position", "right_quote", "right_speaker", "mitte_view"];
    const beforeGrounding = topicsArray.length;
    topicsArray = topicsArray.filter((t: any) => {
      const missing = REQUIRED_FIELDS.filter((f) => typeof t[f] !== "string" || !t[f].trim());
      if (missing.length > 0) {
        console.warn(`  ⛔ Missing fields for "${t.topic ?? "?"}": ${missing.join(", ")}`);
        return false;
      }
      if (!["gleich", "gegensaetzlich", "teilweise"].includes(t.tag_type)) t.tag_type = "teilweise";
      const left = sourcesFromIds(t.left_source_ids, articleById);
      const right = sourcesFromIds(t.right_source_ids, articleById);
      if (left.length === 0 || right.length === 0) {
        console.warn(`  ⛔ Grounding failed for "${t.topic}" (left: ${left.length}, right: ${right.length})`);
        return false;
      }
      t._left_sources = left;
      t._right_sources = right;
      return true;
    });
    console.log(`Grounding gate: ${beforeGrounding} → ${topicsArray.length} topics`);

    // ── Deduplication safety net ──
    if (existingTitles.length > 0) {
      const normalise = (s: string) => s.toLowerCase().replace(/[^a-zäöüß0-9]/g, " ").replace(/\s+/g, " ").trim();
      const existingNorm = existingTitles.map(normalise);

      const before = topicsArray.length;
      topicsArray = topicsArray.filter((t: any) => {
        const norm = normalise(t.topic);
        const isDupe = existingNorm.some((ex: string) => {
          const newWords = norm.split(" ").filter((w: string) => w.length > 3);
          const exWords = ex.split(" ").filter((w: string) => w.length > 3);
          if (newWords.length === 0 || exWords.length === 0) return false;
          const overlap = newWords.filter((w: string) => exWords.includes(w)).length;
          return overlap / Math.min(newWords.length, exWords.length) >= 0.9;
        });
        if (isDupe) console.warn(`  🔄 Duplicate removed: "${t.topic}"`);
        return !isDupe;
      });
      console.log(`Dedup: ${before} → ${topicsArray.length} topics (${before - topicsArray.length} duplicates removed)`);
    }

    if (topicsArray.length === 0) {
      await supabase.from("generation_logs").insert({
        success: false,
        error_message: "No topics survived grounding gate + deduplication.",
      });
      return;
    }

    // ── Step 2: Batched 10-pass verification ──
    console.log("Step 2/3: Running 10-pass batch verification...");
    const { rejections, failedPerspectives } = await runBatchVerification(topicsArray, articleById, ANTHROPIC_API_KEY);

    // Fail-closed: zu viele kaputte Prüfer = kein Publish
    if (failedPerspectives.length >= 3) {
      await supabase.from("generation_logs").insert({
        success: false,
        error_message: `Verification unavailable: ${failedPerspectives.length}/10 perspectives failed (${failedPerspectives.join(", ")}).`,
      });
      return;
    }

    const approved: any[] = [];
    const rejected: { topic: string; rejectedBy: string[]; reasons: string[] }[] = [];

    topicsArray.forEach((topic: any, idx: number) => {
      const entry = rejections.get(idx)!;
      if (entry.rejectedBy.length === 0) {
        console.log(`  ✅ Topic ${idx + 1} "${topic.topic}" — all checks passed`);
        approved.push(topic);
      } else {
        console.warn(`  ❌ Topic ${idx + 1} "${topic.topic}" — REJECTED by: ${entry.rejectedBy.join(", ")}`);
        rejected.push({ topic: topic.topic, ...entry });
      }
    });

    console.log(`Verification done: ${approved.length} approved, ${rejected.length} rejected`);

    if (approved.length === 0) {
      await supabase.from("generation_logs").insert({
        success: false,
        error_message: "All topics failed verification.",
        rejected_count: rejected.length,
        details: { rejectionDetails: rejected },
      });
      return;
    }

    // ── Step 3: Save approved topics ──
    console.log("Step 3/3: Saving approved topics...");

    const rows = approved.map((t: any) => ({
      topic: t.topic,
      tag_type: t.tag_type,
      category: t.category || "politik",
      left_position: t.left_position,
      left_quote: t.left_quote,
      left_speaker: t.left_speaker,
      left_hidden_meaning: t.left_hidden_meaning || null,
      left_negative_effects: t.left_negative_effects || null,
      left_sources: t._left_sources,
      right_position: t.right_position,
      right_quote: t.right_quote,
      right_speaker: t.right_speaker,
      right_hidden_meaning: t.right_hidden_meaning || null,
      right_negative_effects: t.right_negative_effects || null,
      right_sources: t._right_sources,
      mitte_view: t.mitte_view,
      published_at: today,
    }));

    const { data, error } = await supabase.from("topics").insert(rows).select();
    if (error) throw new Error(`Failed to save topics: ${error.message}`);

    console.log(`Successfully saved ${data.length} grounded topics`);

    await supabase.from("generation_logs").insert({
      success: true,
      topics_count: data.length,
      rejected_count: rejected.length,
      details: { rejectionDetails: rejected, articleCount: articles.length, failedPerspectives },
    });
}
