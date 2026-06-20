import Database from "better-sqlite3";
import { resolve } from "node:path";

const url = process.env.DATABASE_URL ?? "./data/preppro.db";
const dbPath = resolve(process.cwd(), url.replace(/^file:/, ""));
const db = new Database(dbPath);

const columns = db.prepare("PRAGMA table_info(users)").all() as { name: string }[];
const hasBalance = columns.some((c) => c.name === "balance_cents");

if (!hasBalance) {
  db.exec("ALTER TABLE users ADD COLUMN balance_cents integer NOT NULL DEFAULT 0");
  console.log("Added balance_cents column to users.");
} else {
  console.log("balance_cents already exists.");
}

db.close();
