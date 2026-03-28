import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { ArrowLeft } from "lucide-react";
import { motion } from "framer-motion";
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, CartesianGrid,
} from "recharts";

interface DayStat {
  date: string;
  topics: number;
  suggestions: number;
}

interface VoteBucket {
  label: string;
  count: number;
  color: string;
}

const VOTE_COLORS = [
  "hsl(0, 72%, 51%)",    // links/rot
  "hsl(25, 90%, 55%)",
  "hsl(46, 100%, 50%)",  // mitte/gold
  "hsl(150, 60%, 45%)",
  "hsl(210, 70%, 50%)",  // rechts/blau
];

const StatistikPage = () => {
  const navigate = useNavigate();
  const [dayStats, setDayStats] = useState<DayStat[]>([]);
  const [voteBuckets, setVoteBuckets] = useState<VoteBucket[]>([]);
  const [totalTopics, setTotalTopics] = useState(0);
  const [totalSuggestions, setTotalSuggestions] = useState(0);
  const [totalVotes, setTotalVotes] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      // Fetch topics grouped by day
      const { data: topics } = await supabase
        .from("topics")
        .select("published_at")
        .order("published_at", { ascending: true });

      // Fetch suggestions
      const { data: suggestions } = await supabase
        .from("topic_suggestions")
        .select("created_at");

      // Fetch votes
      const { data: votes } = await supabase
        .from("topic_votes")
        .select("value");

      // -- Topics per day --
      const topicsByDay: Record<string, number> = {};
      (topics || []).forEach((t) => {
        const d = t.published_at;
        topicsByDay[d] = (topicsByDay[d] || 0) + 1;
      });

      // -- Suggestions per day --
      const suggsByDay: Record<string, number> = {};
      (suggestions || []).forEach((s) => {
        const d = s.created_at.split("T")[0];
        suggsByDay[d] = (suggsByDay[d] || 0) + 1;
      });

      // Merge days
      const allDays = new Set([...Object.keys(topicsByDay), ...Object.keys(suggsByDay)]);
      const merged: DayStat[] = Array.from(allDays)
        .sort()
        .slice(-14) // last 14 days
        .map((date) => ({
          date: new Date(date).toLocaleDateString("de-DE", { day: "2-digit", month: "2-digit" }),
          topics: topicsByDay[date] || 0,
          suggestions: suggsByDay[date] || 0,
        }));
      setDayStats(merged);
      setTotalTopics((topics || []).length);
      setTotalSuggestions((suggestions || []).length);

      // -- Vote distribution --
      const buckets = [
        { label: "Stark links", min: -50, max: -30, count: 0 },
        { label: "Eher links", min: -29, max: -10, count: 0 },
        { label: "Mitte", min: -9, max: 9, count: 0 },
        { label: "Eher rechts", min: 10, max: 29, count: 0 },
        { label: "Stark rechts", min: 30, max: 50, count: 0 },
      ];
      (votes || []).forEach((v) => {
        for (const b of buckets) {
          if (v.value >= b.min && v.value <= b.max) {
            b.count++;
            break;
          }
        }
      });
      setVoteBuckets(buckets.map((b, i) => ({ label: b.label, count: b.count, color: VOTE_COLORS[i] })));
      setTotalVotes((votes || []).length);

      setLoading(false);
    };
    load();
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="animate-spin w-8 h-8 border-2 border-accent border-t-transparent rounded-full" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* Header */}
      <header className="sticky top-0 z-30 bg-background/80 backdrop-blur-md border-b border-border px-4 py-3">
        <div className="max-w-3xl mx-auto flex items-center gap-3">
          <button onClick={() => navigate(-1)} className="p-1.5 rounded-full hover:bg-muted transition-colors">
            <ArrowLeft className="w-5 h-5" />
          </button>
          <h1 className="font-bold text-lg tracking-tight">Statistiken</h1>
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-4 py-8 space-y-10">
        {/* KPI Cards */}
        <motion.div
          className="grid grid-cols-3 gap-3"
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
        >
          {[
            { label: "Themen", value: totalTopics },
            { label: "Einreichungen", value: totalSuggestions },
            { label: "Abstimmungen", value: totalVotes },
          ].map((kpi) => (
            <div key={kpi.label} className="bg-card rounded-xl border border-border p-4 text-center">
              <div className="text-2xl font-bold tabular-nums">{kpi.value.toLocaleString("de-DE")}</div>
              <div className="text-xs text-muted-foreground mt-1">{kpi.label}</div>
            </div>
          ))}
        </motion.div>

        {/* Bar Chart — Topics + Suggestions per day */}
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
              <BarChart data={dayStats} barGap={2}>
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

        {/* Pie Chart — Vote distribution */}
        <motion.section
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2, duration: 0.5 }}
        >
          <h2 className="font-semibold text-sm mb-3 text-muted-foreground uppercase tracking-wider">
            Meinungsverteilung
          </h2>
          <div className="bg-card rounded-xl border border-border p-4 flex flex-col sm:flex-row items-center gap-6">
            {totalVotes > 0 ? (
              <>
                <ResponsiveContainer width={200} height={200}>
                  <PieChart>
                    <Pie
                      data={voteBuckets}
                      dataKey="count"
                      nameKey="label"
                      cx="50%"
                      cy="50%"
                      outerRadius={80}
                      strokeWidth={2}
                      stroke="hsl(var(--card))"
                    >
                      {voteBuckets.map((entry, i) => (
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
                  {voteBuckets.map((b) => (
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
      </main>
    </div>
  );
};

export default StatistikPage;
