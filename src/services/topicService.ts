/**
 * Topic Service
 * Direct Supabase queries + business logic
 */

import { supabase } from '@/integrations/supabase/client';
import { ladeAlleZeilen } from '@/lib/alleZeilen';
import type { Database } from '@/integrations/supabase/types';

export type Topic = Database['public']['Tables']['topics']['Row'];
export type TopicInsert = Database['public']['Tables']['topics']['Insert'];
export type TopicUpdate = Database['public']['Tables']['topics']['Update'];

class TopicService {
  /**
   * Get all published topics
   */
  async getTopics(limit?: number) {
    let query = supabase
      .from('topics')
      .select('*')
      .not('published_at', 'is', null)
      .order('published_at', { ascending: false });

    if (limit) {
      query = query.limit(limit);
    }

    const { data, error } = await query;
    if (error) throw error;
    return data as Topic[];
  }

  /**
   * Get single topic by ID
   */
  async getTopic(id: string) {
    const { data, error } = await supabase
      .from('topics')
      .select('*')
      .eq('id', id)
      .single();

    if (error) throw error;
    return data as Topic;
  }

  /**
   * Get all unpublished topics (for admin)
   */
  async getPendingTopics() {
    // `await` fehlte hier (Befund orga, 04.08., beim Decke-Durchgang nebenbei gefunden).
    // Ohne await wird nicht das ERGEBNIS zerlegt, sondern der noch laufende Abfrage-Bau:
    // `data` und `error` sind beide undefined, die Fehlerprüfung greift nie, und die
    // Funktion liefert `undefined as Topic[]`. Das Admin-Panel bekam also IMMER eine
    // leere Liste unveroeffentlichter Themen — und zwar ohne Fehlermeldung, weshalb es
    // aussah, als gaebe es einfach keine.
    const { data, error } = await supabase
      .from('topics')
      .select('*')
      .is('published_at', null)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data as Topic[];
  }

  /**
   * Create new topic (draft)
   */
  async createTopic(topic: TopicInsert) {
    const { data, error } = await supabase
      .from('topics')
      .insert(topic)
      .select()
      .single();

    if (error) throw error;
    return data as Topic;
  }

  /**
   * Update topic
   */
  async updateTopic(id: string, updates: TopicUpdate) {
    const { data, error } = await supabase
      .from('topics')
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return data as Topic;
  }

  /**
   * Publish topic (set published_at)
   */
  async publishTopic(id: string) {
    const now = new Date().toISOString();
    return this.updateTopic(id, { published_at: now });
  }

  /**
   * Delete topic
   */
  async deleteTopic(id: string) {
    const { error } = await supabase
      .from('topics')
      .delete()
      .eq('id', id);

    if (error) throw error;
  }

  /**
   * Get topics by category
   */
  async getTopicsByCategory(category: string) {
    const { data, error } = await supabase
      .from('topics')
      .select('*')
      .eq('category', category)
      .not('published_at', 'is', null)
      .order('published_at', { ascending: false });

    if (error) throw error;
    return data as Topic[];
  }

  /**
   * Search topics by title
   */
  async searchTopics(query: string) {
    const { data, error } = await supabase
      .from('topics')
      .select('*')
      .ilike('topic', `%${query}%`)
      .not('published_at', 'is', null);

    if (error) throw error;
    return data as Topic[];
  }

  /**
   * Get recent topics (for homepage)
   */
  async getRecentTopics(limit: number = 10) {
    return this.getTopics(limit);
  }

  /**
   * Get topic with vote stats
   */
  async getTopicWithStats(id: string) {
    const topic = await this.getTopic(id);

    // Seitenweise statt in einem Rutsch: PostgREST deckelt still bei 1000 Zeilen.
    // Ein Thema mit mehr als 1000 Stimmen — also ausgerechnet das erfolgreichste —
    // haette einen Durchschnitt und eine Verteilung ueber die ersten 1000 gezeigt,
    // ohne dass irgendetwas kaputt aussieht.
    //
    // Hier wird die ganze Menge wirklich gebraucht: `average_vote` ist eine Summe, und
    // `votes_by_value` zaehlt je Wert — anders als bei getGlobalStats laesst sich das
    // nicht auf ein paar Zaehl-Abfragen zurueckfuehren, ohne den Wertebereich
    // vorauszusetzen. Also blaettern.
    const { zeilen: votes, vollstaendig } = await ladeAlleZeilen<{ value: number }>(
      (von, bis) => supabase
        .from('topic_votes')
        .select('value')
        .eq('topic_id', id)
        .range(von, bis),
    );
    if (!vollstaendig) {
      console.warn(`[topicService] Stimmen zu Thema ${id} unvollstaendig geladen — ` +
        `die Werte unten sind zu niedrig.`);
    }

    const stats = {
      total_votes: votes?.length || 0,
      average_vote: votes?.length ?
        votes.reduce((sum, v) => sum + v.value, 0) / votes.length : 0,
      votes_by_value: votes?.reduce((acc, v) => {
        acc[v.value] = (acc[v.value] || 0) + 1;
        return acc;
      }, {} as Record<number, number>) || {},
    };

    return { topic, stats };
  }
}

export const topicService = new TopicService();
export default topicService;
