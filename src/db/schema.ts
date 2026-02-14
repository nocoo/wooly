// SQLite schema definitions for Wooly.
// All tables map 1:1 to domain entities in src/models/types.ts.
// JSON-serialized fields: cycleAnchor (Source, Benefit).

export const SCHEMA_SQL = `
CREATE TABLE IF NOT EXISTS members (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  relationship TEXT NOT NULL,
  avatar TEXT,
  createdAt TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS sources (
  id TEXT PRIMARY KEY,
  memberId TEXT NOT NULL,
  name TEXT NOT NULL,
  website TEXT,
  icon TEXT,
  phone TEXT,
  category TEXT NOT NULL,
  currency TEXT NOT NULL,
  cycleAnchor TEXT NOT NULL,
  validFrom TEXT,
  validUntil TEXT,
  archived INTEGER NOT NULL DEFAULT 0,
  memo TEXT,
  cost TEXT,
  cardNumber TEXT,
  colorIndex INTEGER,
  createdAt TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS benefits (
  id TEXT PRIMARY KEY,
  sourceId TEXT NOT NULL,
  name TEXT NOT NULL,
  type TEXT NOT NULL,
  quota INTEGER,
  creditAmount REAL,
  shared INTEGER NOT NULL DEFAULT 0,
  cycleAnchor TEXT,
  memo TEXT,
  createdAt TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS redemptions (
  id TEXT PRIMARY KEY,
  benefitId TEXT NOT NULL,
  memberId TEXT NOT NULL,
  redeemedAt TEXT NOT NULL,
  memo TEXT
);

CREATE TABLE IF NOT EXISTS points_sources (
  id TEXT PRIMARY KEY,
  memberId TEXT NOT NULL,
  name TEXT NOT NULL,
  icon TEXT,
  balance REAL NOT NULL DEFAULT 0,
  memo TEXT,
  createdAt TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS redeemables (
  id TEXT PRIMARY KEY,
  pointsSourceId TEXT NOT NULL,
  name TEXT NOT NULL,
  cost REAL NOT NULL,
  memo TEXT,
  createdAt TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS settings (
  key TEXT PRIMARY KEY,
  value TEXT NOT NULL
);
`;
