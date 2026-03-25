import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { supabase } from "@/integrations/supabase/client";
import { Eye } from "lucide-react";

const ViewCounter = ({ page = "intro" }: { page?: string }) => {
  const [count, setCount] = useState<number | null>(null);

  useEffect(() => {
    const trackAndLoad = async () => {
      // Log this view
      const alreadyCounted = sessionStorage.getItem("intro-viewed");
      if (!alreadyCounted) {
        await supabase.from("page_views").insert({ page: "intro" });
        sessionStorage.setItem("intro-viewed", "1");
      }

      // Load total count
      const { count: total } = await supabase
        .from("page_views")
        .select("*", { count: "exact", head: true })
        .eq("page", "intro");

      if (total !== null) setCount(total);
    };

    trackAndLoad();
  }, []);

  if (count === null) return null;

  return (
    <motion.div
      className="flex items-center justify-center gap-1.5 text-[11px] text-muted-foreground/50"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ delay: 0.5, duration: 0.6 }}
    >
      <Eye className="w-3 h-3" />
      <span className="tabular-nums">{count.toLocaleString("de-DE")}</span>
      <span>Aufrufe</span>
    </motion.div>
  );
};

export default ViewCounter;
