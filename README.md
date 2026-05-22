# Trippy-Tropa

Group work, balanced and on track — a web-based platform for teachers and students to form skill-balanced groups, assign tasks, and collaborate. Fully responsive (desktop + mobile browsers).

## Stack

- **Next.js 16** (App Router, TypeScript)
- **Tailwind CSS v4** + **shadcn/ui**
- **Supabase** (Auth, Postgres, Realtime)
- **@dnd-kit** — Kanban drag-and-drop
- **Recharts** — skill charts (ready to wire)
- **qrcode.react** — classroom invite QR codes
- **react-hook-form** + **zod** — forms & validation

## Getting started

### 1. Environment

Copy the example env file and add your Supabase keys:

```bash
cp .env.example .env
```

| Variable | Required | Description |
|----------|----------|-------------|
| `NEXT_PUBLIC_SUPABASE_URL` | Yes | Supabase project URL (Settings → API) |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Yes | Supabase anon/public key (Settings → API) |
| `NEXT_PUBLIC_APP_URL` | Yes* | Public site URL for invite links and QR codes (`http://localhost:3000` in dev) |

\* Defaults to `http://localhost:3000` in code if unset, but set it explicitly before deploying.

### 2. Supabase

1. Create a project at [supabase.com](https://supabase.com).
2. Run migrations in order in the SQL editor: `001_initial_schema.sql`, then `002_classroom_invite_policies.sql`.
3. Enable Email auth under Authentication → Providers.
4. Add RLS policies for `officer` vs `student` roles (schema includes table stubs).

### 3. Run locally

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Route map

| Area | Routes |
|------|--------|
| **Landing** | `/` |
| **Auth** | `/login`, `/register` |
| **Join** | `/join` |
| **Onboarding** | `/onboarding/skills` |
| **Officer** | `/officer/dashboard`, `/officer/classrooms/new`, `/officer/classrooms/[id]`, `.../groups`, `.../groups/generate`, `.../tasks` |
| **Student** | `/student/dashboard`, `/student/classrooms/[id]/group`, `.../tasks`, `.../assignments` |

## Project structure

```
src/
├── app/                 # App Router pages
├── components/
│   ├── layout/          # App shell, headers, stats
│   ├── tasks/           # Kanban board
│   └── ui/              # shadcn components
├── lib/
│   ├── algorithms/      # Group balancing & task assignment
│   ├── constants/
│   └── supabase/        # Browser, server, middleware clients
└── types/
supabase/migrations/     # SQL schema
```

## Next implementation steps

1. Wire Supabase Auth on login/register pages
2. Persist classrooms, groups, tasks, and skill ratings
3. Connect group balancer & task assigner to officer actions
4. Supabase Realtime for notifications and group chat
5. Recharts on officer classroom detail for skill overview

## Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Development server |
| `npm run build` | Production build |
| `npm run start` | Start production server |
| `npm run lint` | ESLint |
