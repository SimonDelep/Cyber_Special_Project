import Database from 'better-sqlite3';
import { drizzle } from 'drizzle-orm/better-sqlite3';
import { mkdirSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { categories, products, reviews, sessions, users } from '../src/db/schema';
import { seedCategories, seedProducts } from '../src/db/seed-data';
import { createSeedUser, findUserByUsername } from '../src/lib/auth/user';
import { createReview } from '../src/lib/reviews';

const DB_PATH = resolve(process.cwd(), 'data', 'voltstream.db');

mkdirSync(dirname(DB_PATH), { recursive: true });

const sqlite = new Database(DB_PATH);
sqlite.exec(`
  CREATE TABLE IF NOT EXISTS categories (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    slug TEXT NOT NULL UNIQUE,
    description TEXT NOT NULL
  );

  CREATE TABLE IF NOT EXISTS products (
    id TEXT PRIMARY KEY,
    category_id TEXT NOT NULL REFERENCES categories(id),
    name TEXT NOT NULL,
    slug TEXT NOT NULL UNIQUE,
    description TEXT NOT NULL,
    price REAL NOT NULL,
    image TEXT NOT NULL,
    badge TEXT,
    featured INTEGER NOT NULL DEFAULT 0
  );

  CREATE TABLE IF NOT EXISTS users (
    id TEXT PRIMARY KEY,
    username TEXT NOT NULL UNIQUE,
    email TEXT NOT NULL UNIQUE,
    password_hash TEXT NOT NULL,
    display_name TEXT NOT NULL,
    bio TEXT NOT NULL DEFAULT '',
    profile_picture TEXT,
    role TEXT NOT NULL DEFAULT 'user',
    balance REAL NOT NULL DEFAULT 0,
    created_at INTEGER NOT NULL,
    updated_at INTEGER NOT NULL
  );

  CREATE TABLE IF NOT EXISTS sessions (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    expires_at INTEGER NOT NULL,
    created_at INTEGER NOT NULL
  );

  CREATE TABLE IF NOT EXISTS reviews (
    id TEXT PRIMARY KEY,
    product_id TEXT NOT NULL REFERENCES products(id) ON DELETE CASCADE,
    user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    rating INTEGER NOT NULL,
    title TEXT NOT NULL,
    body TEXT NOT NULL,
    image TEXT,
    created_at INTEGER NOT NULL,
    updated_at INTEGER NOT NULL,
    UNIQUE(product_id, user_id)
  );

  CREATE TABLE IF NOT EXISTS system_events (
    id TEXT PRIMARY KEY,
    category TEXT NOT NULL,
    action TEXT NOT NULL,
    severity TEXT NOT NULL,
    status TEXT NOT NULL,
    user_id TEXT,
    username TEXT,
    ip_address TEXT,
    user_agent TEXT,
    message TEXT NOT NULL,
    metadata TEXT,
    created_at INTEGER NOT NULL
  );

  CREATE INDEX IF NOT EXISTS idx_system_events_created_at ON system_events(created_at DESC);
  CREATE INDEX IF NOT EXISTS idx_system_events_category ON system_events(category);

  CREATE TABLE IF NOT EXISTS orders (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    invoice_number TEXT NOT NULL UNIQUE,
    customer_name TEXT NOT NULL,
    customer_email TEXT NOT NULL,
    line_items TEXT NOT NULL,
    total REAL NOT NULL,
    previous_balance REAL NOT NULL,
    new_balance REAL NOT NULL,
    created_at INTEGER NOT NULL
  );
  CREATE INDEX IF NOT EXISTS idx_orders_user_id ON orders(user_id);
  CREATE INDEX IF NOT EXISTS idx_orders_created_at ON orders(created_at DESC);
`);

try {
  sqlite.exec(`ALTER TABLE users ADD COLUMN balance REAL NOT NULL DEFAULT 0`);
} catch {
  // Column already exists
}

const db = drizzle(sqlite);

db.delete(reviews).run();
db.delete(sessions).run();
db.delete(users).run();
db.delete(products).run();
db.delete(categories).run();

db.insert(categories).values([...seedCategories]).run();
db.insert(products).values([...seedProducts]).run();

sqlite.close();

await createSeedUser({
  username: 'admin',
  email: 'admin@voltstream.local',
  password: 'Admin123!',
  displayName: 'VoltStream Admin',
  role: 'admin',
});

await createSeedUser({
  username: 'demo',
  email: 'demo@voltstream.local',
  password: 'Demo1234!',
  displayName: 'Demo User',
  role: 'user',
  balance: 50,
});

const demo = await findUserByUsername('demo');
if (demo) {
  await createReview({
    productId: 'prod-whisper-pure',
    userId: demo.id,
    rating: 5,
    title: 'Perfect for my bedroom',
    body: 'Runs whisper-quiet on sleep mode. I forget it is on until I notice how much fresher the air feels.',
  });

  await createReview({
    productId: 'prod-uv-hydro',
    userId: demo.id,
    rating: 4,
    title: 'UV cap is a game changer',
    body: 'Hydration reminders work well and the sterilization cycle gives real peace of mind at the office.',
  });
}

console.log(`Seeded catalog + users + reviews → ${DB_PATH}`);
console.log('  Admin: admin / Admin123!');
console.log('  Demo:  demo / Demo1234!');
