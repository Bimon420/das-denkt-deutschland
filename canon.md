# Canon: Das Denkt Deutschland

**Version:** 2026-06-04 (Auto-Generated)  
**Last Updated:** 2026-06-04  
**Status:** Production Ready  
**Archive:** Automatically backed up to Google Drive  

---

## 🎯 Mission

Das Denkt Deutschland ist eine deutsche Civic-Tech-Plattform für partizipative Demokratie, Bürgervoting und Transparenz. Die App ermöglicht es Bürgern, politische Positionen zu sehen, abzustimmen und das politische Spektrum zu verstehen.

---

## 🏗️ System Architecture: Scenario B (Auto-Canon)

```
Admin publishes Topic
    ↓
topicService.publishTopic() [Scenario B: Auto-Generation starts here]
    ↓
Supabase: topic.published_at = NOW()
    ↓
canonSyncService.setupRealtimeSync() detects change
    ↓
canonSyncService.autoSync():
├─ Generates canon.md from ALL published topics
├─ Groups by category
├─ Includes vote statistics for each topic
├─ Saves to Supabase canon_snapshots table
├─ Backs up to Google Drive (if linked)
└─ Notifies real-time subscribers
```

**Key Point:** Canon is generated from data, never manually edited. It's always fresh, always in sync.

---

## 📦 Service Layer (6 Core Services)

### 1. topicService (`src/services/topicService.ts`)
**Purpose:** CRUD for Topics

```typescript
// Create topic (unpublished draft)
await topicService.createTopic({
  topic: "Klimawandel",
  category: "Umwelt",
  left_position: "Sofortige Dekarbonisierung",
  right_position: "Graduelle Anpassung",
  mitte_view: "Balanced approach",
  left_speaker: "Grüne",
  right_speaker: "FDP",
  left_sources: [...],
  right_sources: [...]
});

// Publish topic (triggers canon auto-sync)
await topicService.publishTopic(id); // Sets published_at timestamp

// Get topics with vote stats
const topic = await topicService.getTopicWithStats(id);
```

**Database:** `topics` table

---

### 2. votingService (`src/services/votingService.ts`)
**Purpose:** Voting system + statistics

```typescript
// Cast vote: -1 (left), 0 (neutral), 1 (right)
await votingService.vote(topicId, -1); // Vote left

// Get stats for single topic
const stats = await votingService.getVoteStats(topicId);
// Returns: { total_votes, average_score, left_votes, right_votes, neutral_votes }

// Get global stats across all topics
const global = await votingService.getGlobalStats();
```

**Database:** `topic_votes` table

---

### 3. canonSyncService (`src/services/canonSyncService.ts`) ⭐ **KEY SERVICE**
**Purpose:** Auto-generate canon.md from database (Scenario B)

```typescript
// Auto-generates canon.md with:
// - All published topics grouped by category
// - Vote statistics for each topic
// - Political distribution breakdown
// - Source attribution
// - Generated timestamp

const canon = await canonSyncService.generateCanonFromTopics();

// Triggered automatically when topics are published
// Saves to Supabase + Google Drive
await canonSyncService.autoSync();

// Setup real-time sync on topic/vote changes
canonSyncService.setupRealtimeSync();
```

**Database:** Reads from `topics` + `topic_votes`, Writes to `canon_snapshots`

**Output Example:**
```markdown
# Das Denkt Deutschland - Argumentations-Kanon

## Umwelt
### Klimawandel
**Links (45%):** Sofortige Dekarbonisierung
**Mitte (30%):** Balanced approach
**Rechts (25%):** Graduelle Anpassung

Bürgerstimmen: 1,230 votes
Quellen: [links], [rechts]
```

---

### 4. adminService (`src/services/adminService.ts`)
**Purpose:** Admin operations (publish, reject, moderation)

```typescript
// Get pending (unpublished) topics
const pending = await adminService.getPendingTopics();

// Publish topic (calls topicService + triggers canon sync)
const result = await adminService.publishTopic(id);
// result.canonUpdated === true if sync succeeded

// Reject/delete draft topic
await adminService.rejectTopic(id, "Reason for rejection");

// Bulk publish multiple topics
await adminService.bulkPublish([id1, id2, id3]);

// Log generation event
await adminService.logGeneration(success, topicsCount, errorMessage);

// Export all topics as JSON
const backup = await adminService.exportTopics();
```

**Database:** Modifies `topics`, reads from `generation_logs`

---

### 5. realtimeService (`src/services/realtimeService.ts`)
**Purpose:** WebSocket subscriptions for live updates

```typescript
// Subscribe to votes on specific topic
const unsubscribe = realtimeService.subscribeToTopicVotes(
  topicId,
  (update) => {
    // Called when new vote arrives
    console.log('New vote:', update.value);
    // Refresh UI
  }
);

// Subscribe to all topics changes (admin panel)
const unsub = realtimeService.subscribeToTopicsChanges(() => {
  // Called when any topic is created/updated
});

// Cleanup
unsubscribe();
```

**Technology:** Supabase Realtime (WebSocket)

---

### 6. googleDriveAdminService (`src/services/googleDriveAdminService.ts`)
**Purpose:** UI-based Google Drive configuration

```typescript
// Start OAuth flow
googleDriveAdminService.startOAuthFlow(
  clientId,
  "http://localhost:5173/auth/google/callback"
);

// After OAuth, save config
await googleDriveAdminService.saveConfig(
  clientId,
  folderId,
  "Canon Backups",
  accessToken
);

// Check if linked
if (googleDriveAdminService.isLinked()) {
  const backups = await googleDriveAdminService.listBackups();
}

// Disconnect
googleDriveAdminService.disconnect();
```

**Storage:** localStorage + Google Drive

---

## 🔌 Integration Layer

### apiClient (`src/integrations/apiClient.ts`)
- Unified HTTP client for all API calls
- Methods for topics, voting, canon, admin, suggestions
- Error handling + JSON serialization

### canonApiService (`src/integrations/canonApiService.ts`)
- High-level REST API for canon management
- Supabase snapshot persistence
- Google Drive backup coordination

### supabase/client.ts
- Supabase client initialization
- Uses env vars: VITE_SUPABASE_URL, VITE_SUPABASE_PROJECT_ID, VITE_SUPABASE_PUBLISHABLE_KEY

---

## 📊 Database Schema

### topics
```
id: BIGINT PRIMARY KEY
topic: TEXT (title)
category: TEXT (Umwelt, Wirtschaft, etc.)
left_position: TEXT
left_quote: TEXT
left_speaker: TEXT (e.g., "Grüne")
left_sources: JSON (array)
right_position: TEXT
right_quote: TEXT
right_speaker: TEXT (e.g., "FDP")
right_sources: JSON (array)
mitte_view: TEXT (middle position)
tag_type: TEXT (category/priority)
left_hidden_meaning?: TEXT
left_negative_effects?: TEXT
right_hidden_meaning?: TEXT
right_negative_effects?: TEXT
published_at?: TIMESTAMP (NULL = draft)
created_at: TIMESTAMP
```

### topic_votes
```
id: BIGINT PRIMARY KEY
topic_id: BIGINT FK (topics.id)
value: INT (-1, 0, 1)
created_at: TIMESTAMP
```

### canon_snapshots
```
id: BIGINT PRIMARY KEY
version: TEXT (ISO timestamp)
content: TEXT (full markdown)
hash: TEXT UNIQUE (for deduplication)
created_at: TIMESTAMP
gdrive_backup_id?: TEXT
gdrive_backed_up_at?: TIMESTAMP
backup_url?: TEXT
```

### generation_logs
```
id: BIGINT PRIMARY KEY
success: BOOLEAN
topics_count: INT
error_message?: TEXT
details?: JSON
created_at: TIMESTAMP
```

---

## 📄 Core Pages & Routes

| Route | Component | Purpose | Auth |
|-------|-----------|---------|------|
| `/` | Index | Landing page | No |
| `/app` | AppView | Main voting interface | No |
| `/admin` | AdminPanel | Topic management | Admin |
| `/archiv` | ArchivePage | Topic archive | No |
| `/thema/:id` | TopicDetailPage | Single topic view | No |
| `/buergervoting` | BuergervotingPage | Voting interface | No |
| `/statistik` | StatistikPage | Stats dashboard | No |
| `/transparenz` | TransparenzPage | Transparency board | No |
| `/parteien` | ParteienPage | Party information | No |
| `/impressum` | ImpressumPage | Legal | No |
| `/datenschutz` | DatenschutzPage | Privacy | No |
| `/auth/google/callback` | AuthGoogleCallback | OAuth callback | N/A |
| `/auth/error` | AuthError | OAuth error page | N/A |

---

## 🎛️ Admin Panel (AdminPanel Component)

**Purpose:** Complete topic management + Google Drive setup

**4 Tabs:**

### Tab 1: Pending Topics
- Shows unpublished drafts
- Preview all 3 positions (left, middle, right)
- **Publish** button: publishes + triggers canon sync
- **Reject** button: deletes draft

### Tab 2: Published Topics
- List of all live topics
- Shows category + publish date
- Read-only (admin can't unpublish)

### Tab 3: Google Drive
- Shows connection status
- If linked: folder name, connection date
- If not linked: button to "Link Google Drive"
- Disconnect button

### Tab 4: Canon
- Preview of auto-generated canon.md
- "Force Sync" button for manual trigger
- Shows it auto-syncs on publish

---

## 🔐 Google Drive Integration

### OAuth Flow (UI Mode)

```
1. Admin clicks "Link Google Drive" in AdminPanel
   
2. Prompted for Google Client ID (from Google Cloud Console)
   
3. Calls googleDriveAdminService.startOAuthFlow()
   └─> Redirects to https://accounts.google.com/o/oauth2/v2/auth
   
4. User grants "Google Drive File API" permission
   └─> Google redirects to /auth/google/callback?code=...
   
5. AuthGoogleCallback page:
   ├─> Calls /api/auth/google/callback (Vercel) 
   │   or /functions/v1/auth-google-callback (Supabase)
   ├─> Backend exchanges code for access_token
   ├─> Returns token to frontend
   └─> Frontend saves to localStorage
   
6. Prompts for Google Drive Folder ID
   └─> Saves config to localStorage
   
7. ✅ Linked! Canon now backs up automatically
```

### Backend Endpoints

**Supabase Edge Function:**
- `GET /functions/v1/auth-google-callback?code=...&state=...`
- Location: `supabase/functions/auth-google-callback/index.ts`

**Vercel Function:**
- `GET /api/auth/google/callback?code=...&state=...`
- Location: `api/auth/google/callback.ts`

Both:
1. Validate state parameter
2. Exchange code for token via Google OAuth API
3. Return `{ access_token, expires_in, token_type }`
4. Frontend saves token in localStorage

### Auto-Backup Process

When `canonSyncService.autoSync()` runs:
```
1. Generate canon.md from topics + votes
2. Compute hash of content
3. Check if hash changed (skip if duplicate)
4. Save to Supabase canon_snapshots table
5. If Google Drive linked:
   ├─> Get access_token from localStorage
   ├─> Upload file to GDrive folder as:
   │   canon-2026-06-04-a1b2c3d4.md
   ├─> Store gdrive_backup_id + backup_url
   └─> Save to Supabase
6. Notify real-time subscribers
```

---

## 🚀 API Endpoints (Ready to Implement)

### Topics
```
GET    /api/topics           → Get all published topics
GET    /api/topics/:id       → Get single topic
POST   /api/topics           → Create topic (draft)
PUT    /api/topics/:id       → Update topic
DELETE /api/topics/:id       → Delete topic
```

### Voting
```
POST   /api/votes            → Cast vote
GET    /api/votes/:topicId   → Get votes for topic
GET    /api/stats            → Global statistics
GET    /api/stats/topics/:id → Stats for single topic
```

### Canon
```
GET    /api/canon            → Get current canon.md
GET    /api/canon/versions   → List all snapshots
GET    /api/canon/versions/:hash → Get specific version
```

### Admin
```
GET    /api/admin/pending    → Get unpublished topics
POST   /api/admin/topics/:id/publish → Publish topic
POST   /api/admin/topics/:id/reject  → Reject topic
```

---

## 🛠️ Development Stack

| Layer | Technology | Purpose |
|-------|-----------|---------|
| Frontend | Vite + React 18 + TypeScript | App shell |
| UI | shadcn/ui + Radix + Tailwind | Components |
| State | TanStack React Query | Data fetching/caching |
| Forms | React Hook Form + Zod | Input handling |
| Routing | React Router v6 | Navigation |
| Backend | Supabase (PostgreSQL) | Database |
| Real-time | Supabase Realtime | WebSocket subscriptions |
| Auth | Google OAuth 2.0 | Google Drive access |
| Deploy | Vercel + Supabase | Hosting |
| Testing | Vitest + Playwright | QA |

---

## 📋 Setup Steps (Completed)

✅ **Step 1:** Create `canon_snapshots` table in Supabase  
✅ **Step 2:** Create OAuth callback endpoint (Supabase Functions + Vercel Functions)  
⏳ **Step 3:** Integrate AdminPanel + test full flow  
⏳ **Step 4:** Set up Google Cloud OAuth credentials  
⏳ **Step 5:** Deploy to production  

---

## 📚 Documentation Files

- **canon.md** (this file) — Architecture & system design
- **API.md** — Detailed API reference with examples
- **INTEGRATION_GUIDE.md** — How all services work together
- **SETUP_GOOGLE_DRIVE.md** — Google Drive setup instructions
- **STEP2_OAUTH_SETUP.md** — OAuth callback setup guide
- **BUILD_SUMMARY.md** — What was built and why
- **README.md** — Quick start guide

---

## 🔄 Workflow Examples

### Publishing a Topic (Step-by-Step)

```
1. Admin goes to /admin
2. Finds unpublished topic in "Pending" tab
3. Clicks "Publish"
   └─> adminService.publishTopic(id)
   └─> topicService.publishTopic(id) [sets published_at]
   └─> Supabase detects change via postgres_changes
   └─> canonSyncService.autoSync() triggered
4. autoSync():
   ├─> Generates canon.md with ALL published topics
   ├─> Saves to canon_snapshots table
   ├─> If Google Drive linked, backs up to folder
   └─> Notifies subscribers
5. ✅ Success! Topic live, canon updated
```

### Voting with Real-time Updates

```
1. User on topic page: /thema/123
2. Subscribes to live votes:
   └─> realtimeService.subscribeToTopicVotes(topicId, callback)
3. User clicks "Vote Left"
   └─> votingService.vote(topicId, -1)
   └─> Inserted into topic_votes table
4. Supabase realtime detects INSERT
5. All subscribed clients get notified
6. UI refreshes vote stats automatically
```

### Getting Stats

```
// Single topic stats with votes
const { topic, stats } = await topicService.getTopicWithStats(id);
// stats: { total_votes, average_vote, votes_by_value }

// Global stats across all topics
const global = await votingService.getGlobalStats();
// { total_votes, total_topics, avg_votes_per_topic, left_votes, right_votes, neutral_votes }

// Canon stats (auto-generated)
const canon = await canonSyncService.generateCanonFromTopics();
// Includes all vote distributions per topic
```

---

## 🔐 Security & Privacy

- **RLS Enabled:** All Supabase tables use Row Level Security
- **OAuth:** Google Drive uses OAuth 2.0 (no password storage)
- **Token Storage:** Access tokens stored in localStorage (temporary, expires ~1hr)
- **CORS:** Restricted to verified origins
- **Secrets:** Google Client Secret never exposed to frontend

---

## 🚀 Deployment

### Development
```bash
npm run dev
# Frontend: http://localhost:5173
# Supabase Functions: http://localhost:54321/functions/v1/
```

### Production (Vercel)
```bash
vercel deploy --prod
# Sets env vars from Vercel dashboard
# API functions at /api/...
```

### Production (Supabase Functions)
```bash
supabase functions deploy auth-google-callback
# Sets secrets via CLI
# API at https://YOUR_PROJECT.supabase.co/functions/v1/
```

---

## 📝 Changelog

### 2026-06-04 (Complete System)
- ✅ Created 6 core services (topics, voting, canon-sync, admin, realtime, gdrive)
- ✅ Built AdminPanel component with 4 tabs
- ✅ Implemented Scenario B: auto-generate canon from database
- ✅ Created OAuth callback endpoints (Supabase + Vercel)
- ✅ Created canon_snapshots table for version control
- ✅ Set up Google Drive backup integration (UI-based linking)
- ✅ Wrote complete documentation (5 guides)
- ⚠️ „Removed lovable-tagger dependency" — **war falsch, siehe 2026-07-28**

### 2026-07-28 (Lovable raus — diesmal wirklich)
Beim Aufräumen fiel auf, dass der Haken vom 06-04 nie eingelöst war: `lovable-tagger` stand
weiter in `package.json` und wurde in `vite.config.ts` importiert. Jetzt entfernt:
- `lovable-tagger` aus `package.json` + `vite.config.ts` (lief nur im Entwicklungsmodus —
  der Produktions-Build ist danach **bit-identisch**, geprüft am Bundle-Hash `index-CPqH9q3N.js`)
- `playwright.config.ts` + `playwright-fixture.ts` gelöscht: importierten
  `lovable-agent-playwright-config`, das **gar nicht installiert war**, und es gab keinen einzigen
  Test. Reines Lovable-Gerüst.
- `@playwright/test` mit entfernt — der einzige Abnehmer war die gelöschte Lovable-Konfiguration.
- `bun.lock` + `bun.lockb` gelöscht: Vercel baut nachweislich mit **npm** (Build-Log: „changed 30
  packages", `npm run build`). Zwei tote Lockfiles daneben sind eine Falle, keine Reserve.

**Lehre für Haken in dieser Datei:** „Removed X" gehört erst gesetzt, wenn `grep -rn X` im Repo
leer ist. Der alte Haken hat sieben Wochen lang die Suche verhindert.

### 2026-06-04 (Initial Setup)
- ✅ Created canon.md as project single source of truth
- ✅ Created API documentation skeleton
- ✅ Planned architecture (Scenario B + UI Google Drive)

---

## 🎯 Next Steps

1. **Test OAuth flow:** Set up Google Cloud credentials, test /auth/google/callback
2. **Integrate AdminPanel:** Add to /admin route, test publish → canon sync
3. **Verify Google Drive:** Test backup to folder
4. **Deploy:** Push to Vercel/Supabase
5. **Monitor:** Check generation_logs for any errors

---

## 📞 Questions?

See documentation files:
- **How do services work together?** → INTEGRATION_GUIDE.md
- **How to set up Google Drive?** → SETUP_GOOGLE_DRIVE.md  
- **What's the API?** → API.md
- **What was built?** → BUILD_SUMMARY.md

This canon.md is auto-generated from the database when topics are published.  
See: `canonSyncService.generateCanonFromTopics()`

---

## 2026-07-25 — Modell-Migration auf Opus 5 (Simon-Auftrag)

Alle Anthropic-Aufrufe dieses Projekts laufen jetzt auf **`claude-opus-5`**.
⚠️ Opus 5 hat **Thinking standardmäßig AN**, und es zählt gegen `max_tokens` — kurze
Prod-Aufrufe setzen deshalb `thinking: {type: "disabled"}`, Tool-Use-Aufrufe behalten
adaptives Thinking mit erhöhtem `max_tokens`. `temperature`/`top_p`/`top_k` sind bei
Opus 5 **verboten** (400) und wurden entfernt.

**Vollständige Begründung, Fallenliste und Kostenhinweis:
[`../MODELL_MIGRATION_2026-07-25.md`](../MODELL_MIGRATION_2026-07-25.md)** (Commit afd06d0f).
