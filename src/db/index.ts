// Database initialization and connection management.
// Returns a better-sqlite3 Database instance for the given mode.
// Server-side only — never import this from client components.

import Database from "better-sqlite3";
import path from "path";
import { SCHEMA_SQL } from "./schema";

export type DbMode = "test" | "production";

const DB_DIR = path.resolve(process.cwd(), "data");

const dbCache = new Map<DbMode, Database.Database>();

/**
 * Returns a SQLite database instance for the given mode.
 * Creates the database file and schema if they don't exist.
 * Connections are cached per mode for the lifetime of the process.
 */
export function getDb(mode: DbMode): Database.Database {
  const cached = dbCache.get(mode);
  if (cached) return cached;

  const filename = mode === "test" ? "test.db" : "production.db";
  const dbPath = path.join(DB_DIR, filename);

  const db = new Database(dbPath);

  // Enable WAL mode for better concurrent read performance
  db.pragma("journal_mode = WAL");
  db.pragma("foreign_keys = ON");

  // Create tables if they don't exist
  db.exec(SCHEMA_SQL);

  dbCache.set(mode, db);
  return db;
}

/**
 * Close all cached database connections.
 * Useful for graceful shutdown.
 */
export function closeAll(): void {
  for (const db of dbCache.values()) {
    db.close();
  }
  dbCache.clear();
}
