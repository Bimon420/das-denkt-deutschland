/**
 * Admin Service
 * Moderation, publishing, and admin operations
 */

import { supabase } from '@/integrations/supabase/client';
import { topicService, type Topic } from './topicService';
import { canonSyncService } from './canonSyncService';

interface PublishResult {
  success: boolean;
  topic: Topic | null;
  canonUpdated: boolean;
  error?: string;
}

class AdminService {
  /**
   * Get all pending topics (unpublished)
   */
  async getPendingTopics() {
    return topicService.getPendingTopics();
  }

  /**
   * Publish a topic (set published_at timestamp)
   * Triggers canon auto-sync
   */
  async publishTopic(id: string): Promise<PublishResult> {
    try {
      // Validate topic exists and is unpublished
      const topic = await topicService.getTopic(id);
      if (topic.published_at) {
        throw new Error('Topic is already published');
      }

      // Publish
      const published = await topicService.publishTopic(id);

      // Trigger canon sync
      let canonUpdated = false;
      try {
        await canonSyncService.autoSync();
        canonUpdated = true;
      } catch (e) {
        console.error('Canon sync failed after publish:', e);
      }

      return {
        success: true,
        topic: published,
        canonUpdated,
      };
    } catch (e) {
      return {
        success: false,
        topic: null,
        canonUpdated: false,
        error: e instanceof Error ? e.message : 'Unknown error',
      };
    }
  }

  /**
   * Reject topic (delete draft)
   */
  async rejectTopic(id: string, reason?: string) {
    try {
      const topic = await topicService.getTopic(id);
      if (topic.published_at) {
        throw new Error('Cannot reject published topic');
      }

      // Log rejection reason if provided
      if (reason) {
        const { error } = await supabase
          .from('generation_logs')
          .insert({
            success: false,
            topics_count: 0,
            error_message: `Rejected topic ${id}: ${reason}`,
          });
        if (error) throw error;
      }

      // Delete the topic
      await topicService.deleteTopic(id);

      return { success: true };
    } catch (e) {
      return {
        success: false,
        error: e instanceof Error ? e.message : 'Unknown error',
      };
    }
  }

  /**
   * Bulk publish topics
   */
  async bulkPublish(ids: string[]) {
    const results = await Promise.all(
      ids.map(id => this.publishTopic(id))
    );

    const successful = results.filter(r => r.success).length;
    const failed = results.filter(r => !r.success).length;

    return {
      total: ids.length,
      successful,
      failed,
      results,
    };
  }

  /**
   * Get generation logs
   */
  async getGenerationLogs(limit: number = 50) {
    const { data, error } = await supabase
      .from('generation_logs')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(limit);

    if (error) throw error;
    return data;
  }

  /**
   * Log generation event
   */
  async logGeneration(
    success: boolean,
    topicsCount: number,
    errorMessage?: string,
    details?: any
  ) {
    const { data, error } = await supabase
      .from('generation_logs')
      .insert({
        success,
        topics_count: topicsCount,
        error_message: errorMessage || null,
        details,
      })
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  /**
   * Get page view analytics
   */
  async getPageAnalytics() {
    const { data, error } = await supabase
      .from('page_views')
      .select('page, count()');

    if (error) throw error;

    return data;
  }

  /**
   * Track page view
   */
  async trackPageView(page: string) {
    const { error } = await supabase
      .from('page_views')
      .insert({ page });

    if (error) throw error;
  }

  /**
   * Get suggestions
   */
  async getSuggestions() {
    const { data, error } = await supabase
      .from('topic_suggestions')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data;
  }

  /**
   * Get suggestion details
   */
  async getSuggestion(id: string) {
    const { data, error } = await supabase
      .from('topic_suggestions')
      .select('*')
      .eq('id', id)
      .single();

    if (error) throw error;
    return data;
  }

  /**
   * Create topic from suggestion
   */
  async createTopicFromSuggestion(
    suggestionId: string,
    topicData: any
  ) {
    try {
      // Create the topic
      const topic = await topicService.createTopic(topicData);

      // Delete the suggestion (or mark as used)
      await supabase
        .from('topic_suggestions')
        .delete()
        .eq('id', suggestionId);

      return { success: true, topic };
    } catch (e) {
      return {
        success: false,
        error: e instanceof Error ? e.message : 'Unknown error',
      };
    }
  }

  /**
   * Batch import topics from JSON
   */
  async batchImportTopics(topics: any[]) {
    try {
      const { data, error } = await supabase
        .from('topics')
        .insert(topics)
        .select();

      if (error) throw error;

      // Log successful import
      await this.logGeneration(true, topics.length, undefined, {
        type: 'batch_import',
        imported_count: data?.length || 0,
      });

      return { success: true, imported: data?.length || 0 };
    } catch (e) {
      return {
        success: false,
        error: e instanceof Error ? e.message : 'Unknown error',
      };
    }
  }

  /**
   * Export all published topics as JSON
   */
  async exportTopics() {
    try {
      const topics = await topicService.getTopics();
      return {
        success: true,
        data: topics,
        timestamp: new Date().toISOString(),
        count: topics.length,
      };
    } catch (e) {
      return {
        success: false,
        error: e instanceof Error ? e.message : 'Unknown error',
      };
    }
  }
}

export const adminService = new AdminService();
export default adminService;
