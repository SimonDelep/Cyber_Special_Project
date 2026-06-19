# NovaNest

E-commerce storefront for sleek smart home tech — app-controlled doorbell cameras and ambient LED lighting.

## Stack

- **[Astro](https://astro.build)** — hybrid SSR, pages & API routes
- **[Tailwind CSS v4](https://tailwindcss.com)** — styling via `@tailwindcss/vite`
- **[SolidJS](https://www.solidjs.com)** — interactive islands (cart UI)
- **[Nanostores](https://github.com/nanostores/nanostores)** — lightweight client state
- **SQLite ([`node:sqlite`](https://nodejs.org/api/sqlite.html)) + Drizzle schema** — local database (`data/novanest.db`), no native addons

## Project structure

```
├── data/                 # SQLite database (gitignored)
├── drizzle/              # Generated migrations (optional)
├── public/               # Static assets
├── src/
│   ├── components/
│   │   ├── layout/       # Header, Footer (.astro)
│   │   └── solid/        # SolidJS islands
│   ├── layouts/          # BaseLayout.astro
│   ├── lib/
│   │   ├── auth/         # Sessions, RBAC, passwords, avatars
│   │   ├── db/           # Schema, connection, migrate, seed
│   │   └── format.ts
│   ├── middleware.ts     # Session + route protection
│   ├── pages/
│   │   ├── api/          # REST endpoints (auth, profile, products)
│   │   ├── login.astro
│   │   ├── register.astro
│   │   ├── profile.astro
│   │   ├── admin/
│   │   └── index.astro   # Landing page
│   ├── stores/           # Nanostores (cart)
│   └── styles/           # global.css (Tailwind)
```

## Requirements

- **Node.js 22.5+** (uses the built-in `node:sqlite` module)

## Getting started

```bash
# Install dependencies
npm install

# Create tables and seed sample products
npm run db:setup

# Start dev server
npm run dev
```

Open [http://localhost:4321](http://localhost:4321).

## Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Development server |
| `npm run build` | Production build |
| `npm run preview` | Preview production build |
| `npm run db:migrate` | Create SQLite tables |
| `npm run db:seed` | Insert sample products + default admin |
| `npm run db:setup` | Migrate + seed |
| `npm run db:generate` | Generate Drizzle migrations |

## Authentication & users

- **Register** — `/register` (username, password, email, display name, optional avatar URL)
- **Log in / log out** — `/login`, logout from profile or `POST /api/auth/logout`
- **Profile** — `/profile` (view/edit email, display name, avatar URL, password; upload avatar file; delete account)
- **RBAC** — roles `user` and `admin`; `/admin` is admin-only

After `npm run db:setup`, a default admin is created if the database has no users:

| Field | Default |
|-------|---------|
| Username | `admin` |
| Password | `Admin123!` |

Override via `ADMIN_USERNAME`, `ADMIN_PASSWORD`, `ADMIN_EMAIL` in `.env`.

**Existing databases:** run `npm run db:migrate` to apply schema updates (e.g. `users`, `sessions`, `balance_cents`).

## Admin panel

At `/admin` (admin role only):

- **Users** — view all accounts, edit email/display name/role, set or adjust store credit balance, delete users
- **Products** — create, update, and delete catalog items (name, slug, price, category, image, featured flag)
- **CSV import** — bulk-create products from a CSV file; sample template at `/samples/novanest-products-import-sample.csv`
- **System log** — internal event monitor (auth, profile, checkout, admin actions) with filters; also at `/admin?tab=logs`

## API

### Catalog & reviews

- `/catalog` — searchable product catalog (text search, category, price range, featured, sort)
- `/products/:slug` — product detail, add to cart, customer reviews
- `GET /api/catalog` — filtered product list (`q`, `category`, `featured`, `minPrice`, `maxPrice`, `sort`)
- `GET /api/products/:slug/reviews` — list reviews + average rating
- `POST /api/products/:slug/reviews` — submit or update your review (auth required; JSON or multipart with optional `image` file / `imageUrl`)

### Products

- `GET /api/products` — list products
- `GET /api/products?category=doorbell-cameras` — filter by category
- `GET /api/products?featured=true` — featured only

### Auth (JSON)

- `POST /api/auth/register` — create account + session
- `POST /api/auth/login` — sign in
- `POST /api/auth/logout` — sign out
- `GET /api/auth/me` — current user

### Cart & checkout

- `/cart` — shopping cart page (adjust quantities, view balance when signed in)
- `POST /api/checkout` — simulated purchase (`{ items: [{ productId, quantity }] }`); validates balance server-side, deducts total on success, creates an order record, returns `402` with an error if funds are insufficient
- `GET /api/orders` — list your orders (authenticated)
- `GET /api/orders/:id/invoice` — download PDF invoice for an order you own

### Profile (authenticated)

- `GET /api/profile` — current user
- `PUT /api/profile` — update profile (`email`, `displayName`, `avatarUrl`, optional password change)
- `DELETE /api/profile` — delete account (`password` required)
- `POST /api/profile/avatar` — multipart upload (`avatar` file field)

### Admin (admin only)

- `GET /api/admin/users` — list all users
- `PUT /api/admin/users/:id` — update user (`email`, `displayName`, `role`)
- `DELETE /api/admin/users/:id` — delete user
- `PATCH /api/admin/users/:id/balance` — set (`balanceCents`) or adjust (`adjustCents`) account balance
- `GET /api/admin/products` — list all products
- `POST /api/admin/products` — create product
- `PUT /api/admin/products/:id` — update product
- `DELETE /api/admin/products/:id` — delete product
- `POST /api/admin/products/import` — bulk import from CSV (`multipart/form-data`, field `file`)
- `GET /api/admin/events` — system event log (`category`, `outcome`, `limit`, optional `userId`, `since`)

## Environment

Copy `.env.example` to `.env`:

```
DATABASE_URL=./data/novanest.db
ADMIN_USERNAME=admin
ADMIN_PASSWORD=Admin123!
ADMIN_EMAIL=admin@novanest.local
```
