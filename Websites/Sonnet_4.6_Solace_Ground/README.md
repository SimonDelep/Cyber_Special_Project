# Solace Ground

Premium e-commerce for heavy-duty yoga mats and meditation cushions crafted from sustainably harvested natural cork.

## Stack

- [Astro](https://astro.build) — pages & SSR
- [Tailwind CSS v4](https://tailwindcss.com) — styling
- [SolidJS](https://www.solidjs.com) — interactive islands
- [Nanostores](https://github.com/nanostores/nanostores) — client state (cart)
- [Drizzle ORM](https://orm.drizzle.team) + SQLite (`better-sqlite3`) — local database
- Session auth + RBAC (`user` / `admin`) — bcrypt password hashing, HTTP-only cookies

## Project structure

```
├── data/                 # SQLite database (gitignored)
├── public/uploads/       # User-uploaded avatar files
└── src/
    ├── components/       # Astro & Solid components
    ├── db/               # Schema, connection, seed
    ├── lib/auth/         # Sessions, passwords, RBAC, avatars
    ├── middleware.ts     # Loads user session on every request
    ├── pages/
    │   ├── api/          # Auth & profile REST endpoints
    │   ├── admin/        # Admin-only user list (RBAC)
    │   ├── login.astro
    │   ├── register.astro
    │   └── profile.astro
    ├── stores/           # Nanostores (cart)
    └── styles/
```

## Authentication

| Route | Description |
|-------|-------------|
| `/register` | Create account (role: `user`) |
| `/login` | Sign in with username + password |
| `/profile` | View / edit / delete your profile |
| `/admin` | User list (admins only) |

**Profile picture:** set an image URL on the profile form, or upload JPEG/PNG/WebP/GIF (max 2 MB).

**Default admin** (created by `db:seed`):

- Username: `admin`
- Password: `Admin123!`

Sessions last 30 days via the `sg_session` HTTP-only cookie.

## Getting started

```bash
npm install
npm run db:seed
npm run dev
```

Open [http://localhost:4321](http://localhost:4321).

## Database scripts

| Command | Description |
|---------|-------------|
| `npm run db:seed` | Create tables and seed sample products |
| `npm run db:push` | Push schema to SQLite (Drizzle Kit) |
| `npm run db:studio` | Open Drizzle Studio |

Copy `.env.example` to `.env` to customize `DATABASE_URL` (default: `./data/solace-ground.db`).
