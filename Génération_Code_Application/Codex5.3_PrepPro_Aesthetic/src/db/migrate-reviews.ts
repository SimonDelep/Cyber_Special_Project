import Database from "better-sqlite3";
import { resolve } from "node:path";

const url = process.env.DATABASE_URL ?? "./data/preppro.db";
const dbPath = resolve(process.cwd(), url.replace(/^file:/, ""));
const db = new Database(dbPath);

const tables = db
  .prepare("SELECT name FROM sqlite_master WHERE type='table' AND name='reviews'")
  .all();

if (tables.length === 0) {
  db.exec(`
    CREATE TABLE reviews (
      id integer PRIMARY KEY AUTOINCREMENT NOT NULL,
      product_id integer NOT NULL REFERENCES products(id) ON DELETE cascade,
      user_id integer NOT NULL REFERENCES users(id) ON DELETE cascade,
      rating integer NOT NULL,
      comment text NOT NULL,
      image_url text,
      created_at text NOT NULL
    );
  `);
  console.log("Created reviews table.");
} else {
  console.log("Reviews table already exists.");
}

db.close();
