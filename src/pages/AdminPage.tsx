import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate } from "react-router-dom";
import { Loader2, RefreshCw, ArrowLeft, CheckCircle, AlertCircle, Clock } from "lucide-react";

interface GenerationLog {
  id: string;
  created_at: string;
  success: boolean;
  topics_count: number;
  rejected_count: number;
  error_message: string | null;
}

const AdminPage = () => {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<{ success: boolean; message: string } | null>(null);
  const [logs, setLogs] = useState<GenerationLog[]>([]);
  const [logsLoading, setLogsLoading] = useState(true);
  const navigate = useNavigate();

  const fetchLogs = async () => {
    const { data } = await supabase
      .from("generation_logs")
      .select("id, created_at, success, topics_count, rejected_count, error_message")
      .order("created_at", { ascending: false })
      .limit(10);
    setLogs((data as GenerationLog[]) || []);
    setLogsLoading(false);
  };

  useEffect(() => { fetchLogs(); }, []);

  const generateTopics = async () => {
    setLoading(true);
    setResult(null);
    try {
      const url = `https://${import.meta.env.VITE_SUPABASE_PROJECT_ID}.supabase.co/functions/v1/generate-topics`;
      const response = await fetch(url, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "apikey": import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY,
          "Authorization": `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
        },
        body: JSON.stringify({}),
        signal: AbortSignal.timeout(120_000),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || `HTTP ${response.status}`);
      setResult({
        success: data.success,
        message: data.success
          ? `${data.count} Themen generiert, ${data.rejected || 0} abgelehnt.`
          : data.error || "Unbekannter Fehler",
      });
      fetchLogs();
    } catch (e: any) {
      setResult({ success: false, message: e.message || "Fehler bei der Generierung" });
      fetchLogs();
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (iso: string) => {
    const d = new Date(iso);
    return d.toLocaleDateString("de-DE", { day: "2-digit", month: "2-digit", year: "numeric", hour: "2-digit", minute: "2-digit" });
  };

  const hasRecentFailure = logs.length > 0 && !logs[0].success;

  return (
    <div className="min-h-[100dvh] bg-background px-5 py-8 max-w-xl mx-auto">
      <button
        onClick={() => navigate("/app")}
        className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors mb-8 active:scale-95"
      >
        <ArrowLeft className="w-4 h-4" />
        Zurück
      </button>

      <h1 className="font-editorial text-3xl font-bold mb-2">Admin</h1>
      <p className="text-sm text-muted-foreground mb-8">
        Themen manuell generieren oder den täglichen Cron-Job abwarten (06:00 UTC).
      </p>

      {hasRecentFailure && (
        <div className="mb-6 p-4 rounded-lg border bg-destructive/10 border-destructive/30 flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-destructive flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-medium text-foreground">Letzte Generierung fehlgeschlagen</p>
            <p className="text-xs text-muted-foreground mt-1">{logs[0].error_message || "Unbekannter Fehler"}</p>
            <p className="text-xs text-muted-foreground">{formatDate(logs[0].created_at)}</p>
          </div>
        </div>
      )}

      <button
        onClick={generateTopics}
        disabled={loading}
        className="flex items-center gap-2 px-5 py-3 rounded-lg bg-primary text-primary-foreground font-medium text-sm hover:opacity-90 transition-opacity disabled:opacity-50 active:scale-[0.97]"
      >
        {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <RefreshCw className="w-4 h-4" />}
        {loading ? "Generiere Themen…" : "Jetzt Themen generieren"}
      </button>

      {result && (
        <div className={`mt-6 p-4 rounded-lg border flex items-start gap-3 ${result.success ? "bg-accent/10 border-accent/30 text-foreground" : "bg-destructive/10 border-destructive/30 text-foreground"}`}>
          {result.success ? <CheckCircle className="w-5 h-5 text-accent flex-shrink-0 mt-0.5" /> : <AlertCircle className="w-5 h-5 text-destructive flex-shrink-0 mt-0.5" />}
          <p className="text-sm">{result.message}</p>
        </div>
      )}

      <div className="mt-10">
        <h2 className="font-medium text-lg mb-4 flex items-center gap-2">
          <Clock className="w-4 h-4" />
          Letzte Generierungen
        </h2>
        {logsLoading ? (
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Loader2 className="w-4 h-4 animate-spin" /> Lade…
          </div>
        ) : logs.length === 0 ? (
          <p className="text-sm text-muted-foreground">Noch keine Generierungen durchgeführt.</p>
        ) : (
          <div className="space-y-2">
            {logs.map((log) => (
              <div key={log.id} className={`p-3 rounded-lg border text-sm flex items-center justify-between ${log.success ? "border-border" : "border-destructive/30 bg-destructive/5"}`}>
                <div className="flex items-center gap-2">
                  {log.success ? <CheckCircle className="w-4 h-4 text-accent" /> : <AlertCircle className="w-4 h-4 text-destructive" />}
                  <span className="text-muted-foreground">{formatDate(log.created_at)}</span>
                </div>
                <span className="text-xs">
                  {log.success
                    ? `${log.topics_count} Themen, ${log.rejected_count} abgelehnt`
                    : log.error_message?.slice(0, 50) || "Fehler"}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminPage;
