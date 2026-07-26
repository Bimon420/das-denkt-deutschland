# Das Denkt Deutschland 🇩🇪

A civic-tech platform for citizen voting, factchecking, and democratic transparency.

## Quick Start

```bash
npm install
npm run dev
```

Opens on `http://localhost:5173`

## Project Structure

- **`canon.md`** — Architecture & decision log (single source of truth)
- **`API.md`** — Canon API documentation & backup system
- **`src/pages/`** — Route components
- **`src/components/`** — React components
- **`src/integrations/`** — External services (Supabase, Canon API)
- **`src/lib/`** — Utilities (Canon backup manager)
- **`src/hooks/`** — Custom hooks (useCanonBackup)

## Key Features

### Canon System
Versioned architecture documentation with automatic Google Drive backup.

```typescript
import { useCanonBackup } from '@/hooks/useCanonBackup';

const { saveVersion, versions } = useCanonBackup();
await saveVersion(canonContent);
```

See **`canon.md`** and **`API.md`** for full documentation.

### Database
Supabase PostgreSQL with RLS enabled.

**Environment:**
```
VITE_SUPABASE_URL=...
VITE_SUPABASE_PROJECT_ID=...
VITE_SUPABASE_PUBLISHABLE_KEY=...
```

### UI Components
shadcn/ui + Radix + Tailwind CSS

## Scripts

| Command | Purpose |
|---------|---------|
| `npm run dev` | Start dev server |
| `npm run build` | Production build |
| `npm run lint` | ESLint check |
| `npm run test` | Run tests (Vitest) |

## Routes

| Path | Page |
|------|------|
| `/` | Landing |
| `/app` | Main app |
| `/admin` | Admin dashboard |
| `/thema/:id` | Topic detail |
| `/buergervoting` | Voting interface |
| `/statistik` | Statistics |
| `/transparenz` | Transparency |

## Development

### Setup Canon Backup (Google Drive)

1. Get your Google Cloud credentials
2. Set environment variables or use UI to authenticate
3. Backups auto-save to specified Google Drive folder

See `API.md` → "Google Drive Integration" for setup.

### Run Tests

```bash
npm run test        # Single run
npm run test:watch  # Watch mode
```

### Deploy

```bash
npm run build       # Build for production
vercel deploy       # Deploy to Vercel (if linked)
```

## Architecture

See **`canon.md`** for complete architecture, routes, data models, and roadmap.

## Contributing

1. Edit canon.md for arch decisions
2. Test changes locally: `npm run dev`
3. Run lints: `npm run lint`
4. Commit to feature branch
5. Create PR to main

---

**Status:** Active development  
**Last Updated:** 2026-06-04  
**Maintainer:** Das Denkt Deutschland Team
