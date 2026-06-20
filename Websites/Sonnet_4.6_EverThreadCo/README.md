# EverThread Co

E-commerce storefront for timeless wardrobe basics made from **100% certified organic Egyptian cotton** and **recycled fibers**.

## Stack

- **Next.js** (App Router) + **TypeScript**
- **Tailwind CSS** v4
- **Prisma** + **PostgreSQL** (local via Docker)

## Project structure

```
src/
  app/              # Routes, layout, global styles
  app/api/          # API routes (placeholder)
  components/
    layout/         # Header, Footer
    landing/        # Landing page sections
    ui/             # Reusable UI primitives
  lib/              # Prisma client, helpers
  types/            # Shared TypeScript types
  generated/prisma/ # Prisma client (generated — do not edit)
prisma/
  schema.prisma     # Data model
  migrations/       # SQL migrations
  seed.ts           # Sample categories & products
```

## Getting started

### 1. Install dependencies

```bash
npm install
```

### 2. Environment

Copy the example connection string into `.env` (or create `.env` manually):

```
DATABASE_URL="postgresql://everthread:everthread@localhost:5432/everthread?schema=public"
```

### 3. Start PostgreSQL

```bash
npm run db:up
```

### 4. Run migrations & seed

```bash
npm run db:migrate
npm run db:seed
```

### 5. Run the dev server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Useful commands

| Command | Description |
|---------|-------------|
| `npm run dev` | Next.js development server |
| `npm run db:up` | Start Postgres in Docker |
| `npm run db:down` | Stop Postgres container |
| `npm run db:migrate` | Apply Prisma migrations |
| `npm run db:seed` | Load sample products |
| `npm run db:studio` | Open Prisma Studio |

## Database model (initial)

- **User** — username, email, password hash, role (`USER` | `ADMIN`), profile fields, avatar
- **Category** — product groupings (e.g. Essentials)
- **Product** — name, slug, price, featured flag, stock

## Authentication & profiles

- **Register:** [/register](http://localhost:3000/register) — username + password (email, optional display name)
- **Login / logout:** [/login](http://localhost:3000/login) — JWT sessions via NextAuth (30-day cookie)
- **Profile:** [/profile](http://localhost:3000/profile) — view/edit email, display name, bio, avatar (URL or file upload), change password, delete account
## Admin panel

Sign in as `admin` / `Admin123!`, then open [/admin](http://localhost:3000/admin):

| Section | URL | Capabilities |
|---------|-----|--------------|
| Dashboard | `/admin` | Overview stats |
| Users | `/admin/users` | Edit email, display name, bio, role; set or adjust account balance |
| Products | `/admin/products` | Create, edit, delete products |

**Seeded admin account** (after `npm run db:seed`):

| Username | Password   | Role  |
|----------|------------|-------|
| `admin`  | `Admin123!` | ADMIN |

Set `NEXTAUTH_SECRET` and `NEXTAUTH_URL` in `.env` for production.

## Shopping cart & checkout (simulated)

- Sign in, add products from the homepage shop section, then open **Cart** in the header.
- Checkout charges your **account balance** (`balanceCents` on your user profile).
- If balance is too low, an error shows the shortfall; otherwise the total is deducted and the cart is cleared.
- Admins can top up balances via **Admin → Users**.

## Product catalog & reviews

- **Catalog:** [/catalog](http://localhost:3000/catalog) — search, filter by category/price/stock/featured, sort options.
- **Product pages:** `/catalog/[slug]` — details, add to cart, customer reviews.
- **Reviews:** signed-in users can post one review per product with optional photo (URL or file upload, max 2 MB).

## Open API connections

Each product links to public open data (no API keys):

- **[Wikipedia REST API](https://en.wikipedia.org/api/rest_v1/)** — material & sustainability summaries (e.g. organic cotton, textile recycling).
- **[Open Library API](https://openlibrary.org/developers/api)** — related books on sustainable fashion.

Shown on product detail pages and a catalog insight banner. Responses are cached for 24 hours.
