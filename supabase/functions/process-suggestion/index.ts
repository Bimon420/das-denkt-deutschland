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

// ─── Artikel wirklich lesen (Grounding — vorher sah das LLM nur die URL!) ────
function decodeEntities(s: string): string {
  return s
    .replace(/&amp;/g, "&").replace(/&lt;/g, "<").replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"').replace(/&#0?39;|&apos;/g, "'")
    .replace(/&#(\d+);/g, (_, n) => String.fromCodePoint(Number(n)))
    .replace(/&nbsp;/g, " ");
}

async function fetchArticle(url: string): Promise<{ title: string; description: string; text: string }> {
  const res = await fetch(url, {
    headers: { "User-Agent": "Mozilla/5.0 (DasDenktDeutschland-Bot)" },
    signal: AbortSignal.timeout(12_000),
    redirect: "follow",
  });
  if (!res.ok) throw new Error(`Artikel nicht abrufbar (HTTP ${res.status}).`);
  const html = await res.text();

  const title = decodeEntities(
    html.match(/<meta[^>]+property=["']og:title["'][^>]+content=["']([^"']+)/i)?.[1] ??
    html.match(/<title[^>]*>([\s\S]*?)<\/title>/i)?.[1] ?? ""
  ).trim();
  const description = decodeEntities(
    html.match(/<meta[^>]+property=["']og:description["'][^>]+content=["']([^"']+)/i)?.[1] ??
    html.match(/<meta[^>]+name=["']description["'][^>]+content=["']([^"']+)/i)?.[1] ?? ""
  ).trim();

  // Fließtext grob extrahieren: Absätze einsammeln, Skripte/Styles verwerfen
  const body = html
    .replace(/<script[\s\S]*?<\/script>/gi, " ")
    .replace(/<style[\s\S]*?<\/style>/gi, " ");
  const paragraphs = [...body.matchAll(/<p[^>]*>([\s\S]*?)<\/p>/gi)]
    .map((m) => decodeEntities(m[1].replace(/<[^>]+>/g, " ")).replace(/\s+/g, " ").trim())
    .filter((p) => p.length > 60);
  const text = paragraphs.join("\n").slice(0, 6000);

  if (!title && !description && text.length < 200) {
    throw new Error("Artikel-Inhalt konnte nicht extrahiert werden (Paywall/Blocker?).");
  }
  return { title, description, text };
}

const VERIFICATION_PERSPECTIVES = [
  { name: "Politischer Faktenprüfer", focus: "Titel korrekt? Beschreibt genau EIN Ereignis? Passen Links/Rechts/Mitte zum Titel? Deckt der mitgelieferte Artikeltext das Thema? WICHTIG: Bei Liveblogs/Eilmeldungen innere Konsistenz prüfen und nicht allein wegen fehlender Echtzeit-Verifizierbarkeit ablehnen." },
  { name: "Personen-Zuordnungsprüfer", focus: "Zitate zur jeweiligen Position passend und vom Artikeltext gedeckt? Generische Sprecher wie 'Politische Beobachter', 'Experten', 'Kritiker' sind ERLAUBT. Konkrete Personen NUR wenn der Artikeltext den Wortlaut hergibt." },
  { name: "Gesellschaftlicher Kohärenzprüfer", focus: "Echte gesellschaftliche Debatte? Links/Rechts/Mitte logisch zum selben Thema?" },
  { name: "Wirtschaftlicher Plausibilitätsprüfer", focus: "Wirtschaftliche Argumente plausibel? Fakten korrekt?" },
  { name: "Gesundheitspolitischer Prüfer", focus: "Gesundheitliche Aussagen korrekt? Keine irreführenden Behauptungen? Wenn kein Gesundheitsthema: automatisch APPROVED." },
  { name: "Historischer Kontextprüfer", focus: "Historische Referenzen korrekt? Mitte-Standpunkt historisch fundiert?" },
  { name: "Sprachlicher Präzisionsprüfer", focus: "Begriffe korrekt und präzise? Ton sachlich?" },
  { name: "Quellen-Deckungsprüfer", focus: "Wird etwas behauptet, das der mitgelieferte Artikeltext NICHT hergibt? Der Artikel-Link selbst ist die Primärquelle — fehlende Zusatzquellen sind KEIN Ablehnungsgrund." },
  { name: "Bias-Detektor", focus: "Linke Position fair? Rechte Position fair? Mitte ausgewogen? Strohmann-Argumente?" },
  { name: "Abschluss-Integritätsprüfer", focus: "Titel/Links/Rechts/Mitte ZWEIFELSFREI zum selben Thema? Publizierbar?" },
];

async function runVerification(
  topic: any,
  apiKey: string,
  sourceUrl: string,
  article: { title: string; description: string; text: string },
): Promise<{ approved: boolean; rejectedBy: string[]; reasons: string[] }> {
  const topicText = `ARTIKEL (Primärquelle, ${sourceUrl}):
TITEL: ${article.title}
TEASER: ${article.description}
TEXT (Auszug): ${article.text.slice(0, 2500)}

--- GENERIERTES THEMA ---
TITEL: ${topic.topic}
LINKS: ${topic.left_position}
  Zitat: „${topic.left_quote}" — ${topic.left_speaker}
RECHTS: ${topic.right_position}
  Zitat: „${topic.right_quote}" — ${topic.right_speaker}
MITTE: ${topic.mitte_view}`;

  const results = await Promise.all(
    VERIFICATION_PERSPECTIVES.map(async (p) => {
      try {
        let raw = await askClaude({
          apiKey,
          model: MODEL_VERIFY,
          maxTokens: 800,
          system: `Du bist "${p.name}". Fokus: ${p.focus}\nPrüfe gegen den mitgelieferten Artikeltext, nicht gegen Vermutungen.\nAntworte NUR mit JSON: {"approved": true/false, "reason": "..."}`,
          user: `Prüfe dieses Thema:\n\n${topicText}\n\nJSON-Antwort:`,
        });
        raw = raw.replace(/```json\n?/g, "").replace(/```\n?/g, "").trim();
        const objMatch = raw.match(/\{[\s\S]*\}/);
        const parsed = JSON.parse(objMatch ? objMatch[0] : raw);
        return { name: p.name, approved: parsed.approved !== false, reason: parsed.reason || "" };
      } catch (_e) {
        return { name: p.name, approved: false, reason: "Parse/network error" };
      }
    })
  );

  const rejectedBy: string[] = [];
  const reasons: string[] = [];
  for (const r of results) {
    if (!r.approved) {
      rejectedBy.push(r.name);
      if (r.reason) reasons.push(`[${r.name}]: ${r.reason}`);
    }
  }
  return { approved: rejectedBy.length === 0, rejectedBy, reasons };
}

async function checkRelevance(
  url: string,
  apiKey: string,
  article: { title: string; description: string; text: string },
): Promise<{ relevant: boolean; reason: string }> {
  try {
    let raw = await askClaude({
      apiKey,
      model: MODEL_VERIFY,
      maxTokens: 400,
      system: `Du bist ein strenger Relevanzfilter für "Das Denkt Deutschland" — eine Plattform für POLITISCHE und GESELLSCHAFTLICHE Debatten in Deutschland.

ERLAUBT sind NUR Themen, die:
- Eine aktuelle POLITISCHE Debatte in Deutschland betreffen
- Gesellschaftspolitisch kontrovers diskutiert werden (z.B. Migration, Wirtschaft, Soziales, Klima, Sicherheit, Bildung, Gesundheitspolitik)
- Parteipolitische Relevanz haben

NICHT ERLAUBT sind:
- Lokale Nachrichten ohne überregionale politische Bedeutung (z.B. Tierrettungen, Unfälle, Kriminalfälle)
- Sport, Unterhaltung, Promi-News, Klatsch
- Naturereignisse ohne politische Dimension
- Rein wissenschaftliche Meldungen ohne politischen Bezug
- Produktnews, Technik-Reviews

Antworte NUR mit JSON: {"relevant": true/false, "reason": "kurze Begründung"}`,
      user: `Ist dieser Artikel politisch relevant für eine deutsche Debattenplattform?
URL: ${url}
TITEL: ${article.title}
TEASER: ${article.description}
TEXT (Auszug): ${article.text.slice(0, 1500)}`,
    });
    raw = raw.replace(/```json\n?/g, "").replace(/```\n?/g, "").trim();
    const objMatch = raw.match(/\{[\s\S]*\}/);
    const parsed = JSON.parse(objMatch ? objMatch[0] : raw);
    return { relevant: parsed.relevant === true, reason: parsed.reason || "" };
  } catch {
    return { relevant: true, reason: "Prüfung nicht möglich, durchgelassen" };
  }
}

async function generateTopicFromArticle(
  url: string,
  apiKey: string,
  article: { title: string; description: string; text: string },
): Promise<any> {
  let content = await askClaude({
    apiKey,
    model: MODEL_GEN,
    maxTokens: 4000,
    system: `Du bist ein redaktioneller KI-Assistent für "Das Denkt Deutschland". Du erhältst einen ECHTEN Nachrichtenartikel (Titel, Teaser, Textauszug) und generierst daraus EIN politisches Thema.

REGELN:
- Das Thema muss sich EXAKT auf den gelieferten Artikel beziehen — nichts hinzuerfinden
- Links = progressive Position, Rechts = konservative Position
- Mitte = ausgewogene, historisch bewusste Einordnung (3-5 Sätze)
- tag_type: "gleich", "gegensaetzlich" oder "teilweise"
- category: immer "politik"
- Wörtliche Zitate NUR wenn der Wortlaut im Artikeltext steht; sonst Gruppen-Sprecher ("Politische Beobachter", "Unionspolitiker") und Kernaussage ohne Wörtlichkeits-Anspruch
- Quellen erfindest du NICHT — die Primärquelle (der Artikel) wird automatisch gesetzt

WICHTIG: Antworte AUSSCHLIESSLICH mit einem validen JSON-Objekt. Kein Text davor oder danach. Kein Markdown.`,
    user: `Artikel:
URL: ${url}
TITEL: ${article.title}
TEASER: ${article.description}
TEXT: ${article.text}

Exakte JSON-Struktur (keine anderen Felder):
{
  "topic": "Thementitel",
  "tag_type": "gleich" | "gegensaetzlich" | "teilweise",
  "category": "politik",
  "left_position": "...", "left_quote": "...", "left_speaker": "...",
  "left_hidden_meaning": "...", "left_negative_effects": "...",
  "right_position": "...", "right_quote": "...", "right_speaker": "...",
  "right_hidden_meaning": "...", "right_negative_effects": "...",
  "mitte_view": "..."
}`,
  });

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
    if (!url || typeof url !== "string" || url.length > 500 || !url.startsWith("http")) {
      return new Response(JSON.stringify({ error: "Ungültige URL" }), { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    const ANTHROPIC_API_KEY = Deno.env.get("ANTHROPIC_API_KEY");
    if (!ANTHROPIC_API_KEY) throw new Error("ANTHROPIC_API_KEY not configured");

    const SUPABASE_URL = Deno.env.get("SUPABASE_URL");
    const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
    if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) throw new Error("Supabase not configured");

    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

    // ── Grenzen (23.09.2026, Simons Video-Welle ~20.000 Menschen am Tag) ──
    // Ein Vorschlag kostet bis zu 34 Opus-Aufrufe (Relevanz + 3 × (Erzeugen + 10 Prüfer)),
    // und jeder durfte beliebig viele schicken. Jetzt: jede Adresse nur einmal, und über
    // alle Besucher höchstens DECKEL_VORSCHLAEGE_TAG (Standard 30) je Tag. Gezählt wird in
    // topic_suggestions selbst — keine neue Tabelle. Antwortet die Datenbank nicht, wird
    // nichts erzeugt: ein klemmender Zähler darf nicht zur offenen Kasse werden.
    const heute = new Date().toISOString().slice(0, 10) + "T00:00:00Z";
    const grenze = Number(Deno.env.get("DECKEL_VORSCHLAEGE_TAG")) || 30;
    const [schonDa, heuteDa] = await Promise.all([
      supabase.from("topic_suggestions").select("id", { count: "exact", head: true }).eq("url", url),
      supabase.from("topic_suggestions").select("id", { count: "exact", head: true }).gte("created_at", heute),
    ]);
    if (schonDa.error || heuteDa.error || schonDa.count === null || heuteDa.count === null) {
      console.error("Zähler:", schonDa.error?.message, heuteDa.error?.message);
      return new Response(JSON.stringify({ error: "Gerade nicht möglich — bitte später erneut versuchen." }), { status: 503, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }
    if (schonDa.count > 0) {
      return new Response(JSON.stringify({ error: "Dieser Link wurde schon vorgeschlagen." }), { status: 409, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }
    if (heuteDa.count >= grenze) {
      return new Response(JSON.stringify({ error: "Heute sind schon genug Vorschläge eingegangen — morgen wieder." }), { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    // Save suggestion
    await supabase.from("topic_suggestions").insert({ title: url, url });

    // Step 0: Artikel wirklich lesen — ohne Inhalt keine Generierung
    console.log("Fetching article:", url);
    const article = await fetchArticle(url);
    console.log("Article fetched:", article.title);

    // Step 1: Quick relevance check before expensive processing
    const relevance = await checkRelevance(url, ANTHROPIC_API_KEY, article);
    if (!relevance.relevant) {
      console.log("Relevance check FAILED:", relevance.reason);
      return new Response(
        JSON.stringify({
          success: false,
          error: "Dieser Link hat leider keine Relevanz für diese Seite.",
          details: [relevance.reason],
        }),
        { status: 422, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }
    console.log("Relevance check PASSED:", relevance.reason);

    const maxAttempts = 3;
    let topic: any = null;
    let verification: { approved: boolean; rejectedBy: string[]; reasons: string[] } | null = null;

    for (let attempt = 1; attempt <= maxAttempts; attempt++) {
      try {
        console.log(`Attempt ${attempt}/${maxAttempts}: Generating topic from article...`);
        topic = await generateTopicFromArticle(url, ANTHROPIC_API_KEY, article);
        console.log("Generated topic:", topic.topic);

        console.log(`Attempt ${attempt}/${maxAttempts}: Running 10-fold verification...`);
        verification = await runVerification(topic, ANTHROPIC_API_KEY, url, article);

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

    // Step 3: Save approved topic — Primärquelle ist der eingereichte Artikel selbst
    console.log("Topic approved! Saving...");
    const today = new Date().toISOString().split("T")[0];
    const outlet = new URL(url).hostname.replace(/^www\./, "");
    const primarySource = [{ type: "article", label: outlet, url, title: article.title }];

    const row = {
      topic: topic.topic,
      tag_type: topic.tag_type,
      category: "politik",
      left_position: topic.left_position,
      left_quote: topic.left_quote,
      left_speaker: topic.left_speaker,
      left_hidden_meaning: topic.left_hidden_meaning || null,
      left_negative_effects: topic.left_negative_effects || null,
      left_sources: primarySource,
      right_position: topic.right_position,
      right_quote: topic.right_quote,
      right_speaker: topic.right_speaker,
      right_hidden_meaning: topic.right_hidden_meaning || null,
      right_negative_effects: topic.right_negative_effects || null,
      right_sources: primarySource,
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
