/**
 * Real-time Service
 * WebSocket subscriptions for live voting updates
 */

import { supabase } from '@/integrations/supabase/client';

export interface RealtimeVoteUpdate {
  type: 'vote_added' | 'stats_updated';
  topicId: string;
  value?: number;
  stats?: {
    left: number;
    neutral: number;
    right: number;
    total: number;
  };
}

type RealtimeCallback = (update: RealtimeVoteUpdate) => void;

class RealtimeService {
  private subscriptions: Map<string, any> = new Map();
  private callbacks: Map<string, RealtimeCallback[]> = new Map();

  /**
   * Subscribe to vote updates for a specific topic
   */
  subscribeToTopicVotes(topicId: string, onUpdate: RealtimeCallback) {
    // Store callback
    if (!this.callbacks.has(topicId)) {
      this.callbacks.set(topicId, []);
    }
    this.callbacks.get(topicId)!.push(onUpdate);

    // Create subscription if not exists
    if (!this.subscriptions.has(topicId)) {
      const channel = supabase
        .channel(`votes-${topicId}`)
        .on(
          'postgres_changes',
          {
            event: 'INSERT',
            schema: 'public',
            table: 'topic_votes',
            filter: `topic_id=eq.${topicId}`,
          },
          payload => {
            const vote = payload.new;
            this.notifyCallbacks(topicId, {
              type: 'vote_added',
              topicId,
              value: vote.value,
            });
          }
        )
        .subscribe();

      this.subscriptions.set(topicId, channel);
    }

    // Return unsubscribe function
    return () => this.unsubscribeFromTopicVotes(topicId, onUpdate);
  }

  /**
   * Unsubscribe from topic votes
   */
  unsubscribeFromTopicVotes(topicId: string, callback: RealtimeCallback) {
    const callbacks = this.callbacks.get(topicId);
    if (callbacks) {
      const index = callbacks.indexOf(callback);
      if (index > -1) {
        callbacks.splice(index, 1);
      }

      // Clean up channel if no more callbacks
      if (callbacks.length === 0) {
        const channel = this.subscriptions.get(topicId);
        if (channel) {
          supabase.removeChannel(channel);
          this.subscriptions.delete(topicId);
          this.callbacks.delete(topicId);
        }
      }
    }
  }

  /**
   * Subscribe to all topics changes (for admin panel)
   */
  subscribeToTopicsChanges(onUpdate: RealtimeCallback) {
    const channel = supabase
      .channel('topics-changes')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'topics' },
        payload => {
          this.notifyCallbacks('topics', {
            type: 'stats_updated',
            topicId: payload.new?.id || payload.old?.id || 'unknown',
          });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }

  /**
   * Notify all callbacks for a topic
   */
  private notifyCallbacks(topicId: string, update: RealtimeVoteUpdate) {
    const callbacks = this.callbacks.get(topicId);
    if (callbacks) {
      callbacks.forEach(cb => {
        try {
          cb(update);
        } catch (e) {
          console.error('Callback error:', e);
        }
      });
    }
  }

  /**
   * Check if subscribed to topic
   */
  isSubscribed(topicId: string): boolean {
    return this.subscriptions.has(topicId);
  }

  /**
   * Get subscription count
   */
  getSubscriptionCount(): number {
    return this.subscriptions.size;
  }

  /**
   * Cleanup all subscriptions
   */
  unsubscribeAll() {
    for (const [topicId, channel] of this.subscriptions.entries()) {
      supabase.removeChannel(channel);
    }
    this.subscriptions.clear();
    this.callbacks.clear();
  }
}

export const realtimeService = new RealtimeService();
export default realtimeService;
