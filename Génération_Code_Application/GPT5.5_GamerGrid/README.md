# VoltStream

E-commerce site for ultra-quiet air purifiers, desktop humidifiers, and smart UV water bottles.

## Stack

- [Astro](https://astro.build) (SSR with Node adapter)
- [Tailwind CSS](https://tailwindcss.com) v4
- [SolidJS](https://www.solidjs.com) islands
- [Nanostores](https://github.com/nanostores/nanostores) (admin UI) · custom cart module with `localStorage`
- SQLite via [better-sqlite3](https://github.com/WiseLibs/better-sqlite3) + [Drizzle ORM](https://orm.drizzle.team)

## Project structure

```
├── data/                 # SQLite database (gitignored)
├── drizzle/              # Generated migrations
├── public/               # Static assets
├── scripts/db-seed.ts    # Seed local database
└── src/
    ├── components/       # Astro + Solid components
    ├── db/               # Schema, connection, seed data
    ├── layouts/
    ├── lib/              # Data access helpers
    ├── pages/            # Routes & API
    ├── stores/           # Nanostores
    └── styles/
```

## Getting started

```bash
npm install
npm run db:seed
npm run dev
```

Open [http://localhost:4321](http://localhost:4321).

## Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Start dev server |
| `npm run build` | Production build |
| `npm run db:seed` | Create & seed `data/voltstream.db` |
| `npm run db:generate` | Generate Drizzle migrations |
| `npm run db:migrate` | Apply migrations |

## Authentication & users

| Page | Description |
|------|-------------|
| `/register` | Create account (username/password) |
| `/login` | Sign in, session cookie (7 days) |
| `/profile` | View/edit profile, avatar URL or file upload, change password, delete account |
| `/catalog` | Full catalog with search, filters, and product links |
| `/products/[slug]` | Product detail + authenticated reviews (image URL or upload) |
| `/cart` | Shopping cart and simulated balance checkout |
| `/admin` | Admin panel: edit users, adjust balances, manage products (RBAC) |

**Seed accounts** (after `npm run db:seed`):

| Username | Password | Role |
|----------|----------|------|
| `admin` | `Admin123!` | administrator |
| `demo` | `Demo1234!` | standard user |

## API

- `GET /api/products` — full product catalog
- `POST /api/checkout` — simulate purchase (deducts balance if sufficient funds)
- `GET /api/catalog` — products with optional query filters
- `GET/POST /api/products/:id/reviews` — list or submit reviews (POST requires auth)
- `POST/DELETE /api/reviews/:id` — upload review image or delete own review
- `POST /api/auth/register` · `POST /api/auth/login` · `POST /api/auth/logout` · `GET /api/auth/me`
- `GET/PATCH/DELETE /api/profile` — profile CRUD (authenticated)
- `POST /api/profile/avatar` — multipart image upload
- `GET /api/admin/users` · `PATCH/DELETE /api/admin/users/:id` — manage users & balances (admin)
- `GET/POST /api/admin/products` · `PATCH/DELETE /api/admin/products/:id` — product catalog (admin)
- `GET /api/admin/categories` — categories for product forms (admin)
