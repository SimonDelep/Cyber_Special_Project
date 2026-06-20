# RoastRitual

E-commerce site for specialty, ethically sourced whole-bean coffees and loose-leaf herbal tea subscription boxes.

## Stack

- **Next.js** (App Router) + **TypeScript**
- **Tailwind CSS**
- **Prisma** + **PostgreSQL** (local via Docker)

## Project structure

```
src/
├── app/              # Routes & API
├── components/
│   ├── landing/      # Landing page sections
│   ├── layout/       # Header, Footer
│   └── ui/           # Shared UI primitives
├── config/           # Site configuration
├── generated/prisma/ # Prisma client (generated)
├── lib/              # Database client, utilities
└── types/            # Shared TypeScript types
prisma/
├── schema.prisma     # Data models
├── migrations/       # SQL migrations
└── seed.ts           # Sample data
```

## Getting started

### 1. Install dependencies

```bash
npm install
```

### 2. Environment

Copy the example env file and adjust if needed:

```bash
cp .env.example .env
```

### 3. Start PostgreSQL

Requires [Docker](https://www.docker.com/). Postgres runs on host port **5434** (avoids conflicts with an existing local Postgres on 5432/5433):

```bash
npm run db:up
```

### 4. Run migrations & seed

```bash
npm run db:migrate
npm run db:seed
```

### 5. Start the dev server

```bash
npm run dev
```

Open [http://localhost:3005](http://localhost:3005) (default port **3005** — change with `next dev -p <port>` if needed).

## Useful commands

| Command | Description |
|---------|-------------|
| `npm run dev` | Start Next.js dev server |
| `npm run build` | Production build |
| `npm run db:up` | Start Postgres container |
| `npm run db:down` | Stop Postgres container |
| `npm run db:migrate` | Apply Prisma migrations |
| `npm run db:seed` | Seed sample products & boxes |
| `npm run db:studio` | Open Prisma Studio |

## Health check

`GET /api/health` returns database connectivity status.

## Authentication & user management

- **Register:** `/register` — username/password (min 8 chars)
- **Login / Logout:** `/login` — JWT session (30 days), logout from header
- **Profile:** `/profile` — view/edit/delete account, avatar via URL or file upload
- **RBAC:** `USER` (default) and `ADMIN` roles; `/admin` is admin-only

### Admin panel (`/admin`)

Sign in as `admin` / `admin123`, then:

| Section | URL | Capabilities |
|---------|-----|----------------|
| Overview | `/admin` | Stats and quick links |
| Users | `/admin/users` | Edit profiles, roles, delete users, adjust balances |
| Products | `/admin/products` | Create, update, and delete catalog products |

Set `AUTH_SECRET` in `.env` (see `.env.example`). Generate one with:

```bash
node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"
```

### Seed accounts

| Username | Password  | Role  |
|----------|-----------|-------|
| `admin`  | `admin123` | ADMIN |
| `demo`   | `demo1234` | USER  |
