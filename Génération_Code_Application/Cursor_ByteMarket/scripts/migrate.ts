import { mkdirSync, existsSync, readdirSync, readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import Database from "better-sqlite3";

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = join(__dirname, "..");
const dbPath = process.env.DATABASE_PATH ?? join(root, "data", "bytemarket.db");
const migrationsDir = join(root, "drizzle", "migrations");

mkdirSync(dirname(dbPath), { recursive: true });

const db = new Database(dbPath);
db.pragma("journal_mode = WAL");
db.pragma("foreign_keys = ON");

db.exec(`
  CREATE TABLE IF NOT EXISTS __drizzle_migrations (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    hash TEXT NOT NULL,
    created_at INTEGER NOT NULL
  );
`);

const applied = new Set(
  db
    .prepare("SELECT hash FROM __drizzle_migrations")
    .all()
    .map((row) => (row as { hash: string }).hash),
);

const sqlFiles = readdirSync(migrationsDir)
  .filter((f) => f.endsWith(".sql"))
  .sort();

for (const file of sqlFiles) {
  const hash = file.replace(".sql", "");
  if (applied.has(hash)) continue;

  const raw = readFileSync(join(migrationsDir, file), "utf-8");
  const statements = raw
    .split(/--> statement-breakpoint/)
    .map((s) => s.trim())
    .filter(Boolean);

  const run = db.transaction(() => {
    for (const statement of statements) {
      db.exec(statement);
    }
    db
      .prepare(
        "INSERT INTO __drizzle_migrations (hash, created_at) VALUES (?, ?)",
      )
      .run(hash, Date.now());
  });

  run();
  console.log(`Applied migration: ${file}`);
}

db.close();
console.log(`Database ready at ${dbPath}`);
