// Themenbereiche für das sortierte Mitglieder-Feld (Simon 30.09.). Dieselbe Liste steht in
// supabase/functions/generate-topics/index.ts (BEREICHE) und im CHECK der Spalte app_ddd.topics.bereich.
export const BEREICHE = [
  { id: "innenpolitik", name: "Innenpolitik & Parteien" },
  { id: "aussenpolitik", name: "Außenpolitik & Krieg" },
  { id: "europa", name: "Europa & EU" },
  { id: "wirtschaft", name: "Wirtschaft & Arbeit" },
  { id: "soziales", name: "Soziales, Rente & Gesundheit" },
  { id: "migration", name: "Migration & Integration" },
  { id: "klima", name: "Klima, Energie & Verkehr" },
  { id: "sicherheit", name: "Sicherheit & Justiz" },
  { id: "digitales", name: "Digitales & Medien" },
  { id: "bildung", name: "Bildung & Familie" },
] as const;

export type BereichId = (typeof BEREICHE)[number]["id"];

/** Gewählte Bereiche zuerst, in der Reihenfolge der Wahl; innerhalb einer Stufe bleibt die bisherige Reihenfolge. */
export function nachBereichenSortiert<T extends { bereich?: string | null }>(themen: T[], wahl: string[]): T[] {
  if (wahl.length === 0) return themen;
  const rang = (t: T) => {
    const i = t.bereich ? wahl.indexOf(t.bereich) : -1;
    return i === -1 ? wahl.length : i;
  };
  return themen.map((t, i) => ({ t, i })).sort((a, b) => rang(a.t) - rang(b.t) || a.i - b.i).map((x) => x.t);
}
