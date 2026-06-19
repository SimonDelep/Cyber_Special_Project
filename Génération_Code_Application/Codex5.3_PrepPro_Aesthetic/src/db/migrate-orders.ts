import Database from "better-sqlite3";
import { resolve } from "node:path";

const url = process.env.DATABASE_URL ?? "./data/preppro.db";
const dbPath = resolve(process.cwd(), url.replace(/^file:/, ""));
const db = new Database(dbPath);

const tables = db
  .prepare(
    "SELECT name FROM sqlite_master WHERE type='table' AND name='orders'",
  )
  .all();

if (tables.length === 0) {
  db.exec(`
    CREATE TABLE orders (
      id integer PRIMARY KEY AUTOINCREMENT NOT NULL,
      invoice_number text NOT NULL UNIQUE,
      user_id integer NOT NULL REFERENCES users(id) ON DELETE cascade,
      total_cents integer NOT NULL,
      lines_json text NOT NULL,
      customer_display_name text NOT NULL,
      customer_email text NOT NULL,
      customer_username text NOT NULL,
      created_at text NOT NULL
    );
    CREATE INDEX idx_orders_user_id ON orders(user_id);
    CREATE INDEX idx_orders_created_at ON orders(created_at);
  `);
  console.log("Created orders table.");
} else {
  console.log("orders table already exists.");
}

db.close();
