import Database from 'better-sqlite3';
import { drizzle } from 'drizzle-orm/better-sqlite3';
import { mkdirSync, existsSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { eq } from 'drizzle-orm';
import { hashPassword } from '@/lib/auth/password';
import { products, users } from './schema';

const dbPath = resolve(
  process.cwd(),
  (process.env.DATABASE_URL ?? './data/solace-ground.db').replace(/^file:/, ''),
);

const dir = dirname(dbPath);
if (!existsSync(dir)) mkdirSync(dir, { recursive: true });

const sqlite = new Database(dbPath);
const db = drizzle(sqlite);

sqlite.exec(`
  CREATE TABLE IF NOT EXISTS products (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    slug TEXT NOT NULL UNIQUE,
    name TEXT NOT NULL,
    description TEXT NOT NULL,
    category TEXT NOT NULL,
    price_cents INTEGER NOT NULL,
    image_url TEXT,
    in_stock INTEGER NOT NULL DEFAULT 1,
    created_at TEXT NOT NULL
  );

  CREATE TABLE IF NOT EXISTS cart_items (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    session_id TEXT NOT NULL,
    product_id INTEGER NOT NULL REFERENCES products(id),
    quantity INTEGER NOT NULL DEFAULT 1
  );

  CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    username TEXT NOT NULL UNIQUE,
    email TEXT NOT NULL UNIQUE,
    password_hash TEXT NOT NULL,
    role TEXT NOT NULL DEFAULT 'user',
    display_name TEXT,
    bio TEXT,
    avatar_url TEXT,
    balance_cents INTEGER NOT NULL DEFAULT 0,
    created_at TEXT NOT NULL,
    updated_at TEXT NOT NULL
  );

  CREATE TABLE IF NOT EXISTS sessions (
    id TEXT PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    expires_at INTEGER NOT NULL
  );
`);

const seedProducts = [
  {
    slug: 'grounding-cork-mat',
    name: 'Grounding Cork Mat',
    description:
      'Extra-dense natural cork surface with a natural rubber base. Built for hot yoga and daily flow.',
    category: 'yoga-mat',
    priceCents: 18900,
    imageUrl:
      'https://images.unsplash.com/photo-1592432678012-e910a804b4ca?w=800&q=80',
    inStock: true,
  },
  {
    slug: 'stillness-meditation-cushion',
    name: 'Stillness Meditation Cushion',
    description:
      'Firm, sustainably harvested cork fill wrapped in organic cotton. Holds posture without collapsing.',
    category: 'cushion',
    priceCents: 8900,
    imageUrl:
      'https://images.unsplash.com/photo-1506126613645-ec7abb7e64d2?w=800&q=80',
    inStock: true,
  },
  {
    slug: 'solace-travel-mat',
    name: 'Solace Travel Mat',
    description:
      'Lightweight cork top layer that folds flat. Same grip, half the weight for studio-to-trail days.',
    category: 'yoga-mat',
    priceCents: 14900,
    imageUrl:
      'https://images.unsplash.com/photo-1544367567-0f2fcb009e0b?w=800&q=80',
    inStock: true,
  },
  {
    slug: 'grove-zafu-cushion',
    name: 'Grove Zafu Cushion',
    description:
      'Round cork-core zafu with a removable organic linen cover. Elevates the hips for longer sits without soft collapse.',
    category: 'cushion',
    priceCents: 7900,
    imageUrl:
      'https://images.unsplash.com/photo-1545205597-3b040aca1ae8?w=800&q=80',
    inStock: true,
  },
  {
    slug: 'summit-pro-cork-mat',
    name: 'Summit Pro Cork Mat',
    description:
      '78-inch studio mat with 6 mm cork and a perforated rubber base for maximum grip during power flows.',
    category: 'yoga-mat',
    priceCents: 21900,
    imageUrl:
      'https://images.unsplash.com/photo-1518611012118-696072aa579a?w=800&q=80',
    inStock: true,
  },
  {
    slug: 'restorative-bolster',
    name: 'Restorative Cork Bolster',
    description:
      'Firm cork and cotton bolster for yin and restorative poses. Naturally antimicrobial and holds its shape year after year.',
    category: 'cushion',
    priceCents: 11900,
    imageUrl:
      'https://images.unsplash.com/photo-1599901860904-17e6ed708acd?w=800&q=80',
    inStock: true,
  },
] as const;

console.log('Seeding Solace Ground database…');

for (const product of seedProducts) {
  db.insert(products)
    .values({
      ...product,
      createdAt: new Date().toISOString(),
    })
    .onConflictDoNothing({ target: products.slug })
    .run();

  db.update(products)
    .set({
      name: product.name,
      description: product.description,
      category: product.category,
      priceCents: product.priceCents,
      imageUrl: product.imageUrl,
      inStock: product.inStock,
    })
    .where(eq(products.slug, product.slug))
    .run();
}

const now = new Date().toISOString();
const adminPasswordHash = await hashPassword('Admin123!');

db.insert(users)
  .values({
    username: 'admin',
    email: 'admin@solaceground.local',
    passwordHash: adminPasswordHash,
    role: 'admin',
    displayName: 'Administrator',
    createdAt: now,
    updatedAt: now,
  })
  .onConflictDoNothing({ target: users.username })
  .run();

console.log(`Done. Database at ${dbPath}`);
console.log('Default admin: username "admin" / password "Admin123!"');
sqlite.close();
