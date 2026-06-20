# FloraFoam

E-commerce storefront for plant-based, cruelty-free skincare: facial serums, exosome-infused night creams, and botanical under-eye patches.

## Stack

- **Next.js** (App Router) + **TypeScript**
- **Tailwind CSS**
- **Prisma** + **PostgreSQL**

## Project structure

```
├── prisma/
│   ├── schema.prisma    # Product model & enums
│   └── seed.ts          # Sample catalog data
├── src/
│   ├── app/             # Routes & global styles
│   ├── components/
│   │   ├── layout/      # Header, Footer
│   │   └── landing/     # Home page sections
│   ├── lib/             # Prisma client singleton
│   └── types/           # Shared types & helpers
├── docker-compose.yml   # Local PostgreSQL
└── .env.example
```

## Getting started

### 1. Install dependencies

```bash
npm install
```

### 2. Environment

```bash
cp .env.example .env
```

### 3. Start PostgreSQL (Docker)

```bash
docker compose up -d
```

PostgreSQL listens on **port 5433** on the host (5432 is often already taken by another install). Update `DATABASE_URL` if you use a different port.

### 4. Push schema & seed

```bash
npm run db:push
npm run db:seed
```

### 5. Run the dev server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Authentication & users

- **Register:** `/register` — creates a standard `USER` account (username + password).
- **Sign in / out:** `/login` and the header profile menu.
- **Profile:** `/profile` — view, edit, change password, upload avatar (file or URL), delete account.
- **RBAC:** `USER` vs `ADMIN`. Admins can access `/admin` (dashboard, user management, product catalog, balance adjustments, CSV product import).
- **User balance:** stored as `balanceCents` on each account (CAD). Admins can set or adjust balances under **Admin → Users**.
- **Cart & checkout:** `/cart` — add products from the homepage, then simulate checkout against your account balance. Insufficient funds show an error; successful checkout deducts the total and clears the cart. After purchase, download a PDF invoice from the confirmation screen or from **Profile → Purchase history**.
- **Product catalog:** `/products` — search, filter by category/price/stock, and sort. Each product has a detail page with reviews.
- **Reviews:** signed-in users can post one review per product (1–5 stars, optional title & photo via URL or file upload).
- **Seed admin:** after `npm run db:seed`, sign in as `admin` / `admin123` (change in production).

Set `AUTH_SECRET` in `.env` (see `.env.example`). Generate one with:

```bash
openssl rand -base64 32
```

## Useful commands

| Command | Description |
|---------|-------------|
| `npm run dev` | Start Next.js (Turbopack) |
| `npm run db:push` | Sync Prisma schema to the database |
| `npm run db:migrate` | Create & apply migrations (production-friendly) |
| `npm run db:seed` | Seed featured products |
| `npm run db:studio` | Open Prisma Studio |

## Database without Docker

Point `DATABASE_URL` in `.env` to any PostgreSQL instance (local install, Neon, Supabase, etc.), then run `npm run db:push` and `npm run db:seed`.
