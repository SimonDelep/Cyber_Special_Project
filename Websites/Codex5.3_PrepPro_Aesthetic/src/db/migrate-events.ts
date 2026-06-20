import Database from "better-sqlite3";
import { resolve } from "node:path";

const url = process.env.DATABASE_URL ?? "./data/preppro.db";
const dbPath = resolve(process.cwd(), url.replace(/^file:/, ""));
const db = new Database(dbPath);

const tables = db
  .prepare(
    "SELECT name FROM sqlite_master WHERE type='table' AND name='system_events'",
  )
  .all();

if (tables.length === 0) {
  db.exec(`
    CREATE TABLE system_events (
      id integer PRIMARY KEY AUTOINCREMENT NOT NULL,
      event_type text NOT NULL,
      status text NOT NULL,
      user_id integer REFERENCES users(id) ON DELETE set null,
      actor_label text,
      ip_address text,
      user_agent text,
      message text NOT NULL,
      metadata text,
      created_at text NOT NULL
    );
    CREATE INDEX idx_system_events_created_at ON system_events(created_at);
    CREATE INDEX idx_system_events_event_type ON system_events(event_type);
    CREATE INDEX idx_system_events_user_id ON system_events(user_id);
  `);
  console.log("Created system_events table.");
} else {
  console.log("system_events table already exists.");
}

db.close();
