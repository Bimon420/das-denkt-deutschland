import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Link } from "react-router-dom";
import { ArrowLeft, Download, Database, Clock, AlertTriangle, CheckCircle2, XCircle } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { useState } from "react";

interface RawTopic {
  id: string;
  topic: string;
  tag_type: string;
  category: string;
  left_position: string;
  left_quote: string;
  left_speaker: string;
  left_hidden_meaning: string | null;
  left_negative_effects: string | null;
  left_sources: any;
  right_position: string;
  right_quote: string;
  right_speaker: string;
  right_hidden_meaning: string | null;
  right_negative_effects: string | null;
  right_sources: any;
  mitte_view: string;
  published_at: string;
  created_at: string;
}

function analyzeIntegrity(topic: RawTopic) {
  const issues: string[] = [];
  const warnings: string[] = [];

  // Check sources
  const leftSources = Array.isArray(topic.left_sources) ? topic.left_sources : [];
  const rightSources = Array.isArray(topic.right_sources) ? topic.right_sources : [];
  const allSources = [...leftSources, ...rightSources];

  const totalSources = allSources.length;
  const linkedSources = allSources.filter((s: any) => s.url && s.url.trim() !== "").length;
  const unlinkedSources = totalSources - linkedSources;

  if (totalSources === 0) issues.push("Keine Quellen vorhanden");
  if (unlinkedSources > 0) warnings.push(`${unlinkedSources} von ${totalSources} Quellen ohne URL`);

  // Check for generic speakers
  const genericSpeakers = ["Konservative Kommentatoren", "Progressive Stimmen", "Politische Beobachter"];
  if (genericSpeakers.some(g => topic.left_speaker?.includes(g))) warnings.push("Links: Generischer Sprecher");
  if (genericSpeakers.some(g => topic.right_speaker?.includes(g))) warnings.push("Rechts: Generischer Sprecher");

  // Check missing fields
  if (!topic.left_hidden_meaning) warnings.push("Links: hidden_meaning fehlt");
  if (!topic.right_hidden_meaning) warnings.push("Rechts: hidden_meaning fehlt");
  if (!topic.left_negative_effects) warnings.push("Links: negative_effects fehlt");
  if (!topic.right_negative_effects) warnings.push("Rechts: negative_effects fehlt");

  // Check mitte_view length
  if (topic.mitte_view && topic.mitte_view.length < 100) warnings.push("Mitte-Perspektive sehr kurz");

  return { issues, warnings, totalSources, linkedSources };
}

export default function TransparenzPage() {
  const [expandedIds, setExpandedIds] = useState<Set<string>>(new Set());

  const { data: topics, isLoading, error } = useQuery({
    queryKey: ["transparenz-raw-topics"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("topics")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(500);
      if (error) throw error;
      return data as RawTopic[];
    },
  });

  const toggleExpand = (id: string) => {
    setExpandedIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const handleExportJSON = () => {
    if (!topics) return;
    const blob = new Blob([JSON.stringify(topics, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `ddd-rohdaten-${new Date().toISOString().split("T")[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleExportCSV = () => {
    if (!topics) return;
    const headers = [
      "id", "topic", "tag_type", "category", "published_at", "created_at",
      "left_position", "left_quote", "left_speaker", "left_hidden_meaning", "left_negative_effects",
      "left_sources_count", "left_sources_linked",
      "right_position", "right_quote", "right_speaker", "right_hidden_meaning", "right_negative_effects",
      "right_sources_count", "right_sources_linked",
      "mitte_view"
    ];
    const escape = (s: string | null) => `"${(s || "").replace(/"/g, '""')}"`;
    const rows = topics.map(t => {
      const ls = Array.isArray(t.left_sources) ? t.left_sources : [];
      const rs = Array.isArray(t.right_sources) ? t.right_sources : [];
      return [
        t.id, escape(t.topic), t.tag_type, t.category, t.published_at, t.created_at,
        escape(t.left_position), escape(t.left_quote), escape(t.left_speaker),
        escape(t.left_hidden_meaning), escape(t.left_negative_effects),
        ls.length, ls.filter((s: any) => s.url).length,
        escape(t.right_position), escape(t.right_quote), escape(t.right_speaker),
        escape(t.right_hidden_meaning), escape(t.right_negative_effects),
        rs.length, rs.filter((s: any) => s.url).length,
        escape(t.mitte_view)
      ].join(",");
    });
    const csv = [headers.join(","), ...rows].join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `ddd-rohdaten-${new Date().toISOString().split("T")[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  // Stats
  const totalTopics = topics?.length || 0;
  const dates = [...new Set(topics?.map(t => t.published_at) || [])];
  const totalIssues = topics?.reduce((sum, t) => sum + analyzeIntegrity(t).issues.length, 0) || 0;
  const totalWarnings = topics?.reduce((sum, t) => sum + analyzeIntegrity(t).warnings.length, 0) || 0;

  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* Header */}
      <header className="border-b border-border px-4 py-4">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link to="/app" className="text-muted-foreground hover:text-foreground transition-colors">
              <ArrowLeft className="w-5 h-5" />
            </Link>
            <div className="flex items-center gap-2">
              <Database className="w-5 h-5 text-muted-foreground" />
              <h1 className="font-mono text-lg font-bold">Rohdaten & Transparenz</h1>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={handleExportJSON} disabled={!topics?.length}>
              <Download className="w-3.5 h-3.5 mr-1.5" />
              JSON
            </Button>
            <Button variant="outline" size="sm" onClick={handleExportCSV} disabled={!topics?.length}>
              <Download className="w-3.5 h-3.5 mr-1.5" />
              CSV
            </Button>
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 py-6 space-y-6">
        {/* Disclaimer */}
        <Card className="border-amber-500/30 bg-amber-500/5">
          <CardContent className="p-4">
            <div className="flex gap-3">
              <AlertTriangle className="w-5 h-5 text-amber-500 shrink-0 mt-0.5" />
              <div className="text-sm text-muted-foreground space-y-1">
                <p className="font-semibold text-foreground">Rohdaten-Dump — keine redaktionelle Aufbereitung</p>
                <p>
                  Diese Seite zeigt <strong>alle</strong> Daten aus der Datenbank, inklusive möglicherweise fehlerhafter, 
                  unvollständiger oder verworfener Einträge. Sie dient der vollständigen Nachvollziehbarkeit 
                  und richtet sich an technisch versierte Nutzer, Forscher und Faktenchecker.
                </p>
                <p className="text-xs text-muted-foreground/70">
                  Letzte Aktualisierung: Echtzeit aus der Datenbank · {totalTopics} Datensätze · {dates.length} Tage
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <Card>
            <CardContent className="p-4 text-center">
              <div className="text-2xl font-mono font-bold">{totalTopics}</div>
              <div className="text-xs text-muted-foreground">Datensätze</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 text-center">
              <div className="text-2xl font-mono font-bold">{dates.length}</div>
              <div className="text-xs text-muted-foreground">Tage</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 text-center">
              <div className="text-2xl font-mono font-bold text-red-500">{totalIssues}</div>
              <div className="text-xs text-muted-foreground">Fehler</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 text-center">
              <div className="text-2xl font-mono font-bold text-amber-500">{totalWarnings}</div>
              <div className="text-xs text-muted-foreground">Warnungen</div>
            </CardContent>
          </Card>
        </div>

        {/* Loading / Error */}
        {isLoading && <p className="text-center text-muted-foreground py-12">Lade Rohdaten…</p>}
        {error && <p className="text-center text-red-500 py-12">Fehler: {(error as Error).message}</p>}

        {/* Data entries */}
        {topics?.map((topic) => {
          const { issues, warnings, totalSources, linkedSources } = analyzeIntegrity(topic);
          const isExpanded = expandedIds.has(topic.id);
          const hasProblems = issues.length > 0 || warnings.length > 0;

          return (
            <Collapsible key={topic.id} open={isExpanded} onOpenChange={() => toggleExpand(topic.id)}>
              <Card className={hasProblems ? "border-amber-500/20" : "border-border"}>
                <CollapsibleTrigger asChild>
                  <CardHeader className="cursor-pointer hover:bg-muted/30 transition-colors p-4">
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <Badge variant="outline" className="font-mono text-[10px] shrink-0">
                            {topic.published_at}
                          </Badge>
                          <Badge variant="secondary" className="text-[10px]">{topic.tag_type}</Badge>
                          {issues.length > 0 && (
                            <XCircle className="w-3.5 h-3.5 text-red-500 shrink-0" />
                          )}
                          {warnings.length > 0 && issues.length === 0 && (
                            <AlertTriangle className="w-3.5 h-3.5 text-amber-500 shrink-0" />
                          )}
                          {!hasProblems && (
                            <CheckCircle2 className="w-3.5 h-3.5 text-green-500 shrink-0" />
                          )}
                        </div>
                        <CardTitle className="text-sm font-semibold leading-tight truncate">
                          {topic.topic}
                        </CardTitle>
                        <div className="flex items-center gap-3 mt-1 text-[10px] text-muted-foreground font-mono">
                          <span>ID: {topic.id.slice(0, 8)}…</span>
                          <span>Quellen: {linkedSources}/{totalSources}</span>
                          <span>{new Date(topic.created_at).toLocaleTimeString("de-DE")}</span>
                        </div>
                      </div>
                      <span className="text-muted-foreground text-xs shrink-0">
                        {isExpanded ? "▲" : "▼"}
                      </span>
                    </div>
                  </CardHeader>
                </CollapsibleTrigger>

                <CollapsibleContent>
                  <CardContent className="p-4 pt-0 space-y-4">
                    {/* Issues & Warnings */}
                    {hasProblems && (
                      <div className="space-y-1">
                        {issues.map((issue, i) => (
                          <div key={i} className="flex items-center gap-2 text-xs text-red-500">
                            <XCircle className="w-3 h-3" />
                            <span>{issue}</span>
                          </div>
                        ))}
                        {warnings.map((warn, i) => (
                          <div key={i} className="flex items-center gap-2 text-xs text-amber-500">
                            <AlertTriangle className="w-3 h-3" />
                            <span>{warn}</span>
                          </div>
                        ))}
                      </div>
                    )}

                    {/* Raw data */}
                    <div className="grid md:grid-cols-2 gap-4">
                      {/* Left */}
                      <div className="space-y-2">
                        <h4 className="text-xs font-bold text-left uppercase tracking-wider">Links</h4>
                        <div className="bg-muted/50 rounded p-3 space-y-2 text-xs font-mono">
                          <div><span className="text-muted-foreground">position:</span> {topic.left_position}</div>
                          <div><span className="text-muted-foreground">quote:</span> „{topic.left_quote}"</div>
                          <div><span className="text-muted-foreground">speaker:</span> {topic.left_speaker}</div>
                          <div><span className="text-muted-foreground">hidden_meaning:</span> {topic.left_hidden_meaning || "—"}</div>
                          <div><span className="text-muted-foreground">negative_effects:</span> {topic.left_negative_effects || "—"}</div>
                          <div>
                            <span className="text-muted-foreground">sources:</span>
                            <pre className="mt-1 text-[10px] overflow-x-auto whitespace-pre-wrap break-all">
                              {JSON.stringify(topic.left_sources, null, 2)}
                            </pre>
                          </div>
                        </div>
                      </div>

                      {/* Right */}
                      <div className="space-y-2">
                        <h4 className="text-xs font-bold text-right-red uppercase tracking-wider">Rechts</h4>
                        <div className="bg-muted/50 rounded p-3 space-y-2 text-xs font-mono">
                          <div><span className="text-muted-foreground">position:</span> {topic.right_position}</div>
                          <div><span className="text-muted-foreground">quote:</span> „{topic.right_quote}"</div>
                          <div><span className="text-muted-foreground">speaker:</span> {topic.right_speaker}</div>
                          <div><span className="text-muted-foreground">hidden_meaning:</span> {topic.right_hidden_meaning || "—"}</div>
                          <div><span className="text-muted-foreground">negative_effects:</span> {topic.right_negative_effects || "—"}</div>
                          <div>
                            <span className="text-muted-foreground">sources:</span>
                            <pre className="mt-1 text-[10px] overflow-x-auto whitespace-pre-wrap break-all">
                              {JSON.stringify(topic.right_sources, null, 2)}
                            </pre>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Mitte */}
                    <div className="space-y-2">
                      <h4 className="text-xs font-bold text-mitte uppercase tracking-wider">Die Mitte</h4>
                      <div className="bg-muted/50 rounded p-3 text-xs font-mono">
                        {topic.mitte_view}
                      </div>
                    </div>

                    {/* Meta */}
                    <div className="bg-muted/30 rounded p-3 text-[10px] font-mono text-muted-foreground space-y-1">
                      <div>id: {topic.id}</div>
                      <div>created_at: {topic.created_at}</div>
                      <div>published_at: {topic.published_at}</div>
                      <div>category: {topic.category}</div>
                      <div>tag_type: {topic.tag_type}</div>
                    </div>
                  </CardContent>
                </CollapsibleContent>
              </Card>
            </Collapsible>
          );
        })}
      </main>
    </div>
  );
}
