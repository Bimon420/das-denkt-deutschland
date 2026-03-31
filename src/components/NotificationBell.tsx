import { useState, useEffect } from "react";
import { Bell } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { supabase } from "@/integrations/supabase/client";

const LAST_SEEN_KEY = "ddd-last-seen-topics";

const NotificationBell = () => {
  const [newCount, setNewCount] = useState(0);
  const [showPopup, setShowPopup] = useState(false);
  const [newTopics, setNewTopics] = useState<{ topic: string; published_at: string }[]>([]);

  useEffect(() => {
    const checkNew = async () => {
      const lastSeen = localStorage.getItem(LAST_SEEN_KEY) || "2000-01-01";

      const { data } = await supabase
        .from("topics")
        .select("topic, published_at")
        .gt("created_at", lastSeen)
        .order("created_at", { ascending: false })
        .limit(10);

      if (data && data.length > 0) {
        setNewCount(data.length);
        setNewTopics(data);
      }
    };

    checkNew();

    // Subscribe to realtime changes
    const channel = supabase
      .channel("new-topics")
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "topics" },
        (payload) => {
          setNewCount((prev) => prev + 1);
          setNewTopics((prev) => [
            { topic: payload.new.topic, published_at: payload.new.published_at },
            ...prev,
          ].slice(0, 10));

          // Show browser notification if permitted
          if (Notification.permission === "granted") {
            new Notification("Neues Thema auf DDD", {
              body: payload.new.topic,
              icon: "/logo.png",
            });
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const handleOpen = () => {
    setShowPopup(!showPopup);
    if (!showPopup) {
      // Mark as seen
      localStorage.setItem(LAST_SEEN_KEY, new Date().toISOString());
      setNewCount(0);
    }
  };

  return (
    <div className="relative">
      <button
        onClick={handleOpen}
        className="p-2.5 md:p-2 rounded-full hover:bg-secondary transition-all duration-200 active:scale-95 touch-manipulation relative"
        aria-label="Benachrichtigungen"
      >
        <Bell className="w-[18px] h-[18px] md:w-4 md:h-4 text-muted-foreground" />
        <AnimatePresence>
          {newCount > 0 && (
            <motion.span
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0 }}
              className="absolute -top-0.5 -right-0.5 min-w-[16px] h-4 px-1 flex items-center justify-center rounded-full bg-accent text-[9px] font-bold text-accent-foreground"
            >
              {newCount > 9 ? "9+" : newCount}
            </motion.span>
          )}
        </AnimatePresence>
      </button>

      <AnimatePresence>
        {showPopup && (
          <>
            {/* Backdrop */}
            <div className="fixed inset-0 z-40" onClick={() => setShowPopup(false)} />

            <motion.div
              initial={{ opacity: 0, y: -8, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -8, scale: 0.95 }}
              transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
              className="fixed right-2 left-2 top-14 md:absolute md:right-0 md:left-auto md:top-full md:mt-2 w-auto md:w-80 bg-card border border-border rounded-xl shadow-xl z-50 overflow-hidden"
            >
              <div className="p-3 border-b border-border">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold tracking-wide uppercase text-muted-foreground">
                    Benachrichtigungen
                  </span>
                  <PushToggle />
                </div>
              </div>

              <div className="max-h-64 overflow-y-auto">
                {newTopics.length === 0 ? (
                  <div className="p-6 text-center text-xs text-muted-foreground">
                    Keine neuen Themen seit deinem letzten Besuch.
                  </div>
                ) : (
                  newTopics.map((t, i) => (
                    <motion.div
                      key={i}
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: i * 0.05 }}
                      className="px-3 py-2.5 border-b border-border/50 last:border-0 hover:bg-secondary/50 transition-colors"
                    >
                      <p className="text-sm font-medium text-foreground leading-snug line-clamp-2">
                        {t.topic}
                      </p>
                      <span className="text-[10px] text-muted-foreground mt-0.5 block">
                        {new Date(t.published_at).toLocaleDateString("de-DE", {
                          day: "2-digit",
                          month: "short",
                        })}
                      </span>
                    </motion.div>
                  ))
                )}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
};

/** Small toggle for browser push notification permission */
const PushToggle = ({ onClose }: { onClose: () => void }) => {
  const [permission, setPermission] = useState<NotificationPermission>(
    typeof Notification !== "undefined" ? Notification.permission : "denied"
  );

  const handleClick = async () => {
    if (typeof Notification === "undefined") return;
    if (permission === "granted") {
      onClose();
      return;
    }
    const result = await Notification.requestPermission();
    setPermission(result);
  };

  if (typeof Notification === "undefined") return null;

  return (
    <button
      onClick={handleClick}
      className={`text-[10px] font-semibold px-2 py-1 rounded-full transition-all touch-manipulation ${
        permission === "granted"
          ? "bg-accent/20 text-accent"
          : "bg-secondary text-muted-foreground hover:text-foreground"
      }`}
    >
      {permission === "granted" ? "🔔 Push aktiv" : "Push aktivieren"}
    </button>
  );
};

export default NotificationBell;
