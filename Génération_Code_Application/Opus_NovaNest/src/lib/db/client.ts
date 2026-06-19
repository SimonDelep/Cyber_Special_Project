import { DatabaseSync } from 'node:sqlite';
import { mkdirSync, existsSync } from 'node:fs';
import { dirname, resolve } from 'node:path';

const DEFAULT_DB_PATH = './data/novanest.db';

export function resolveDbPath(): string {
  const url =
    process.env.DATABASE_URL ??
    import.meta.env?.DATABASE_URL ??
    DEFAULT_DB_PATH;
  return resolve(process.cwd(), url.replace(/^file:/, ''));
}

let _sqlite: DatabaseSync | null = null;

/** Shared SQLite connection (Node built-in — no native addon rebuilds). */
export function getSqlite(): DatabaseSync {
  if (_sqlite) return _sqlite;

  const dbPath = resolveDbPath();
  const dir = dirname(dbPath);
  if (!existsSync(dir)) {
    mkdirSync(dir, { recursive: true });
  }

  _sqlite = new DatabaseSync(dbPath);
  _sqlite.exec('PRAGMA journal_mode = WAL');
  _sqlite.exec('PRAGMA foreign_keys = ON');

  return _sqlite;
}
