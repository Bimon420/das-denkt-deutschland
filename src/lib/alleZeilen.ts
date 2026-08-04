/**
 * ALLE ZEILEN HOLEN — gegen die stille 1000er-Decke von PostgREST.
 *
 * Befund (buch, 04.08.2026, an celebrity-stonks gemessen; Flottendurchlauf orga):
 * Supabase/PostgREST deckelt JEDE Abfrage serverseitig bei 1000 Zeilen — ohne Fehler,
 * ohne Warnung, ohne Hinweis in der Antwort. Bei aufsteigender Sortierung bekommt man
 * die ÄLTESTEN 1000.
 *
 * Warum das hier besonders weh tut: Eine Seite, die „Statistik" heißt, hat genau eine
 * Aufgabe — richtig zusammenzurechnen. Rechnet sie über die ältesten 1000 Stimmen,
 * ist jede Zahl darauf falsch, und zwar ohne dass irgendetwas kaputt aussieht.
 * Ein leerer Chart fällt auf; ein falscher Prozentwert nicht.
 */
type Abfrage<T> = PromiseLike<{ data: T[] | null; error: { message: string } | null }>;

export const SERVER_DECKE = 1000;

export async function ladeAlleZeilen<T>(
  baueAbfrage: (von: number, bis: number) => Abfrage<T>,
  maxZeilen = 50_000,
): Promise<{ zeilen: T[]; vollstaendig: boolean }> {
  const zeilen: T[] = [];
  while (zeilen.length < maxZeilen) {
    const von = zeilen.length;
    const bis = Math.min(von + SERVER_DECKE, maxZeilen) - 1;
    const { data, error } = await baueAbfrage(von, bis);
    if (error) {
      console.warn("[alleZeilen] Abfrage gescheitert, Ergebnis unvollständig:", error.message);
      return { zeilen, vollstaendig: false };
    }
    if (!data || data.length === 0) return { zeilen, vollstaendig: true };
    zeilen.push(...data);
    if (data.length < bis - von + 1) return { zeilen, vollstaendig: true };
  }
  console.warn(`[alleZeilen] Obergrenze ${maxZeilen} erreicht — es fehlen Zeilen.`);
  return { zeilen, vollstaendig: false };
}
