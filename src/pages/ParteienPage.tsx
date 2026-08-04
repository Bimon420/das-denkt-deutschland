import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { ladeAlleZeilen } from "@/lib/alleZeilen";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Loader2, ChevronDown, ChevronUp } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useMemo, useState } from "react";

interface PositionEntry {
  topicId: string;
  topic: string;
  position: string;
  quote: string;
  speaker: string;
  side: "links" | "rechts";
}

const PARTIES: { label: string; color: string; keywords: string[] }[] = [
  { label: "CDU/CSU", color: "bg-[hsl(0,0%,15%)]", keywords: ["cdu", "csu", "merz", "linnemann", "dobrindt", "söder", "spahn", "klöckner", "ziemiak", "kramp-karrenbauer", "unionsfraktion", "henning otte", "andrea lindholz"] },
  { label: "SPD", color: "bg-[hsl(0,70%,50%)]", keywords: ["spd", "scholz", "lauterbach", "faeser", "heil", "esken", "klingbeil", "mützenich", "fahimi", "blienert", "heidenblut", "pistorius", "paus"] },
  { label: "Bündnis 90/Die Grünen", color: "bg-[hsl(120,50%,35%)]", keywords: ["grüne", "grünen", "habeck", "baerbock", "hofreiter", "özdemir", "nouripour", "lang", "ricarda lang", "bärbel höhn", "rackete"] },
  { label: "FDP", color: "bg-[hsl(50,90%,50%)]", keywords: ["fdp", "lindner", "wissing", "buschmann", "stark-watzinger", "funke-kaiser", "djir-sarai"] },
  { label: "AfD", color: "bg-[hsl(210,70%,50%)]", keywords: ["afd", "weidel", "chrupalla", "gauland", "höcke"] },
  { label: "Die Linke", color: "bg-[hsl(340,70%,45%)]", keywords: ["linke", "wissler", "bartsch", "wagenknecht"] },
  { label: "BSW", color: "bg-[hsl(280,40%,45%)]", keywords: ["bsw", "wagenknecht"] },
];

const ORG_GROUPS: { label: string; emoji: string; keywords: string[] }[] = [
  { label: "Gewerkschaften", emoji: "✊", keywords: ["dgb", "gewerkschaft", "verdi", "ig metall"] },
  { label: "Wirtschaftsverbände", emoji: "📈", keywords: ["bdi", "dihk", "bda", "arbeitgeber", "bvmw", "industrie", "mittelstand", "steuerzahler"] },
  { label: "Umwelt & Soziales", emoji: "🌍", keywords: ["bund", "umwelthilfe", "greenpeace", "caritas", "diakonie", "paritätisch", "wohlfahrt", "amnesty", "aidshilfe"] },
  { label: "Wissenschaft & Experten", emoji: "🎓", keywords: ["prof.", "institut", "wissenschaft", "forschung", "universität", "experte", "expertin", "sachverständig"] },
];

function classifySpeaker(speaker: string): string {
  const lower = speaker.toLowerCase();
  for (const p of PARTIES) {
    if (p.keywords.some(kw => lower.includes(kw))) return p.label;
  }
  for (const o of ORG_GROUPS) {
    if (o.keywords.some(kw => lower.includes(kw))) return o.label;
  }
  return "Weitere Akteure";
}

const ParteienPage = () => {
  const navigate = useNavigate();
  const [expanded, setExpanded] = useState<Record<string, boolean>>({});

  const { data: topics = [], isLoading } = useQuery({
    queryKey: ["parteien-positions"],
    queryFn: async () => {
      // Ohne Obergrenze deckelt PostgREST still bei 1000 Zeilen — die Parteien-Uebersicht
      // haette ab dem 1001. Thema lautlos Positionen unterschlagen, ohne dass etwas
      // kaputt aussieht. (Fehlerklasse: buch 04.08. an celebrity-stonks.)
      const { zeilen, vollstaendig } = await ladeAlleZeilen<Record<string, unknown>>(
        (von, bis) => supabase
          .from("topics")
          .select("id, topic, left_position, left_quote, left_speaker, right_position, right_quote, right_speaker")
          .range(von, bis),
      );
      if (!vollstaendig) {
        console.warn("[Parteien] Themen unvollstaendig geladen — es fehlen Positionen.");
      }
      return zeilen;
    },
  });

  const groups = useMemo(() => {
    const entries: PositionEntry[] = [];
    topics.forEach((t) => {
      entries.push({
        topicId: t.id,
        topic: t.topic,
        position: t.left_position,
        quote: t.left_quote,
        speaker: t.left_speaker,
        side: "links",
      });
      entries.push({
        topicId: t.id,
        topic: t.topic,
        position: t.right_position,
        quote: t.right_quote,
        speaker: t.right_speaker,
        side: "rechts",
      });
    });

    const grouped: Record<string, PositionEntry[]> = {};
    entries.forEach((e) => {
      const group = classifySpeaker(e.speaker);
      if (!grouped[group]) grouped[group] = [];
      grouped[group].push(e);
    });

    // Sort: parties first (by PARTIES order), then orgs, then rest
    const partyOrder = PARTIES.map(p => p.label);
    const orgOrder = ORG_GROUPS.map(o => o.label);

    return Object.entries(grouped)
      .map(([label, items]) => {
        const party = PARTIES.find(p => p.label === label);
        const org = ORG_GROUPS.find(o => o.label === label);
        return {
          label,
          color: party?.color ?? "",
          emoji: org?.emoji ?? (party ? "🏛️" : "📌"),
          items,
          isParty: !!party,
          sortOrder: partyOrder.includes(label)
            ? partyOrder.indexOf(label)
            : orgOrder.includes(label)
            ? 100 + orgOrder.indexOf(label)
            : 200,
        };
      })
      .sort((a, b) => a.sortOrder - b.sortOrder);
  }, [topics]);

  const toggle = (label: string) =>
    setExpanded((prev) => ({ ...prev, [label]: !prev[label] }));

  return (
    <div className="min-h-[100dvh] bg-background px-5 py-8 max-w-2xl mx-auto">
      <button
        onClick={() => navigate("/app")}
        className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors mb-8 active:scale-95"
      >
        <ArrowLeft className="w-4 h-4" />
        Zurück
      </button>

      <h1 className="font-editorial text-3xl font-bold mb-2">Parteien & Positionen</h1>
      <p className="text-sm text-muted-foreground mb-1">
        Alle politischen Standpunkte — sortiert nach Partei und Akteur.
      </p>
      <p className="text-[10px] text-muted-foreground/60 mb-8">
        {groups.length} Gruppen · {topics.length * 2} Positionen aus {topics.length} Themen
      </p>

      {isLoading ? (
        <div className="flex justify-center py-20">
          <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
        </div>
      ) : (
        <div className="space-y-4">
          {groups.map((group, gi) => {
            const isOpen = expanded[group.label] ?? false;
            const preview = group.items.slice(0, 3);
            const rest = group.items.slice(3);

            return (
              <motion.div
                key={group.label}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: Math.min(gi * 0.04, 0.3), duration: 0.35 }}
                className="rounded-xl border border-border bg-card overflow-hidden"
              >
                {/* Header */}
                <button
                  onClick={() => toggle(group.label)}
                  className="w-full flex items-center gap-3 p-4 hover:bg-secondary/30 transition-colors text-left"
                >
                  {group.isParty && (
                    <span className={`w-3 h-3 rounded-full ${group.color} flex-shrink-0`} />
                  )}
                  {!group.isParty && (
                    <span className="text-base flex-shrink-0">{group.emoji}</span>
                  )}
                  <span className="font-bold text-sm tracking-wide uppercase text-foreground flex-1">
                    {group.label}
                  </span>
                  <span className="text-[10px] text-muted-foreground mr-2">
                    {group.items.length} {group.items.length === 1 ? "Position" : "Positionen"}
                  </span>
                  {isOpen ? (
                    <ChevronUp className="w-4 h-4 text-muted-foreground" />
                  ) : (
                    <ChevronDown className="w-4 h-4 text-muted-foreground" />
                  )}
                </button>

                {/* Preview (always visible) */}
                <div className="px-4 pb-2 space-y-2">
                  {preview.map((entry, i) => (
                    <PositionItem key={`${entry.topicId}-${entry.side}-${i}`} entry={entry} navigate={navigate} />
                  ))}
                </div>

                {/* Expanded */}
                <AnimatePresence>
                  {isOpen && rest.length > 0 && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: "auto", opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.25 }}
                      className="px-4 pb-3 space-y-2 overflow-hidden"
                    >
                      {rest.map((entry, i) => (
                        <PositionItem key={`${entry.topicId}-${entry.side}-${i}`} entry={entry} navigate={navigate} />
                      ))}
                    </motion.div>
                  )}
                </AnimatePresence>

                {!isOpen && rest.length > 0 && (
                  <button
                    onClick={() => toggle(group.label)}
                    className="w-full text-[11px] text-accent font-semibold py-2 hover:bg-secondary/20 transition-colors"
                  >
                    + {rest.length} weitere anzeigen
                  </button>
                )}
              </motion.div>
            );
          })}
        </div>
      )}
    </div>
  );
};

function PositionItem({
  entry,
  navigate,
}: {
  entry: PositionEntry;
  navigate: ReturnType<typeof useNavigate>;
}) {
  return (
    <button
      onClick={() => navigate(`/thema/${entry.topicId}`)}
      className="w-full text-left p-3 rounded-lg bg-background/50 border border-border/30 hover:border-accent/30 transition-all active:scale-[0.99]"
    >
      <div className="flex items-center gap-2 mb-1">
        <span
          className={`text-[9px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded ${
            entry.side === "links"
              ? "bg-red-500/10 text-red-600 dark:text-red-400"
              : "bg-blue-500/10 text-blue-600 dark:text-blue-400"
          }`}
        >
          {entry.side === "links" ? "← Links" : "Rechts →"}
        </span>
        <span className="text-[10px] text-muted-foreground truncate">{entry.speaker}</span>
      </div>
      <p className="text-xs font-medium text-foreground leading-snug line-clamp-2 mb-1">
        {entry.topic}
      </p>
      <p className="text-[11px] text-muted-foreground leading-relaxed line-clamp-2">
        {entry.position}
      </p>
    </button>
  );
}

export default ParteienPage;
