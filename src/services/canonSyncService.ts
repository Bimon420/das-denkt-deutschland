/**
 * Canon Sync Service
 * Scenario B: Auto-generates canon.md from database
 * Triggers on topic changes
 */

import { supabase } from '@/integrations/supabase/client';
import { canonApi } from '@/integrations/canonApiService';
import type { Topic } from './topicService';

interface CanonSection {
  id: string;
  title: string;
  category: string;
  lastUpdated: string;
  positions: {
    left: string;
    mitte: string;
    right: string;
  };
  votes: {
    left: number;
    neutral: number;
    right: number;
  };
  sources: {
    left: string[];
    right: string[];
  };
}

class CanonSyncService {
  private lastGeneratedHash: string | null = null;
  private isGenerating: boolean = false;

  /**
   * Generates complete canon.md from all published topics
   */
  async generateCanonFromTopics(): Promise<string> {
    if (this.isGenerating) return '';
    this.isGenerating = true;

    try {
      const { data: topics, error } = await supabase
        .from('topics')
        .select('*')
        .not('published_at', 'is', null)
        .order('published_at', { ascending: false });

      if (error) throw error;

      const sections = await Promise.all(
        (topics || []).map(t => this.topicToCanonSection(t))
      );

      const canon = this.buildCanonMarkdown(sections);
      return canon;
    } finally {
      this.isGenerating = false;
    }
  }

  /**
   * Convert single topic to canon section with stats
   */
  private async topicToCanonSection(topic: Topic): Promise<CanonSection> {
    // Get vote stats for this topic
    const { data: votes, error } = await supabase
      .from('topic_votes')
      .select('value')
      .eq('topic_id', topic.id);

    if (error) throw error;

    const voteStats = {
      left: votes?.filter(v => v.value === -1).length || 0,
      neutral: votes?.filter(v => v.value === 0).length || 0,
      right: votes?.filter(v => v.value === 1).length || 0,
    };

    return {
      id: topic.id,
      title: topic.topic,
      category: topic.category,
      lastUpdated: topic.published_at || topic.created_at,
      positions: {
        left: topic.left_position,
        mitte: topic.mitte_view,
        right: topic.right_position,
      },
      votes: voteStats,
      sources: {
        left: Array.isArray(topic.left_sources) ? topic.left_sources : [],
        right: Array.isArray(topic.right_sources) ? topic.right_sources : [],
      },
    };
  }

  /**
   * Build complete markdown from sections
   */
  private buildCanonMarkdown(sections: CanonSection[]): string {
    const now = new Date().toISOString();
    const grouped = this.groupByCategory(sections);

    let md = `# Das Denkt Deutschland - Argumentations-Kanon

**Auto-generated:** ${now}
**Source:** Supabase Topics Database
**Version:** ${sections.length}-topics

---

## Übersicht

| Kategorie | Topics | Bürger-Stimmen |
|-----------|--------|-----------------|
`;

    // Add category overview
    for (const [cat, topicsInCat] of Object.entries(grouped)) {
      const totalVotes = topicsInCat.reduce(
        (sum, t) => sum + t.votes.left + t.votes.neutral + t.votes.right,
        0
      );
      md += `| ${cat} | ${topicsInCat.length} | ${totalVotes} |\n`;
    }

    md += '\n---\n\n';

    // Add detailed sections by category
    for (const [category, topics] of Object.entries(grouped)) {
      md += `## ${category}\n\n`;

      for (const topic of topics) {
        md += this.buildTopicSection(topic);
      }

      md += '\n';
    }

    // Add statistics section
    md += this.buildStatisticsSection(sections);

    return md;
  }

  /**
   * Build markdown for single topic
   */
  private buildTopicSection(section: CanonSection): string {
    const total =
      section.votes.left + section.votes.neutral + section.votes.right;
    const leftPct = total > 0 ? ((section.votes.left / total) * 100).toFixed(1) : 0;
    const rightPct = total > 0 ? ((section.votes.right / total) * 100).toFixed(1) : 0;
    const neutralPct = total > 0 ? ((section.votes.neutral / total) * 100).toFixed(1) : 0;

    let md = `### ${section.title}\n\n`;
    md += `**Kategorie:** ${section.category} | **Votes:** ${total} | **Zuletzt:** ${new Date(section.lastUpdated).toLocaleDateString('de-DE')}\n\n`;

    md += `#### Positionen\n\n`;
    md += `**🔴 Links:** ${section.positions.left}\n\n`;
    md += `**⚪ Mitte:** ${section.positions.mitte}\n\n`;
    md += `**🔵 Rechts:** ${section.positions.right}\n\n`;

    md += `#### Bürgerbeteiligung\n\n`;
    md += `\`\`\`\n`;
    md += `Links:   ${section.votes.left} (${leftPct}%)\n`;
    md += `Neutral: ${section.votes.neutral} (${neutralPct}%)\n`;
    md += `Rechts:  ${section.votes.right} (${rightPct}%)\n`;
    md += `\`\`\`\n\n`;

    if (section.sources.left.length > 0 || section.sources.right.length > 0) {
      md += `#### Quellen\n\n`;
      if (section.sources.left.length > 0) {
        md += `**Links:** ${section.sources.left.join(', ')}\n\n`;
      }
      if (section.sources.right.length > 0) {
        md += `**Rechts:** ${section.sources.right.join(', ')}\n\n`;
      }
    }

    return md;
  }

  /**
   * Build statistics footer
   */
  private buildStatisticsSection(sections: CanonSection[]): string {
    const totalVotes = sections.reduce(
      (sum, t) => sum + t.votes.left + t.votes.neutral + t.votes.right,
      0
    );

    const totalLeft = sections.reduce((sum, t) => sum + t.votes.left, 0);
    const totalRight = sections.reduce((sum, t) => sum + t.votes.right, 0);
    const totalNeutral = sections.reduce((sum, t) => sum + t.votes.neutral, 0);

    const leftPct = totalVotes > 0 ? ((totalLeft / totalVotes) * 100).toFixed(1) : 0;
    const rightPct = totalVotes > 0 ? ((totalRight / totalVotes) * 100).toFixed(1) : 0;
    const neutralPct = totalVotes > 0 ? ((totalNeutral / totalVotes) * 100).toFixed(1) : 0;

    let md = `## Gesamt-Statistiken\n\n`;
    md += `- **Topics:** ${sections.length}\n`;
    md += `- **Gesamt-Votes:** ${totalVotes}\n`;
    md += `- **Ø Votes/Topic:** ${(totalVotes / sections.length).toFixed(1)}\n\n`;

    md += `### Politische Verteilung\n\n`;
    md += `\`\`\`\n`;
    md += `Links:   ${totalLeft} (${leftPct}%)\n`;
    md += `Neutral: ${totalNeutral} (${neutralPct}%)\n`;
    md += `Rechts:  ${totalRight} (${rightPct}%)\n`;
    md += `\`\`\`\n\n`;

    md += `---\n\n`;
    md += `**Hinweis:** Dieses Dokument wird automatisch aus der Datenbank generiert.  \n`;
    md += `Alle Änderungen an Topics werden nach Veröffentlichung direkt hier abgebildet.\n`;

    return md;
  }

  /**
   * Group sections by category
   */
  private groupByCategory(sections: CanonSection[]): Record<string, CanonSection[]> {
    return sections.reduce(
      (acc, section) => {
        if (!acc[section.category]) {
          acc[section.category] = [];
        }
        acc[section.category].push(section);
        return acc;
      },
      {} as Record<string, CanonSection[]>
    );
  }

  /**
   * Auto-sync: Generate, save to Supabase, backup to GDrive
   */
  async autoSync() {
    try {
      const canon = await this.generateCanonFromTopics();
      const hash = this.hashContent(canon);

      // Skip if nothing changed
      if (hash === this.lastGeneratedHash) {
        return canon;
      }

      // Save to Supabase
      await canonApi.saveCanonSnapshot(canon, hash);

      // Backup to Google Drive if linked
      if (canonApi.isGoogleDriveLinked()) {
        try {
          // Google Drive backup happens in canonApiService
          await canonApi.saveCanonSnapshot(canon, hash);
        } catch (e) {
          console.error('Google Drive backup failed:', e);
          // Continue even if GDrive fails - Supabase save succeeded
        }
      }

      this.lastGeneratedHash = hash;
      return canon;
    } catch (e) {
      console.error('Canon sync failed:', e);
      throw e;
    }
  }

  /**
   * Simple hash function
   */
  private hashContent(content: string): string {
    let hash = 0;
    for (let i = 0; i < content.length; i++) {
      const char = content.charCodeAt(i);
      hash = (hash << 5) - hash + char;
      hash = hash & hash;
    }
    return Math.abs(hash).toString(16);
  }

  /**
   * Setup auto-sync on topic changes
   */
  setupRealtimeSync() {
    // Subscribe to topic changes
    supabase
      .channel('topics-changes')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'topics' },
        () => {
          // Debounce auto-sync
          setTimeout(() => this.autoSync(), 1000);
        }
      )
      .subscribe();

    // Also subscribe to vote changes
    supabase
      .channel('votes-changes')
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'topic_votes' },
        () => {
          // Debounce auto-sync
          setTimeout(() => this.autoSync(), 500);
        }
      )
      .subscribe();
  }
}

export const canonSyncService = new CanonSyncService();
export default canonSyncService;
