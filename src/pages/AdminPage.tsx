import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate } from "react-router-dom";
import { Loader2, RefreshCw, ArrowLeft, CheckCircle, AlertCircle } from "lucide-react";

const AdminPage = () => {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<{ success: boolean; message: string } | null>(null);
  const navigate = useNavigate();

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
    } catch (e: any) {
      setResult({ success: false, message: e.message || "Fehler bei der Generierung" });
    } finally {
      setLoading(false);
    }
  };

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

      <button
        onClick={generateTopics}
        disabled={loading}
        className="flex items-center gap-2 px-5 py-3 rounded-lg bg-primary text-primary-foreground font-medium text-sm hover:opacity-90 transition-opacity disabled:opacity-50 active:scale-[0.97]"
      >
        {loading ? (
          <Loader2 className="w-4 h-4 animate-spin" />
        ) : (
          <RefreshCw className="w-4 h-4" />
        )}
        {loading ? "Generiere Themen…" : "Jetzt Themen generieren"}
      </button>

      {result && (
        <div
          className={`mt-6 p-4 rounded-lg border flex items-start gap-3 ${
            result.success
              ? "bg-accent/10 border-accent/30 text-foreground"
              : "bg-destructive/10 border-destructive/30 text-foreground"
          }`}
        >
          {result.success ? (
            <CheckCircle className="w-5 h-5 text-accent flex-shrink-0 mt-0.5" />
          ) : (
            <AlertCircle className="w-5 h-5 text-destructive flex-shrink-0 mt-0.5" />
          )}
          <p className="text-sm">{result.message}</p>
        </div>
      )}
    </div>
  );
};

export default AdminPage;
