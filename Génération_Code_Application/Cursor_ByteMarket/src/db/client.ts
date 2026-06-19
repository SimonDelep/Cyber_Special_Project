import Database from "better-sqlite3";
import { drizzle } from "drizzle-orm/better-sqlite3";
import * as schema from "./schema";

const defaultPath = "./data/bytemarket.db";

function resolveDbPath(): string {
  return process.env.DATABASE_PATH ?? defaultPath;
}

let sqlite: Database.Database | null = null;
let db: ReturnType<typeof drizzle<typeof schema>> | null = null;

export function getDb() {
  if (!db) {
    sqlite = new Database(resolveDbPath());
    sqlite.pragma("journal_mode = WAL");
    sqlite.pragma("foreign_keys = ON");
    db = drizzle(sqlite, { schema });
  }
  return db;
}

export function closeDb() {
  sqlite?.close();
  sqlite = null;
  db = null;
}
