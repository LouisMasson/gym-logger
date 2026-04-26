# Gym Logger PWA

Logge ta perf. Rien d'autre.

Progressive Web App pour logger les performances en salle, avec pipeline data jusqu'à Grafana. Next.js 15 + Supabase + Dokploy + dbt.

🌐 **Prod** : https://gym.patronusguardian.org
🎨 **Preview mockups** : https://gym-preview.patronusguardian.org
📊 **Dashboard Grafana** : Blueprint Health → row 💪 Strength Training
📐 **Design system** : Athletic Minimalism — Instrument Serif + Geist + accent lime `#D4FF3D`

## Stack

- **Framework** : Next.js 15 App Router + React 19 + TypeScript
- **Auth + DB** : Supabase (project `homelab-data-platform`, schema `gym`)
- **OAuth** : Google (Apple à suivre)
- **Style** : Tailwind + CSS variables design tokens
- **Fonts** : Instrument Serif (display), Geist (UI), Geist Mono (timer)
- **Deploy** : Dokploy + Traefik + Let's Encrypt SSL
- **Runtime** : Bun 1.3 (Alpine)

## Schéma DB (Supabase `gym`)

| Table | Rôle |
|---|---|
| `profiles` | Extension auth.users (display_name) |
| `exercises` | Catalogue par user (29 seed auto au signup) |
| `workouts` | Séances (groupe des séries) |
| `sets` | 1 ligne = 1 série (reps × weight_kg × rpe) |

RLS activé : chaque user ne voit que ses propres données via `auth.uid() = user_id`.

## Pipeline data → Grafana

```
gym schema (Supabase OLTP)
    │
    ├─► clean.gym_sessions   (1 row par workout terminé, volume_kg, duration, RPE)
    ├─► agg.gym_weekly       (1 row par lundi, sessions_count, volume_kg_total)
    └─► agg.gym_prs          (1 row par exo, charge max + reps + date)
                │
                └─► Grafana Blueprint Health (d/blueprint-health-main)
                        └─► row 💪 Strength Training
                                ├─ Stats: volume sem., séances, séries, RPE moyen
                                ├─ Bar chart accent lime: volume hebdomadaire
                                ├─ Timeseries: sessions + durée totale
                                └─ Table: top 10 records personnels
```

Refresh quotidien via le cron dbt existant (`agg.gym_*` materialized as tables).
Models dans le repo [`data-platform/dbt/models/clean/gym_sessions.sql`, `models/agg/gym_weekly.sql`, `models/agg/gym_prs.sql`].

## Dev local

```bash
bun install
cp .env.local.example .env.local  # renseigner les clés
bun run dev
```

## Deploy

```bash
docker compose up -d --build
```

Compose + Traefik labels gèrent Host matching, SSL, port forwarding automatiquement. Le domaine `gym.patronusguardian.org` pointe vers le VPS via wildcard DNS Cloudflare.

## Roadmap

- [x] **Phase 1** — Design system + HTML mockups déployés (gym-preview.patronusguardian.org)
- [x] **Phase 2** — Auth Google end-to-end + shell Home + fix `x-forwarded-host` derrière Traefik
- [x] **Phase 3** — Session logging end-to-end (stepper kg/reps/RPE, optimistic UI), /exercises liste groupée par muscle_group, /progress (volume 90j + PRs top 5), bottom nav sticky 4 onglets
- [x] **Phase 4** — CRUD exercices (rename inline, favoris, archive, muscle_group pills), `/workout/[id]` view détail séance terminée, suppression séance partout (Home, Progress, détail, in-progress), loading.tsx sur toutes les routes
- [x] **Perf round 1+2** — auth dedup via header injection, drop lucide-react, cache exos per-user (revalidateTag), edge runtime middleware, Docker HEALTHCHECK warmup. -29% TTFB Home, -36% mémoire (130MB → 83MB). [Issue #1 closed](https://github.com/LouisMasson/gym-logger/issues/1).
- [x] **Phase Data** — Pipeline gym → dbt → Grafana Blueprint Health. Row 💪 Strength Training avec volume hebdo, séances, top PRs. [Issue #6 closed](https://github.com/LouisMasson/gym-logger/issues/6).
- [x] **Phase 5 — Friction zéro** : quick-add série + dupliquer séance + édition séance passée + rest timer auto. [Milestone closed](https://github.com/LouisMasson/gym-logger/milestone/1).
- [x] **Phase 7 (partiel) — Icône PWA & splash iOS** : icône lime serif italique "G" avec barre accent, favicon multi-size, 5 splash screens iOS (iPhone 6→14 Pro Max). [Issue #8 closed](https://github.com/LouisMasson/gym-logger/issues/8).
- [ ] **Phase 6 — Motivation visuelle** (différée) : courbes volume + heatmap + détection PR. À reprendre quand 4-6 semaines de data accumulées.
- [ ] **OAuth Apple** (différé) : nécessite Apple Developer Account.

## Structure

```
app/
├── layout.tsx              # Fonts + metadata PWA + BottomNav
├── globals.css             # Design tokens (CSS vars)
├── page.tsx                # Home (volume semaine, dernières séances, CTA)
├── login/page.tsx          # OAuth Google
├── auth/callback/route.ts  # Handler post-OAuth (origin from x-forwarded-host)
├── exercises/page.tsx      # Liste des exos groupée par muscle_group
├── progress/page.tsx       # Volume 90j + PRs (charge max par exo) + séances
└── session/
    ├── actions.ts          # Server actions: startWorkout, logSet, deleteSet, endWorkout
    ├── new/page.tsx        # Form démarrage séance → redirect /session/[id]
    └── [id]/
        ├── page.tsx        # Loader server: workout + exercises + sets
        └── session-editor.tsx  # Client: stepper kg/reps/RPE + optimistic UI

lib/supabase/
├── server.ts               # createServerClient (cookies, schema gym)
├── client.ts               # createBrowserClient
└── middleware.ts           # Session refresh + redirect guard

middleware.ts               # Next.js middleware entrypoint
components/
├── bottom-nav.tsx          # 4 tabs: Home / Session / Progression / Exos
└── sign-out-button.tsx
```

## Important : exposer le schéma `gym` via PostgREST

Par défaut Supabase n'expose que `public`. Une fois par projet :

```sql
alter role authenticator set pgrst.db_schemas to 'public, graphql_public, gym';
notify pgrst, 'reload config';
```

## Sécurité

- Toutes les tables en RLS, policies scopées `auth.uid() = user_id`
- Anon key publique par design (JWT + RLS = safe)
- Aucune clé service_role exposée côté client
- OAuth Google Client Secret stocké uniquement dans Supabase Dashboard
