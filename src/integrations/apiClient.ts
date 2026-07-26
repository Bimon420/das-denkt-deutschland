/**
 * Unified API Client
 * Handles all HTTP requests to backend
 */

export class ApiClient {
  private baseUrl: string;

  constructor(baseUrl: string = '') {
    this.baseUrl = baseUrl;
  }

  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> {
    const url = `${this.baseUrl}${endpoint}`;
    const response = await fetch(url, {
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
      ...options,
    });

    if (!response.ok) {
      throw new Error(`API Error: ${response.status} ${response.statusText}`);
    }

    return response.json();
  }

  // Topics API
  async getTopics() {
    return this.request('/api/topics');
  }

  async getTopic(id: string) {
    return this.request(`/api/topics/${id}`);
  }

  async createTopic(data: any) {
    return this.request('/api/topics', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async updateTopic(id: string, data: any) {
    return this.request(`/api/topics/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  async deleteTopic(id: string) {
    return this.request(`/api/topics/${id}`, {
      method: 'DELETE',
    });
  }

  // Voting API
  async vote(topicId: string, value: number) {
    return this.request('/api/votes', {
      method: 'POST',
      body: JSON.stringify({ topic_id: topicId, value }),
    });
  }

  async getVotes(topicId: string) {
    return this.request(`/api/votes/${topicId}`);
  }

  // Stats API
  async getStats() {
    return this.request('/api/stats');
  }

  async getTopicStats(topicId: string) {
    return this.request(`/api/stats/topics/${topicId}`);
  }

  // Canon API
  async getCanon() {
    return this.request('/api/canon');
  }

  async getCanonVersions() {
    return this.request('/api/canon/versions');
  }

  async getCanonSnapshot(hash: string) {
    return this.request(`/api/canon/versions/${hash}`);
  }

  // Admin API
  async getPendingTopics() {
    return this.request('/api/admin/pending');
  }

  async publishTopic(id: string) {
    return this.request(`/api/admin/topics/${id}/publish`, {
      method: 'POST',
    });
  }

  async rejectTopic(id: string, reason: string) {
    return this.request(`/api/admin/topics/${id}/reject`, {
      method: 'POST',
      body: JSON.stringify({ reason }),
    });
  }

  // Suggestions API
  async getSuggestions() {
    return this.request('/api/suggestions');
  }

  async suggestTopic(title: string, url?: string) {
    return this.request('/api/suggestions', {
      method: 'POST',
      body: JSON.stringify({ title, url }),
    });
  }
}

export const apiClient = new ApiClient();
