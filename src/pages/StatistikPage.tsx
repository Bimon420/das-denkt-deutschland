import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { ArrowLeft, ShieldCheck, ShieldAlert, Trophy } from "lucide-react";
import { motion } from "framer-motion";
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, CartesianGrid,
} from "recharts";
import { verarbeiteUndPrüfe, type GeprüfteDaten } from "@/lib/statistikRedakteure";

const StatistikPage = () => {
  const navigate = useNavigate();
  const [data, setData] = useState<GeprüfteDaten | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      const [topicsRes, suggestionsRes, votesRes] = await Promise.all([
        supabase.from("topics").select("published_at, id, topic").order("published_at", { ascending: true }),
        supabase.from("topic_suggestions").select("created_at"),
        supabase.from("topic_votes").select("value, topic_id"),
      ]);

      const geprüft = verarbeiteUndPrüfe(
        topicsRes.data,
        suggestionsRes.data,
        votesRes.data,
      );

      setData(geprüft);
      setLoading(false);
    };
    load();
  }, []);

  if (loading || !data) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="animate-spin w-8 h-8 border-2 border-accent border-t-transparent rounded-full" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background text-foreground">
      <header className="sticky top-0 z-30 bg-background/80 backdrop-blur-md border-b border-border px-4 py-3">
        <div className="max-w-3xl mx-auto flex items-center gap-3">
          <button onClick={() => window.history.length > 1 ? navigate(-1) : navigate("/")} className="p-1.5 rounded-full hover:bg-muted transition-colors">
            <ArrowLeft className="w-5 h-5" />
          </button>
          <h1 className="font-bold text-lg tracking-tight">Statistiken</h1>
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-4 py-8 space-y-10">
        {/* Redakteur-Prüfstatus */}
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          className={`rounded-xl border p-3 flex items-start gap-3 text-sm ${
            data.allebestanden
              ? "bg-green-500/10 border-green-500/30 text-green-700 dark:text-green-400"
              : "bg-red-500/10 border-red-500/30 text-red-700 dark:text-red-400"
          }`}
        >
          {data.allebestanden ? (
            <ShieldCheck className="w-5 h-5 shrink-0 mt-0.5" />
          ) : (
            <ShieldAlert className="w-5 h-5 shrink-0 mt-0.5" />
          )}
          <div>
            <div className="font-medium mb-1">
              {data.allebestanden
                ? "Alle 4 Redakteure bestätigen: Daten konsistent ✓"
                : "Dateninkonsistenz erkannt — Details:"}
            </div>
            <ul className="space-y-0.5 text-xs opacity-80">
              {data.prüfungen.map((p) => (
                <li key={p.name}>
                  {p.bestanden ? "✅" : "❌"} <strong>{p.name}</strong>: {p.details}
                </li>
              ))}
            </ul>
          </div>
        </motion.div>

        {/* KPI Cards */}
        <motion.div
          className="grid grid-cols-3 gap-3"
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
        >
          {[
            { label: "Themen", value: data.totalTopics },
            { label: "Einreichungen", value: data.totalSuggestions },
            { label: "Abstimmungen", value: data.totalVotes },
          ].map((kpi) => (
            <div key={kpi.label} className="bg-card rounded-xl border border-border p-4 text-center">
              <div className="text-2xl font-bold tabular-nums">{kpi.value.toLocaleString("de-DE")}</div>
              <div className="text-xs text-muted-foreground mt-1">{kpi.label}</div>
            </div>
          ))}
        </motion.div>

        {/* Bar Chart */}
        <motion.section
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1, duration: 0.5 }}
        >
          <h2 className="font-semibold text-sm mb-3 text-muted-foreground uppercase tracking-wider">
            Themen &amp; Einreichungen pro Tag (letzte 14 Tage)
          </h2>
          <div className="bg-card rounded-xl border border-border p-4">
            <ResponsiveContainer width="100%" height={260}>
              <BarChart data={data.dayStats} barGap={2}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis dataKey="date" tick={{ fontSize: 11 }} stroke="hsl(var(--muted-foreground))" />
                <YAxis allowDecimals={false} tick={{ fontSize: 11 }} stroke="hsl(var(--muted-foreground))" />
                <Tooltip
                  contentStyle={{
                    background: "hsl(var(--card))",
                    border: "1px solid hsl(var(--border))",
                    borderRadius: 8,
                    fontSize: 12,
                  }}
                />
                <Bar dataKey="topics" name="Themen" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
                <Bar dataKey="suggestions" name="Einreichungen" fill="hsl(var(--accent))" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </motion.section>

        {/* Pie Chart */}
        <motion.section
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2, duration: 0.5 }}
        >
          <h2 className="font-semibold text-sm mb-3 text-muted-foreground uppercase tracking-wider">
            Meinungsverteilung
          </h2>
          <div className="bg-card rounded-xl border border-border p-4 flex flex-col sm:flex-row items-center gap-6">
            {data.totalVotes > 0 ? (
              <>
                <ResponsiveContainer width={200} height={200}>
                  <PieChart>
                    <Pie
                      data={data.voteBuckets}
                      dataKey="count"
                      nameKey="label"
                      cx="50%"
                      cy="50%"
                      outerRadius={80}
                      strokeWidth={2}
                      stroke="hsl(var(--card))"
                    >
                      {data.voteBuckets.map((entry, i) => (
                        <Cell key={i} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip
                      contentStyle={{
                        background: "hsl(var(--card))",
                        border: "1px solid hsl(var(--border))",
                        borderRadius: 8,
                        fontSize: 12,
                      }}
                    />
                  </PieChart>
                </ResponsiveContainer>
                <div className="space-y-2">
                  {data.voteBuckets.map((b) => (
                    <div key={b.label} className="flex items-center gap-2 text-sm">
                      <span className="w-3 h-3 rounded-full shrink-0" style={{ background: b.color }} />
                      <span className="text-muted-foreground">{b.label}</span>
                      <span className="font-medium ml-auto tabular-nums">{b.count}</span>
                    </div>
                  ))}
                </div>
              </>
            ) : (
              <p className="text-muted-foreground text-sm py-8 text-center w-full">
                Noch keine Abstimmungen vorhanden.
              </p>
            )}
          </div>
        </motion.section>

        {/* Top Themen Ranking */}
        {data.topThemen.length > 0 && (
          <motion.section
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3, duration: 0.5 }}
          >
            <h2 className="font-semibold text-sm mb-3 text-muted-foreground uppercase tracking-wider">
              Beliebteste Themen nach Abstimmungen
            </h2>
            <div className="bg-card rounded-xl border border-border divide-y divide-border">
              {data.topThemen.map((t, i) => (
                <button
                  key={t.id}
                  onClick={() => navigate(`/thema/${t.id}`)}
                  className="w-full flex items-center gap-3 px-4 py-3 hover:bg-muted/50 transition-colors text-left active:scale-[0.99]"
                >
                  <span className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold shrink-0 ${
                    i === 0 ? "bg-yellow-500/20 text-yellow-600 dark:text-yellow-400" :
                    i === 1 ? "bg-gray-300/20 text-gray-500 dark:text-gray-400" :
                    i === 2 ? "bg-orange-500/20 text-orange-600 dark:text-orange-400" :
                    "bg-muted text-muted-foreground"
                  }`}>
                    {i < 3 ? <Trophy className="w-3.5 h-3.5" /> : i + 1}
                  </span>
                  <span className="text-sm font-medium truncate flex-1">{t.topic}</span>
                  <span className="text-sm tabular-nums text-muted-foreground shrink-0">
                    {t.voteCount} {t.voteCount === 1 ? "Stimme" : "Stimmen"}
                  </span>
                </button>
              ))}
            </div>
          </motion.section>
        )}
      </main>
    </div>
  );
};

export default StatistikPage;
