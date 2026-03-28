/**
 * Virtuelle Redakteure für die Statistik-Seite
 * 
 * Jeder Redakteur prüft einen Aspekt der Daten auf Konsistenz.
 * Alle Prüfungen müssen bestanden werden, bevor die Daten angezeigt werden.
 * Bei Fehlern wird eine Warnung mit Details angezeigt.
 */

export interface RedakteurErgebnis {
  name: string;
  bestanden: boolean;
  details: string;
}

export interface GeprüfteDaten {
  totalTopics: number;
  totalSuggestions: number;
  totalVotes: number;
  dayStats: { date: string; topics: number; suggestions: number }[];
  voteBuckets: { label: string; count: number; color: string }[];
  prüfungen: RedakteurErgebnis[];
  allebestanden: boolean;
}

// Vote buckets mapped to actual 0-100 slider range
const VOTE_COLORS = [
  "hsl(0, 72%, 51%)",    // stark links / rot
  "hsl(25, 90%, 55%)",   // eher links
  "hsl(46, 100%, 50%)",  // mitte / gold
  "hsl(150, 60%, 45%)",  // eher rechts
  "hsl(210, 70%, 50%)",  // stark rechts / blau
];

const VOTE_BUCKET_DEFS = [
  { label: "Stark links",  min: 0,  max: 19 },
  { label: "Eher links",   min: 20, max: 39 },
  { label: "Mitte",        min: 40, max: 60 },
  { label: "Eher rechts",  min: 61, max: 80 },
  { label: "Stark rechts", min: 81, max: 100 },
];

/**
 * Redakteur 1: Summenprüfer
 * Prüft ob die Summe der Tagesstatistiken mit den Gesamtzahlen übereinstimmt.
 */
function redakteurSummenprüfer(
  dayStats: { date: string; topics: number; suggestions: number }[],
  totalTopicsFromChart: number,
  totalSuggestionsFromChart: number,
  totalTopics: number,
  totalSuggestions: number,
): RedakteurErgebnis {
  // Note: dayStats only shows last 14 days, so sums may be <= totals
  const chartTopics = dayStats.reduce((s, d) => s + d.topics, 0);
  const chartSuggs = dayStats.reduce((s, d) => s + d.suggestions, 0);

  const topicsOk = chartTopics <= totalTopics;
  const suggsOk = chartSuggs <= totalSuggestions;

  return {
    name: "Summenprüfer",
    bestanden: topicsOk && suggsOk,
    details: topicsOk && suggsOk
      ? `Chart zeigt ${chartTopics}/${totalTopics} Themen und ${chartSuggs}/${totalSuggestions} Einreichungen (letzte 14 Tage) ✓`
      : `FEHLER: Chart-Summen (${chartTopics} Themen, ${chartSuggs} Einr.) übersteigen Gesamtzahlen (${totalTopics}, ${totalSuggestions})`,
  };
}

/**
 * Redakteur 2: Stimmenverteiler
 * Prüft ob alle Stimmen in Buckets erfasst wurden (Summe = Gesamt).
 */
function redakteurStimmenverteiler(
  buckets: { count: number }[],
  totalVotes: number,
): RedakteurErgebnis {
  const bucketSum = buckets.reduce((s, b) => s + b.count, 0);
  const match = bucketSum === totalVotes;

  return {
    name: "Stimmenverteiler",
    bestanden: match,
    details: match
      ? `Alle ${totalVotes} Stimmen korrekt auf Buckets verteilt ✓`
      : `FEHLER: Bucket-Summe (${bucketSum}) ≠ Gesamtstimmen (${totalVotes}). Differenz: ${totalVotes - bucketSum}`,
  };
}

/**
 * Redakteur 3: Plausibilitätsprüfer
 * Prüft ob keine negativen Zahlen oder unmögliche Werte vorhanden sind.
 */
function redakteurPlausibilität(
  totalTopics: number,
  totalSuggestions: number,
  totalVotes: number,
  dayStats: { topics: number; suggestions: number }[],
): RedakteurErgebnis {
  const issues: string[] = [];

  if (totalTopics < 0) issues.push("Negative Themenanzahl");
  if (totalSuggestions < 0) issues.push("Negative Einreichungen");
  if (totalVotes < 0) issues.push("Negative Stimmen");
  
  for (const d of dayStats) {
    if (d.topics < 0 || d.suggestions < 0) {
      issues.push(`Negative Tageswerte am ${d.date}`);
    }
  }

  return {
    name: "Plausibilitätsprüfer",
    bestanden: issues.length === 0,
    details: issues.length === 0
      ? "Alle Werte plausibel ✓"
      : `FEHLER: ${issues.join(", ")}`,
  };
}

/**
 * Redakteur 4: Vollständigkeitsprüfer
 * Prüft ob Daten überhaupt geladen wurden.
 */
function redakteurVollständigkeit(
  topicsLoaded: boolean,
  suggestionsLoaded: boolean,
  votesLoaded: boolean,
): RedakteurErgebnis {
  const allLoaded = topicsLoaded && suggestionsLoaded && votesLoaded;
  const missing: string[] = [];
  if (!topicsLoaded) missing.push("Themen");
  if (!suggestionsLoaded) missing.push("Einreichungen");
  if (!votesLoaded) missing.push("Stimmen");

  return {
    name: "Vollständigkeitsprüfer",
    bestanden: allLoaded,
    details: allLoaded
      ? "Alle Datenquellen erfolgreich geladen ✓"
      : `FEHLER: Fehlende Daten: ${missing.join(", ")}`,
  };
}

/**
 * Hauptfunktion: Verarbeitet Rohdaten und lässt sie durch alle Redakteure prüfen.
 */
export function verarbeiteUndPrüfe(
  topics: { published_at: string }[] | null,
  suggestions: { created_at: string }[] | null,
  votes: { value: number }[] | null,
): GeprüfteDaten {
  const topicsList = topics || [];
  const suggestionsList = suggestions || [];
  const votesList = votes || [];

  // -- Topics per day --
  const topicsByDay: Record<string, number> = {};
  topicsList.forEach((t) => {
    const d = t.published_at;
    topicsByDay[d] = (topicsByDay[d] || 0) + 1;
  });

  // -- Suggestions per day --
  const suggsByDay: Record<string, number> = {};
  suggestionsList.forEach((s) => {
    const d = s.created_at.split("T")[0];
    suggsByDay[d] = (suggsByDay[d] || 0) + 1;
  });

  // Merge days (last 14)
  const allDays = new Set([...Object.keys(topicsByDay), ...Object.keys(suggsByDay)]);
  const dayStats = Array.from(allDays)
    .sort()
    .slice(-14)
    .map((date) => ({
      date: new Date(date).toLocaleDateString("de-DE", { day: "2-digit", month: "2-digit" }),
      topics: topicsByDay[date] || 0,
      suggestions: suggsByDay[date] || 0,
    }));

  const totalTopics = topicsList.length;
  const totalSuggestions = suggestionsList.length;
  const totalVotes = votesList.length;

  // -- Vote distribution (0-100 range!) --
  const buckets = VOTE_BUCKET_DEFS.map((def) => ({ ...def, count: 0 }));
  votesList.forEach((v) => {
    for (const b of buckets) {
      if (v.value >= b.min && v.value <= b.max) {
        b.count++;
        break;
      }
    }
  });

  const voteBuckets = buckets.map((b, i) => ({
    label: b.label,
    count: b.count,
    color: VOTE_COLORS[i],
  }));

  // -- Virtuelle Redakteure --
  const prüfungen: RedakteurErgebnis[] = [
    redakteurVollständigkeit(topics !== null, suggestions !== null, votes !== null),
    redakteurPlausibilität(totalTopics, totalSuggestions, totalVotes, dayStats),
    redakteurSummenprüfer(dayStats, totalTopics, totalSuggestions, totalTopics, totalSuggestions),
    redakteurStimmenverteiler(voteBuckets, totalVotes),
  ];

  const allebestanden = prüfungen.every((p) => p.bestanden);

  // Log to console for transparency
  console.log("[Statistik-Redakteure] Prüfungsergebnisse:");
  prüfungen.forEach((p) => {
    console.log(`  ${p.bestanden ? "✅" : "❌"} ${p.name}: ${p.details}`);
  });

  return {
    totalTopics,
    totalSuggestions,
    totalVotes,
    dayStats,
    voteBuckets,
    prüfungen,
    allebestanden,
  };
}
