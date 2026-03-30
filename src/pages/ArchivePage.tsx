import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Loader2, Hash } from "lucide-react";
import TransparencyTag from "@/components/TransparencyTag";
import { motion } from "framer-motion";
import { useMemo } from "react";

interface ArchiveTopic {
  id: string;
  topic: string;
  tag_type: string;
  published_at: string;
}

// Thematic categories with keyword matchers
const THEME_CATEGORIES: { label: string; emoji: string; keywords: string[] }[] = [
  { label: "Soziales & Bürgergeld", emoji: "🤝", keywords: ["bürgergeld", "sozial", "sanktion", "arbeitsmoral", "arbeitsverweiger", "kindergrundsicherung", "armut"] },
  { label: "Energie & Klima", emoji: "🌱", keywords: ["heizung", "wärmepumpe", "klima", "co2", "energie", "verbrenner", "e-fuel", "erneuerbar", "wärmewende", "gebäudeenergie", "hitze"] },
  { label: "Migration & Integration", emoji: "🌍", keywords: ["migration", "asyl", "abschieb", "zuwander", "einwander", "bezahlkarte", "fachkräftemangel", "fachkräfte", "staatsbürger", "einbürger", "grenzkontrollen", "integration", "rückführ"] },
  { label: "Verteidigung & Sicherheit", emoji: "🛡️", keywords: ["bundeswehr", "taurus", "rüstung", "waffen", "nato", "verteidigung", "wehrpflicht", "sicherheit", "aufrüstung", "sondervermögen"] },
  { label: "Internationale Politik", emoji: "🌐", keywords: ["ukraine", "israel", "naher osten", "iran", "nuklear", "trump", "europa", "international", "konflikt", "kriegsführung"] },
  { label: "Wirtschaft & Finanzen", emoji: "📊", keywords: ["haushalt", "schulden", "wirtschaft", "standort", "bürokratie", "übergewinn", "steuer", "industrie", "investition", "subvention", "batterie"] },
  { label: "Mobilität & Verkehr", emoji: "🚗", keywords: ["auto", "mobilität", "bahn", "infrastruktur", "brücke", "e-mobil", "tretroller", "schienen", "deutschland-takt", "verkehr", "deutschlandticket", "öpnv"] },
  { label: "Gesundheit", emoji: "🏥", keywords: ["gesundheit", "krankenhaus", "cannabis", "legalisier"] },
  { label: "Bildung & Digitales", emoji: "💻", keywords: ["bildung", "schule", "lehrer", "digital", "ki", "künstlich", "algorithm", "e-government", "regulierung von ki"] },
  { label: "Demokratie & Recht", emoji: "⚖️", keywords: ["wahlrecht", "bundestag", "meinungsfreiheit", "zensur", "rechtsextrem", "demokratie", "selbstbestimmung", "transgender", "parlament"] },
  { label: "Wohnen & Bauen", emoji: "🏠", keywords: ["wohnung", "miete", "mietpreis", "bauen", "bauwende", "sanierung", "wohnraum", "wohnungsnot"] },
  { label: "Rente & Pflege", emoji: "👴", keywords: ["rente", "alter", "pflege"] },
  { label: "Landwirtschaft", emoji: "🌾", keywords: ["bauern", "landwirt", "agrar"] },
  { label: "Lieferketten & Handel", emoji: "📦", keywords: ["lieferkette"] },
];

function classifyTopic(topic: string): string {
  const lower = topic.toLowerCase();
  for (const cat of THEME_CATEGORIES) {
    if (cat.keywords.some(kw => lower.includes(kw))) {
      return cat.label;
    }
  }
  return "Weitere Themen";
}

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

const ArchivePage = () => {
  const navigate = useNavigate();

  const { data: topics = [], isLoading } = useQuery({
    queryKey: ["archive-topics"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("topics")
        .select("id, topic, tag_type, published_at");
      if (error) throw error;
      return data as ArchiveTopic[];
    },
  });

  // Group by theme, randomize within each group, randomize group order
  const themeGroups = useMemo(() => {
    const grouped: Record<string, ArchiveTopic[]> = {};
    topics.forEach(t => {
      const theme = classifyTopic(t.topic);
      if (!grouped[theme]) grouped[theme] = [];
      grouped[theme].push(t);
    });

    // Build array of groups, shuffle topics within, shuffle group order
    const groups = Object.entries(grouped).map(([label, items]) => {
      const cat = THEME_CATEGORIES.find(c => c.label === label);
      return {
        label,
        emoji: cat?.emoji ?? "📌",
        items: shuffle(items),
        count: items.length,
      };
    });

    return shuffle(groups);
  }, [topics]);

  const totalTopics = topics.length;
  const totalGroups = themeGroups.length;

  return (
    <div className="min-h-[100dvh] bg-background px-5 py-8 max-w-2xl mx-auto">
      <button
        onClick={() => navigate("/app")}
        className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors mb-8 active:scale-95"
      >
        <ArrowLeft className="w-4 h-4" />
        Zurück
      </button>

      <h1 className="font-editorial text-3xl font-bold mb-2">Themen-Archiv</h1>
      <p className="text-sm text-muted-foreground mb-2">
        Alle {totalTopics} Themen — thematisch gruppiert, randomisiert für Objektivität.
      </p>
      <p className="text-[10px] text-muted-foreground/60 mb-8">
        {totalGroups} Themenfelder · Reihenfolge ändert sich bei jedem Laden
      </p>

      {isLoading ? (
        <div className="flex justify-center py-20">
          <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
        </div>
      ) : themeGroups.length === 0 ? (
        <p className="text-sm text-muted-foreground text-center py-20">
          Noch keine Themen vorhanden.
        </p>
      ) : (
        <div className="space-y-8">
          {themeGroups.map((group, groupIdx) => (
            <motion.div
              key={group.label}
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{
                delay: Math.min(groupIdx * 0.05, 0.4),
                duration: 0.4,
                ease: [0.16, 1, 0.3, 1],
              }}
            >
              <div className="flex items-center gap-2 mb-3">
                <span className="text-base">{group.emoji}</span>
                <span className="text-xs font-bold tracking-widest uppercase text-muted-foreground">
                  {group.label}
                </span>
                <span className="text-[10px] text-muted-foreground/50 ml-auto">
                  {group.count} {group.count === 1 ? "Thema" : "Themen"}
                </span>
              </div>

              <div className="space-y-1.5">
                {group.items.map((t) => (
                  <button
                    key={t.id}
                    onClick={() => navigate(`/thema/${t.id}`)}
                    className="w-full flex items-center justify-between gap-3 p-3.5 rounded-lg bg-card border border-border/50 hover:border-accent/40 hover:bg-card/80 transition-all cursor-pointer active:scale-[0.99] text-left"
                  >
                    <span className="font-body text-sm font-semibold text-foreground leading-snug">
                      {t.topic}
                    </span>
                    <TransparencyTag
                      type={t.tag_type as "gleich" | "gegensaetzlich" | "teilweise"}
                    />
                  </button>
                ))}
              </div>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
};

export default ArchivePage;
