import { motion } from "framer-motion";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

interface StatData {
  topics: number;
  days: number;
  votes: number;
  views: number;
}

const fetchStats = async (): Promise<StatData> => {
  const [topicsRes, votesRes, viewsRes] = await Promise.all([
    supabase.from("topics").select("id, published_at"),
    supabase.from("topic_votes").select("id", { count: "exact", head: true }),
    supabase.from("page_views").select("id", { count: "exact", head: true }),
  ]);

  const topics = topicsRes.data?.length || 0;
  const days = new Set(topicsRes.data?.map((t) => t.published_at)).size;
  const votes = votesRes.count || 0;
  const views = viewsRes.count || 0;

  return { topics, days, votes, views };
};

const StatItem = ({
  value,
  label,
  delay,
}: {
  value: string;
  label: string;
  delay: number;
}) => (
  <motion.div
    className="flex flex-col items-center gap-1"
    initial={{ opacity: 0, y: 12 }}
    whileInView={{ opacity: 1, y: 0 }}
    viewport={{ once: true, amount: 0.5 }}
    transition={{ duration: 0.8, delay, ease: [0.16, 1, 0.3, 1] }}
  >
    <span className="font-editorial text-3xl md:text-5xl font-bold tracking-tight text-foreground">
      {value}
    </span>
    <span className="text-[10px] md:text-xs uppercase tracking-[0.25em] text-muted-foreground/50">
      {label}
    </span>
  </motion.div>
);

const Dot = ({ delay }: { delay: number }) => (
  <motion.span
    className="hidden md:block w-[3px] h-[3px] rounded-full bg-muted-foreground/20"
    initial={{ opacity: 0, scale: 0 }}
    whileInView={{ opacity: 1, scale: 1 }}
    viewport={{ once: true }}
    transition={{ duration: 0.5, delay }}
  />
);

const LiveStats = () => {
  const { data } = useQuery({
    queryKey: ["live-stats"],
    queryFn: fetchStats,
    staleTime: 60_000,
  });

  if (!data) return null;

  return (
    <section className="py-20 md:py-28 px-6">
      {/* Mobil 2x2: vier Zahlen plus Punkte in einer Zeile waren auf 360 px breiter als der Schirm. */}
      <div className="max-w-3xl mx-auto grid grid-cols-2 gap-y-8 gap-x-6 justify-items-center md:flex md:items-end md:justify-center md:gap-14">
        <StatItem value={String(data.topics)} label="Themen" delay={0} />
        <Dot delay={0.15} />
        <StatItem value={String(data.days)} label="Tage" delay={0.1} />
        <Dot delay={0.25} />
        <StatItem value={String(data.votes)} label="Stimmen" delay={0.2} />
        <Dot delay={0.35} />
        <StatItem value={String(data.views)} label="Besuche" delay={0.3} />
      </div>
    </section>
  );
};

export default LiveStats;
