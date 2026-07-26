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
    const { data: allVotes, error: votesError } = await supabase
      .from('topic_votes')
      .select('topic_id, value');

    if (votesError) throw votesError;

    const { data: topicsCount, error: topicsError } = await supabase
      .from('topics')
      .select('id')
      .not('published_at', 'is', null);

    if (topicsError) throw topicsError;

    const totalVotes = allVotes?.length || 0;
    const totalTopics = topicsCount?.length || 0;

    const avgVotesPerTopic = totalTopics > 0 ? totalVotes / totalTopics : 0;

    const distribution: Record<number, number> = { '-1': 0, '0': 0, '1': 0 };
    allVotes?.forEach(v => {
      distribution[v.value] = (distribution[v.value] || 0) + 1;
    });

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
