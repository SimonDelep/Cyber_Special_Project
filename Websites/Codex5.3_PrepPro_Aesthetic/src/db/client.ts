import Database from "better-sqlite3";
import { drizzle } from "drizzle-orm/better-sqlite3";
import { mkdirSync, existsSync } from "node:fs";
import { dirname, resolve } from "node:path";
import * as schema from "./schema";

const DEFAULT_DB_PATH = "./data/preppro.db";

function resolveDbPath(): string {
  const url = process.env.DATABASE_URL ?? DEFAULT_DB_PATH;
  return resolve(process.cwd(), url.replace(/^file:/, ""));
}

let _db: ReturnType<typeof drizzle<typeof schema>> | null = null;

export function getDb() {
  if (_db) return _db;

  const dbPath = resolveDbPath();
  const dir = dirname(dbPath);

  if (!existsSync(dir)) {
    mkdirSync(dir, { recursive: true });
  }

  const sqlite = new Database(dbPath);
  sqlite.pragma("journal_mode = WAL");
  sqlite.pragma("foreign_keys = ON");

  _db = drizzle(sqlite, { schema });
  return _db;
}
