import Database from 'better-sqlite3';
import { existsSync, mkdirSync } from 'node:fs';
import { dirname, resolve } from 'node:path';

const dbPath = resolve(
  process.cwd(),
  (process.env.DATABASE_URL ?? './data/solace-ground.db').replace(/^file:/, ''),
);

const dir = dirname(dbPath);
if (!existsSync(dir)) mkdirSync(dir, { recursive: true });

const sqlite = new Database(dbPath);

function hasColumn(table: string, column: string): boolean {
  const cols = sqlite.prepare(`PRAGMA table_info(${table})`).all() as {
    name: string;
  }[];
  return cols.some((c) => c.name === column);
}

if (!hasColumn('users', 'balance_cents')) {
  sqlite.exec(
    'ALTER TABLE users ADD COLUMN balance_cents INTEGER NOT NULL DEFAULT 0',
  );
  console.log('Added users.balance_cents column.');
}

const tables = sqlite
  .prepare("SELECT name FROM sqlite_master WHERE type='table' AND name='reviews'")
  .get();

if (!tables) {
  sqlite.exec(`
    CREATE TABLE reviews (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      product_id INTEGER NOT NULL REFERENCES products(id) ON DELETE CASCADE,
      user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      rating INTEGER NOT NULL,
      title TEXT,
      body TEXT NOT NULL,
      image_url TEXT,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL
    );
    CREATE UNIQUE INDEX reviews_product_user_unique ON reviews(product_id, user_id);
  `);
  console.log('Created reviews table.');
}

const logsTable = sqlite
  .prepare("SELECT name FROM sqlite_master WHERE type='table' AND name='system_logs'")
  .get();

if (!logsTable) {
  sqlite.exec(`
    CREATE TABLE system_logs (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      created_at TEXT NOT NULL,
      action TEXT NOT NULL,
      category TEXT NOT NULL,
      severity TEXT NOT NULL DEFAULT 'info',
      status TEXT NOT NULL,
      message TEXT NOT NULL,
      user_id INTEGER,
      username TEXT,
      ip_address TEXT,
      user_agent TEXT,
      metadata TEXT
    );
    CREATE INDEX system_logs_created_at_idx ON system_logs(created_at);
    CREATE INDEX system_logs_category_idx ON system_logs(category);
    CREATE INDEX system_logs_action_idx ON system_logs(action);
  `);
  console.log('Created system_logs table.');
}

const ordersTable = sqlite
  .prepare("SELECT name FROM sqlite_master WHERE type='table' AND name='orders'")
  .get();

if (!ordersTable) {
  sqlite.exec(`
    CREATE TABLE orders (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      invoice_number TEXT NOT NULL UNIQUE,
      total_cents INTEGER NOT NULL,
      created_at TEXT NOT NULL
    );
    CREATE INDEX orders_user_id_idx ON orders(user_id);
    CREATE INDEX orders_created_at_idx ON orders(created_at);

    CREATE TABLE order_items (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      order_id INTEGER NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
      product_id INTEGER REFERENCES products(id) ON DELETE SET NULL,
      product_name TEXT NOT NULL,
      quantity INTEGER NOT NULL,
      unit_price_cents INTEGER NOT NULL,
      line_total_cents INTEGER NOT NULL
    );
    CREATE INDEX order_items_order_id_idx ON order_items(order_id);
  `);
  console.log('Created orders and order_items tables.');
}

sqlite.close();
console.log('Migrations complete.');
