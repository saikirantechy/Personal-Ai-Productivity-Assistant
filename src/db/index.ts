import fs from "node:fs";
import path from "node:path";

import Database from "better-sqlite3";
import { drizzle } from "drizzle-orm/better-sqlite3";
import { migrate } from "drizzle-orm/better-sqlite3/migrator";

import * as schema from "./schema";

const DATA_DIR = path.join(process.cwd(), "data");
const DB_PATH = process.env.DATABASE_PATH ?? path.join(DATA_DIR, "assistant.db");
const MIGRATIONS_DIR = path.join(process.cwd(), "drizzle");

function createClient() {
  fs.mkdirSync(path.dirname(DB_PATH), { recursive: true });

  const sqlite = new Database(DB_PATH);
  sqlite.pragma("journal_mode = WAL");
  sqlite.pragma("foreign_keys = ON");

  const database = drizzle(sqlite, { schema });

  // Local-first app: keep the schema current without a separate migrate step.
  if (fs.existsSync(MIGRATIONS_DIR)) {
    migrate(database, { migrationsFolder: MIGRATIONS_DIR });
  }

  return database;
}

// Dev-mode hot reload re-evaluates modules, so hold the connection on globalThis
// to avoid leaking a file handle per reload.
const globalForDb = globalThis as unknown as {
  __assistantDb?: ReturnType<typeof createClient>;
};

export const db = (globalForDb.__assistantDb ??= createClient());

export { schema };
