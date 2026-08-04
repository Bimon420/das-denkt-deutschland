/**
 * Voting Service
 * Handle votes and aggregated statistics
 */

import { supabase } from '@/integrations/supabase/client';
import type { Database } from '@/integrations/supabase/types';

export type TopicVote = Database['public']['Tables']['topic_votes']['Row'];

export interface VoteStats {
  total_votes: number;
  average_score: number;
  vote_distribution: Record<number, number>;
  left_votes: number;
  right_votes: number;
  neutral_votes: number;
}

class VotingService {
  /**
   * Cast a vote
   */
  async vote(topicId: string, value: number) {
    // Normalize value to -1 (left), 0 (neutral), 1 (right)
    const normalized = Math.max(-1, Math.min(1, Math.round(value)));

    const { data, error } = await supabase
      .from('topic_votes')
      .insert({
        topic_id: topicId,
        value: normalized,
      })
      .select()
      .single();

    if (error) throw error;
    return data as TopicVote;
  }

  /**
   * Get all votes for a topic
   */
  async getVotesByTopic(topicId: string) {
    const { data, error } = await supabase
      .from('topic_votes')
      .select('*')
      .eq('topic_id', topicId)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data as TopicVote[];
  }

  /**
   * Get vote statistics for a topic
   */
  async getVoteStats(topicId: string): Promise<VoteStats> {
    const votes = await this.getVotesByTopic(topicId);

    if (votes.length === 0) {
      return {
        total_votes: 0,
        average_score: 0,
        vote_distribution: { '-1': 0, '0': 0, '1': 0 },
        left_votes: 0,
        right_votes: 0,
        neutral_votes: 0,
      };
    }

    const sum = votes.reduce((acc, v) => acc + v.value, 0);
    const distribution: Record<number, number> = { '-1': 0, '0': 0, '1': 0 };

    votes.forEach(v => {
      distribution[v.value] = (distribution[v.value] || 0) + 1;
    });

    return {
      total_votes: votes.length,
      average_score: sum / votes.length,
      vote_distribution: distribution,
      left_votes: distribution['-1'] || 0,
      right_votes: distribution['1'] || 0,
      neutral_votes: distribution['0'] || 0,
    };
  }

  /**
   * Get overall statistics across all topics
   */
  async getGlobalStats() {
    // Vorher wurde JEDE Stimme in den Browser geholt, nur um sie zu zählen — und
    // PostgREST deckelt still bei 1000 Zeilen. `total_votes` konnte also nie mehr als
    // 1000 sein, egal wie oft abgestimmt wurde, und die Verteilung war entsprechend
    // falsch. Eine falsche Zahl sieht aus wie eine richtige; das ist der Grund, warum
    // so etwas jahrelang unbemerkt bleibt.
    //
    // Die richtige Frage war nicht „wie hole ich alle Zeilen", sondern „wofür brauche
    // ich sie überhaupt" — hier ausschliesslich zum Zählen. Das kann die Datenbank
    // selbst, exakt und ohne eine einzige Zeile zu übertragen.
    // (Fehlerklasse: buch 04.08. an celebrity-stonks, Flottendurchlauf orga.)
    const zaehle = async (
      abfrage: PromiseLike<{ count: number | null; error: { message: string } | null }>,
    ) => {
      const { count, error } = await abfrage;
      if (error) throw error;
      return count ?? 0;
    };

    const [totalVotes, totalTopics, linke, neutrale, rechte] = await Promise.all([
      zaehle(supabase.from('topic_votes').select('*', { count: 'exact', head: true })),
      zaehle(supabase.from('topics').select('*', { count: 'exact', head: true })
        .not('published_at', 'is', null)),
      zaehle(supabase.from('topic_votes').select('*', { count: 'exact', head: true }).eq('value', -1)),
      zaehle(supabase.from('topic_votes').select('*', { count: 'exact', head: true }).eq('value', 0)),
      zaehle(supabase.from('topic_votes').select('*', { count: 'exact', head: true }).eq('value', 1)),
    ]);

    const avgVotesPerTopic = totalTopics > 0 ? totalVotes / totalTopics : 0;

    const distribution: Record<number, number> = { '-1': linke, '0': neutrale, '1': rechte };
    // Die drei bekannten Werte MÜSSEN die Gesamtzahl ergeben. Tun sie es nicht, liegen
    // Stimmen mit einem unerwarteten Wert in der Tabelle — das ist ein Datenbefund und
    // gehört gemeldet, statt in einer Verteilung zu verschwinden, die nicht aufgeht.
    const summe = linke + neutrale + rechte;
    if (summe !== totalVotes) {
      console.warn(
        `[votingService] ${totalVotes - summe} Stimmen mit unerwartetem Wert ` +
        `(weder -1, 0 noch 1) — die Verteilung unten geht nicht auf.`,
      );
    }

    return {
      total_votes: totalVotes,
      total_topics: totalTopics,
      avg_votes_per_topic: avgVotesPerTopic,
      left_votes: distribution['-1'] || 0,
      right_votes: distribution['1'] || 0,
      neutral_votes: distribution['0'] || 0,
      vote_distribution: distribution,
    };
  }

  /**
   * Get trending topics (by vote count)
   */
  async getTrendingTopics(limit: number = 10) {
    const { data, error } = await supabase.rpc('get_trending_topics', {
      limit_count: limit,
    });

    if (error) throw error;
    return data;
  }

  /**
   * Check if user has already voted on a topic
   * (requires user context - implement after auth is ready)
   */
  async hasUserVoted(topicId: string, userId?: string): Promise<boolean> {
    if (!userId) return false;

    const { count, error } = await supabase
      .from('topic_votes')
      .select('*', { count: 'exact', head: true })
      .eq('topic_id', topicId)
      // Add user_id column once auth is implemented
      // .eq('user_id', userId)

    if (error) throw error;
    return count ? count > 0 : false;
  }
}

export const votingService = new VotingService();
export default votingService;
