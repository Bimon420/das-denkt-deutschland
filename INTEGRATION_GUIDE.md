# Complete API Integration Guide

Dieser Guide zeigt, wie alle Services zusammenpassen für die **Scenario B + UI Mode** Architektur.

---

## Architecture Overview

```
User Interface
    ↓
Services Layer (business logic)
    ↓
Supabase (PostgreSQL)
    ↓
Google Drive (Backups)
```

### Service Stack

| Service | Purpose | Location |
|---------|---------|----------|
| **topicService** | CRUD für Topics | `src/services/topicService.ts` |
| **votingService** | Abstimmungen & Stats | `src/services/votingService.ts` |
| **canonSyncService** | Auto-Generierung canon.md | `src/services/canonSyncService.ts` |
| **adminService** | Admin Operations (publish, etc) | `src/services/adminService.ts` |
| **realtimeService** | WebSocket Live-Updates | `src/services/realtimeService.ts` |
| **googleDriveAdminService** | GDrive UI-Config | `src/services/googleDriveAdminService.ts` |
| **canonApi** | Canon Backup API | `src/integrations/canonApiService.ts` |
| **apiClient** | HTTP Client | `src/integrations/apiClient.ts` |

---

## Scenario B: Auto-Generation Workflow

```
┌─────────────────────────────────────┐
│ Admin bearbeitet Topic in /admin    │
└──────────────┬──────────────────────┘
               │
               ↓
        ┌──────────────────┐
        │ topicService     │
        │ .updateTopic()   │
        │ .publishTopic()  │
        └────────┬─────────┘
                 │
                 ↓
        ┌──────────────────────────┐
        │ canonSyncService         │
        │ .autoSync()  ← Triggered │
        │ - generateCanonFromTopics│
        │ - buildMarkdown          │
        └────────┬─────────────────┘
                 │
                 ├─────────────────┬────────────────┐
                 ↓                 ↓                ↓
        ┌──────────────┐  ┌──────────────┐  ┌──────────┐
        │ Supabase     │  │ Google Drive │  │ Browser  │
        │ canon_snapshots
        │              │  │ (if linked)  │  │localStorage
        └──────────────┘  └──────────────┘  └──────────┘
```

### Step 1: User publishes topic

```typescript
import { adminService } from '@/services/adminService';

const result = await adminService.publishTopic(topicId);
// result.canonUpdated === true
```

### Step 2: Canon auto-syncs

```typescript
// Inside publishTopic, this is called automatically:
await canonSyncService.autoSync();
// - Generates canon.md from all published topics
// - Saves to Supabase canon_snapshots table
// - Backs up to Google Drive if linked
```

### Step 3: Real-time subscribers notified

```typescript
// If subscribed, callbacks fire:
realtimeService.subscribeToTopicsChanges((update) => {
  // Update UI with new stats
});
```

---

## Complete Component Integration

### Admin Panel Example

```typescript
import { useState, useEffect } from 'react';
import { adminService } from '@/services/adminService';
import { canonSyncService } from '@/services/canonSyncService';
import { realtimeService } from '@/services/realtimeService';
import { googleDriveAdminService } from '@/services/googleDriveAdminService';

export function AdminPanel() {
  const [pending, setPending] = useState([]);
  const [gdrive, setGdrive] = useState(null);

  useEffect(() => {
    // Load pending topics
    adminService.getPendingTopics().then(setPending);

    // Check Google Drive status
    if (googleDriveAdminService.isLinked()) {
      const config = googleDriveAdminService.getConfig();
      setGdrive(config);
    }

    // Subscribe to real-time updates
    const unsub = realtimeService.subscribeToTopicsChanges(() => {
      // Refresh pending list
      adminService.getPendingTopics().then(setPending);
    });

    return unsub;
  }, []);

  const handlePublish = async (id: string) => {
    const result = await adminService.publishTopic(id);
    if (result.success) {
      setPending(p => p.filter(t => t.id !== id));
      // Canon was auto-updated
    }
  };

  return (
    <div>
      <h1>Admin Panel</h1>
      
      {/* Google Drive Status */}
      {gdrive && (
        <div className="alert">
          ✅ Google Drive linked to: {gdrive.folderName}
          <br/>Connected: {new Date(gdrive.connectedAt).toLocaleDateString('de-DE')}
        </div>
      )}

      {/* Pending Topics */}
      <section>
        <h2>Pending Topics ({pending.length})</h2>
        {pending.map(topic => (
          <div key={topic.id} className="topic-card">
            <h3>{topic.topic}</h3>
            <p>{topic.left_position} ↔ {topic.right_position}</p>
            <button onClick={() => handlePublish(topic.id)}>
              Publish & Sync Canon
            </button>
          </div>
        ))}
      </section>
    </div>
  );
}
```

---

## Voting Flow with Real-time Updates

```typescript
import { votingService } from '@/services/votingService';
import { realtimeService } from '@/services/realtimeService';
import { useState, useEffect } from 'react';

export function TopicVoting({ topicId }: { topicId: string }) {
  const [stats, setStats] = useState(null);

  useEffect(() => {
    // Subscribe to live vote updates
    const unsubscribe = realtimeService.subscribeToTopicVotes(
      topicId,
      async (update) => {
        // Refresh stats when new vote arrives
        const newStats = await votingService.getVoteStats(topicId);
        setStats(newStats);
      }
    );

    // Initial load
    votingService.getVoteStats(topicId).then(setStats);

    return unsubscribe;
  }, [topicId]);

  const handleVote = async (value: number) => {
    await votingService.vote(topicId, value);
    // Stats update automatically via subscription
  };

  return (
    <div>
      <h2>Voting Stats</h2>
      {stats && (
        <>
          <p>🔴 Links: {stats.left_votes}</p>
          <p>⚪ Neutral: {stats.neutral_votes}</p>
          <p>🔵 Rechts: {stats.right_votes}</p>
        </>
      )}
      <button onClick={() => handleVote(-1)}>Vote Left</button>
      <button onClick={() => handleVote(0)}>Stay Neutral</button>
      <button onClick={() => handleVote(1)}>Vote Right</button>
    </div>
  );
}
```

---

## Google Drive Setup (UI Flow)

```typescript
import { googleDriveAdminService } from '@/services/googleDriveAdminService';
import { useState } from 'react';

export function GoogleDriveSetup() {
  const [clientId, setClientId] = useState('');
  const [folderId, setFolderId] = useState('');

  const handleLinkGoogleDrive = () => {
    googleDriveAdminService.startOAuthFlow(
      clientId,
      `${window.location.origin}/auth/google/callback`
    );
  };

  const handleSaveConfig = async () => {
    try {
      // After OAuth, get access token from backend
      const token = await getAccessTokenFromBackend(); // TBD
      
      await googleDriveAdminService.saveConfig(
        clientId,
        folderId,
        'Canon Backups',
        token
      );
      
      alert('Google Drive linked successfully!');
    } catch (error) {
      alert(`Error: ${error.message}`);
    }
  };

  return (
    <div>
      <h2>Link Google Drive</h2>
      <input
        placeholder="Google Client ID"
        value={clientId}
        onChange={e => setClientId(e.target.value)}
      />
      <input
        placeholder="Google Drive Folder ID"
        value={folderId}
        onChange={e => setFolderId(e.target.value)}
      />
      <button onClick={handleLinkGoogleDrive}>
        Step 1: Authenticate with Google
      </button>
      <button onClick={handleSaveConfig}>
        Step 2: Save Configuration
      </button>
    </div>
  );
}
```

---

## Canon Auto-Sync Setup

In `src/App.tsx` or at app initialization:

```typescript
import { useEffect } from 'react';
import { canonSyncService } from '@/services/canonSyncService';

export function App() {
  useEffect(() => {
    // Setup real-time sync on topic/vote changes
    canonSyncService.setupRealtimeSync();

    // Manual trigger every 5 minutes (optional)
    const interval = setInterval(() => {
      canonSyncService.autoSync();
    }, 5 * 60 * 1000);

    return () => clearInterval(interval);
  }, []);

  return <YourApp />;
}
```

---

## Data Models

### Topics Table
```typescript
{
  id: string;
  topic: string;
  category: string;
  left_position: string;
  left_quote: string;
  left_speaker: string;
  left_sources: JSON;
  left_hidden_meaning?: string;
  left_negative_effects?: string;
  right_position: string;
  right_quote: string;
  right_speaker: string;
  right_sources: JSON;
  right_hidden_meaning?: string;
  right_negative_effects?: string;
  mitte_view: string;
  tag_type: string;
  published_at?: string; // Null = draft
  created_at: string;
}
```

### Topic Votes Table
```typescript
{
  id: string;
  topic_id: string;
  value: number; // -1 (left), 0 (neutral), 1 (right)
  created_at: string;
}
```

### Canon Snapshots Table (Supabase)
```typescript
{
  id: string;
  content: string; // Full markdown
  hash: string; // Deduplication
  version: string; // ISO timestamp
  gdrive_backup_id?: string;
  gdrive_backed_up_at?: string;
  backup_url?: string;
  created_at: string;
}
```

---

## API Endpoints (Ready to Implement)

```
Topics
  GET    /api/topics
  GET    /api/topics/:id
  POST   /api/topics
  PUT    /api/topics/:id
  DELETE /api/topics/:id

Voting
  POST   /api/votes
  GET    /api/votes/:topicId
  GET    /api/stats
  GET    /api/stats/topics/:topicId

Canon
  GET    /api/canon
  GET    /api/canon/versions
  GET    /api/canon/versions/:hash

Admin
  GET    /api/admin/pending
  POST   /api/admin/topics/:id/publish
  POST   /api/admin/topics/:id/reject

Suggestions
  GET    /api/suggestions
  POST   /api/suggestions
```

---

## Error Handling

All services throw on error. Always wrap calls:

```typescript
try {
  const topic = await topicService.getTopic(id);
} catch (e) {
  console.error('Failed to load topic:', e);
  // Handle: not found, network, etc.
}
```

---

## Next Steps

1. **Implement Supabase RPC** for `get_trending_topics()`
2. **Create API Endpoints** (Node/Express, Supabase Functions, etc.)
3. **Build Admin Components** using these services
4. **Setup Google Cloud OAuth** for Google Drive linking
5. **Deploy to Vercel** with environment variables

See `API.md` for detailed endpoint documentation.
