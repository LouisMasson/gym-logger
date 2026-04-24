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
- [ ] **Phase 3** — 5 écrans full wired (Home stats, Session, Progression, Exos)
- [ ] **Phase 4** — Panel Training dans Grafana Blueprint Health
- [ ] **Phase 5** — OAuth Apple + ajustements PWA iOS

## Structure

```
app/
├── layout.tsx              # Fonts + metadata PWA
├── globals.css             # Design tokens (CSS vars)
├── page.tsx                # Home (auth-gated)
├── login/page.tsx          # OAuth Google
└── auth/callback/route.ts  # Handler post-OAuth

lib/supabase/
├── server.ts               # createServerClient (cookies, schema gym)
├── client.ts               # createBrowserClient
└── middleware.ts           # Session refresh + redirect guard

middleware.ts               # Next.js middleware entrypoint
components/                 # UI components
```

## Sécurité

- Toutes les tables en RLS, policies scopées `auth.uid() = user_id`
- Anon key publique par design (JWT + RLS = safe)
- Aucune clé service_role exposée côté client
- OAuth Google Client Secret stocké uniquement dans Supabase Dashboard
