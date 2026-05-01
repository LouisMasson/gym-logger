# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
bun run dev       # Dev server (Next.js 15)
bun run build     # Production build
bun run lint      # ESLint via next lint

docker compose up -d --build   # Full production build + run (Traefik-routed)
```

No test suite — validate features manually via the dev server or `/qa`.

## Architecture

**Next.js 15 App Router PWA** backed by **Supabase** (`gym` schema) with **server actions** for all mutations.

### Auth flow

Middleware (`middleware.ts` → `lib/supabase/middleware.ts`) runs on every non-asset route:
1. Validates the Supabase JWT and refreshes cookies
2. Strips any incoming `x-gl-*` headers (prevents forgery)
3. Injects `x-gl-user-id`, `x-gl-user-name`, `x-gl-user-email` into the request

Server components and actions call `requireUser()` (`lib/auth.ts`) which reads those headers — **no second Supabase round-trip**. Middleware runs on `experimental-edge` runtime for cold-start speed.

### Database (`gym` schema)

| Table | Key columns |
|---|---|
| `profiles` | `user_id`, `display_name` |
| `exercises` | `user_id`, `name`, `muscle_group`, `is_archived`, `is_favorite` |
| `workouts` | `user_id`, `name`, `started_at`, `ended_at` (NULL = in progress) |
| `sets` | `user_id`, `workout_id`, `exercise_id`, `set_number`, `reps`, `weight_kg`, `rpe`, `logged_at` |

All tables have RLS: `auth.uid() = user_id`. The `gym.last_set_per_exercise` function is `SECURITY INVOKER` (critical — ensures RLS applies on the function call).

PostgREST must expose the `gym` schema explicitly (one-time per project):
```sql
alter role authenticator set pgrst.db_schemas to 'public, graphql_public, gym';
notify pgrst, 'reload config';
```

### Server actions pattern

All mutations live in `app/*/actions.ts` (marked `'use server'`). They always:
1. Call `requireUser()` first
2. Create a server Supabase client via `createClient()` (`lib/supabase/server.ts`)
3. Call `revalidatePath()` or `revalidateTag()` after mutations — **never skip this**

The `exerciseListTag(userId)` helper in `lib/auth.ts` is the cache tag for per-user exercise lists — use `revalidateTag(exerciseListTag(user.id))` when mutating exercises.

### Session editor (`app/session/[id]/session-editor.tsx`)

The main UX-heavy component. Client component with:
- Optimistic UI for `logSet` — temp set added immediately, replaced with real `id` on server response
- Stepper pre-filled from `lastSetsByExercise` (via `gym.last_set_per_exercise` RPC), with in-session priority
- Weight snapped to nearest even integer (stepper is ±2 kg)
- `useTransition` for all server action calls to avoid blocking the UI

### Design system

- **Accent**: lime `#D4FF3D` (CSS var `--accent`)
- **Fonts**: Instrument Serif (display headings), Geist (UI), Geist Mono (timer/numbers)
- **Style**: Athletic Minimalism — dark background, minimal chrome, high contrast
- Design tokens in `app/globals.css` as CSS variables

### Deploy

The Dockerfile builds a 3-stage image (deps → builder → runner) using `oven/bun:1.3-alpine`. Build args `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY` are baked at build time (Next.js public env vars). The container connects to the `dokploy-network` Docker network so Traefik can route to it.

**Deploy workflow**: push to GitHub → Claude Code pulls and runs `docker compose up -d --build` on the VPS. Never trigger manually unless Claude Code is unavailable.

**Required env vars before `docker compose up -d --build`:**

| Variable | Example | Notes |
|---|---|---|
| `APP_DOMAIN` | `gym.patronusguardian.org` | Traefik Host rule — **missing = no routing** |
| `NEXT_PUBLIC_SUPABASE_URL` | `https://xxx.supabase.co` | Baked at build time |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | `eyJ...` | Baked at build time |

**Prod**: `https://gym.patronusguardian.org`

### Data pipeline

Supabase `gym` schema → dbt models → Grafana "Blueprint Health" dashboard, row 💪 Strength Training:
- `clean.gym_sessions` — 1 row per finished workout
- `agg.gym_weekly` — weekly volume
- `agg.gym_prs` — personal records per exercise

dbt models live in a separate `data-platform` repo; refresh is daily via cron.
