# LunaLuxe

E-commerce website for premium sleep essentials — silk sleep masks, thermoregulating bamboo bed sheets, and lavender-infused weighted blankets.

## Stack

- **Astro** — static site generation with server-side data fetching
- **Tailwind CSS v4** — utility-first styling via the Vite plugin
- **SolidJS** — interactive UI islands (cart, add-to-cart)
- **Nanostores** — lightweight client-side state management
- **SQLite + Drizzle ORM** — local database for products and users
- **bcryptjs** — password hashing
- **@astrojs/node** — server-side rendering for auth and API routes

## Project structure

```
├── data/                  # SQLite database (gitignored)
├── drizzle/               # Database migrations
├── public/                # Static assets
├── scripts/               # DB migrate & seed scripts
└── src/
    ├── components/        # Astro components
    │   └── solid/         # SolidJS interactive islands
    ├── db/                # Database client & schema
    ├── layouts/           # Page layouts
    ├── lib/
    │   └── auth/          # Password, session, RBAC, avatars
    ├── pages/
    │   ├── api/auth/      # Login, register, logout
    │   ├── api/profile/   # Profile update & delete
    │   ├── admin/         # Admin dashboard (RBAC)
    │   ├── login.astro
    │   ├── register.astro
    │   └── profile.astro
    ├── stores/            # Nanostores state
    └── styles/            # Global CSS & Tailwind theme
```

## Getting started

```bash
# Install dependencies
npm install

# Set up the local database (migrate + seed)
npm run db:setup

# Start the dev server
npm run dev
```

Open [http://localhost:4321](http://localhost:4321) to view the landing page.

## Authentication

| Route | Description |
|-------|-------------|
| `/register` | Create account (username + password) |
| `/login` | Sign in and start a session |
| `/profile` | View and edit profile (authenticated) |
| `/api/insights/weather` | JSON proxy — tonight's sleep weather (Open-Meteo) |
| `/catalog` | Product catalog with search and filters |
| `/products/[slug]` | Product detail and reviews |
| `/cart` | Shopping cart page |
| `/checkout` | Checkout simulation (login required, balance deducted) |
| `/admin` | Admin panel: users, balances, products (admin only) |
| `/admin/logs` | System event logs and monitoring (admin only) |

Sessions are stored in SQLite with an HTTP-only cookie (`lunaluxe_session`, 7-day expiry).

**Default admin account** (created by seed):

- Username: `admin`
- Password: `Admin123!`

Profile pictures can be set via image URL or file upload (JPEG, PNG, WebP, GIF, max 2 MB). Uploads are stored in `public/uploads/avatars/`.

### RBAC roles

| Role | Permissions |
|------|-------------|
| `user` | Access own profile, cart, shop |
| `admin` | All user permissions + `/admin` panel (edit users, adjust balances, manage products) |

### Admin panel

- **Users** — edit display name, email, bio, role; set or adjust account balance (CAD); delete accounts
- **Products** — create, update, and delete catalog items (featured flag, pricing, categories)
- **System logs** — audit trail for logins, profile changes, checkouts, and admin actions

## Database commands

| Command | Description |
|---------|-------------|
| `npm run db:migrate` | Run pending migrations |
| `npm run db:seed` | Seed sample products |
| `npm run db:setup` | Migrate + seed in one step |
| `npm run db:generate` | Generate new migrations from schema changes |

## Build

```bash
npm run build
npm run preview
```
