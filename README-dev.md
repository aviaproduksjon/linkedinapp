# Developer setup (English)

> This file is for developers. Strategy/planning documents are in Norwegian
> under `docs/`, `agents/`, `decisions/`, and `PLANLEGGING-SAMLET.md`.

## Stack

| Layer | Choice | ADR |
|---|---|---|
| App framework | Next.js 14 (App Router) + TypeScript | 001 |
| DB / Auth / Storage / Vector | Supabase (Postgres + pgvector) | 002 |
| Hosting | Vercel (app) + Railway (worker) + Supabase | 003 |
| Queues | BullMQ + Redis | 022 (O1) |
| LLM | Anthropic Claude (Opus / Sonnet / Haiku) | 022 (O4) |
| Transcription | OpenAI Whisper | 023 |

## Repo layout

```
.
├── app/            # Next.js (web + API)
├── worker/         # BullMQ worker, deployed to Railway
├── shared/         # Typed schemas + constants shared by app and worker
├── supabase/       # Migrations, config, storage bucket setup
├── prompts/        # Versioned prompts (YAML) + canary evals
├── .github/        # CI
├── docs/           # Strategy / architecture (Norwegian)
├── agents/         # Agent role definitions (Norwegian)
├── decisions/      # ADRs + review logs
├── PLANLEGGING-SAMLET.md   # Consolidated plan (Norwegian)
└── README.md       # Entry point (Norwegian)
```

## Prerequisites

- Node.js ≥ 20.11
- pnpm ≥ 9.12 (`corepack enable` then `corepack use pnpm@9.12.0`)
- Supabase CLI ≥ 1.200 (`brew install supabase/tap/supabase`)
- Docker Desktop (for `supabase start`)
- Redis for the worker (local: `brew install redis && brew services start redis`)

## First-time setup

```bash
# 1. Install dependencies across the workspace
pnpm install

# 2. Copy environment templates
cp .env.example app/.env.local
cp .env.example worker/.env

# 3. Start Supabase locally
supabase start
# Copy the anon key + URL it prints into app/.env.local and worker/.env.

# 4. Apply migrations
supabase db reset      # Runs all migrations + seed triggers

# 5. (Optional) Regenerate typed DB types
pnpm db:types

# 6. Run the app
pnpm dev

# 7. In another terminal, run the worker
pnpm dev:worker
```

The app will be at http://localhost:3000. Sign in with a magic link to your
email — Supabase local uses Inbucket at http://localhost:54324 to catch emails.

## Useful scripts

| Command | What it does |
|---|---|
| `pnpm dev` | Next.js dev server |
| `pnpm dev:worker` | BullMQ worker with file-watching |
| `pnpm build` | Build all workspace packages |
| `pnpm typecheck` | Strict TS check across workspace |
| `pnpm lint` | ESLint across packages |
| `pnpm evals` | Run canary evals on prompts |
| `pnpm db:reset` | Reset Supabase local DB + reapply migrations |
| `pnpm db:types` | Regenerate `shared/src/db-types.ts` |
| `pnpm format` | Prettier format |

## Environment variables

See `.env.example` for the full list. The most important ones for local work:

- `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY` — app uses these.
- `SUPABASE_SERVICE_ROLE_KEY` — worker only. **Never ship to the browser.**
- `REDIS_URL` — worker only.
- `ANTHROPIC_API_KEY` — required from Phase 3 on.
- `OPENAI_API_KEY` — required when transcription (Phase 2) is enabled.
- `DRY_RUN=true` — disables all external side effects (useful for tests).

## Deploying

### App to Vercel
- Connect this repo to a new Vercel project.
- Set `Root Directory` = `app` (also configured in `vercel.json`).
- Set env vars from `.env.example` (without `.local` suffix).
- Custom domain: `linkedin.avialab.no` (CNAME to Vercel).

### Worker to Railway
- Create a new Railway project pointing at the repo root.
- Railway uses `railway.toml` automatically.
- Attach a Redis plugin — Railway sets `REDIS_URL` automatically.
- Set the remaining env vars from `.env.example`.

### Supabase
- Create a production Supabase project.
- `supabase link --project-ref <ref>`
- `supabase db push` to apply migrations.
- Configure auth magic link template (also in `supabase/templates/magic_link.html`).

## Writing code

- **Language:** English in code and code comments (O2 decision).
- **Imports:** `@/` for app-local, `@shared/` for the shared package.
- **Env access:** never `process.env.X` in app code. Import from `@/lib/env`.
- **DB access:** always via Supabase client helpers. Service role key never
  touches `app/` code — only `worker/`.
- **Types:** strict; no `any` without a comment explaining why.
- **Prompts:** if you change a prompt, bump the version (create `vN+1.yaml`),
  update canary cases, and commit both in the same PR.

## Testing (comes in later phases)

- Phase 1 CI: lint + typecheck + eval structure validation.
- Phase 2+: pgTAP tests for RLS, unit tests for worker jobs, integration tests
  for generator/tuner/filter pipeline with recorded LLM responses.

## Troubleshooting

- **Supabase magic link isn't arriving:** check Inbucket at
  http://localhost:54324 (local) or the Supabase dashboard logs (prod).
- **Worker can't connect to Redis:** make sure `REDIS_URL` is set and Redis is
  running (`redis-cli ping`).
- **Types out of sync after migration:** run `pnpm db:types`.
