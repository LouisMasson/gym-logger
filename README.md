# Gym Logger PWA

Logge ta perf. Rien d'autre.

Progressive Web App pour logger les performances en salle. Next.js 15 + Supabase + Dokploy.

🌐 **Prod** : https://gym.patronusguardian.org
🎨 **Preview mockups** : https://gym-preview.patronusguardian.org
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

- [x] **Phase 1** — Design system + HTML mockups déployés
- [x] **Phase 2** — Auth Google end-to-end + shell Home
- [x] **Phase 3** — Session logging end-to-end (stepper kg/reps/RPE, optimistic UI), /exercises liste groupée par muscle_group, /progress (volume 90j + PRs top 5), bottom nav sticky
- [ ] **Phase 4** — CRUD exercices (renommer/ajouter/supprimer/favoris), édition séance passée
- [ ] **Phase 5** — Panel Training dans Grafana Blueprint Health + OAuth Apple

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
