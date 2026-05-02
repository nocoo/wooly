CREATE TABLE members (
  id         TEXT PRIMARY KEY,
  name       TEXT NOT NULL,
  relationship TEXT NOT NULL,
  avatar     TEXT,
  created_at INTEGER NOT NULL -- epoch ms
);

CREATE TABLE sources (
  id           TEXT PRIMARY KEY,
  member_id    TEXT NOT NULL REFERENCES members(id) ON DELETE CASCADE,
  name         TEXT NOT NULL,
  website      TEXT,
  icon         TEXT,
  phone        TEXT,
  category     TEXT NOT NULL,
  currency     TEXT NOT NULL,
  cycle_anchor TEXT NOT NULL, -- JSON string
  valid_from   INTEGER,      -- epoch ms, nullable
  valid_until  INTEGER,      -- epoch ms, nullable
  archived     INTEGER NOT NULL DEFAULT 0,
  memo         TEXT,
  cost         TEXT,
  card_number  TEXT,
  color_index  INTEGER,
  created_at   INTEGER NOT NULL -- epoch ms
);

CREATE TABLE benefits (
  id            TEXT PRIMARY KEY,
  source_id     TEXT NOT NULL REFERENCES sources(id) ON DELETE CASCADE,
  name          TEXT NOT NULL,
  type          TEXT NOT NULL,
  quota         INTEGER,
  credit_amount REAL,
  shared        INTEGER NOT NULL DEFAULT 0,
  cycle_anchor  TEXT,         -- JSON string, nullable
  memo          TEXT,
  created_at    INTEGER NOT NULL -- epoch ms
);

CREATE TABLE redemptions (
  id          TEXT PRIMARY KEY,
  benefit_id  TEXT NOT NULL REFERENCES benefits(id) ON DELETE CASCADE,
  member_id   TEXT NOT NULL REFERENCES members(id) ON DELETE CASCADE,
  redeemed_at INTEGER NOT NULL, -- epoch ms
  memo        TEXT
);

CREATE TABLE points_sources (
  id         TEXT PRIMARY KEY,
  member_id  TEXT NOT NULL REFERENCES members(id) ON DELETE CASCADE,
  name       TEXT NOT NULL,
  icon       TEXT,
  balance    REAL NOT NULL DEFAULT 0,
  memo       TEXT,
  created_at INTEGER NOT NULL -- epoch ms
);

CREATE TABLE redeemables (
  id               TEXT PRIMARY KEY,
  points_source_id TEXT NOT NULL REFERENCES points_sources(id) ON DELETE CASCADE,
  name             TEXT NOT NULL,
  cost             REAL NOT NULL,
  memo             TEXT,
  created_at       INTEGER NOT NULL -- epoch ms
);

CREATE TABLE settings (
  key   TEXT PRIMARY KEY,
  value TEXT NOT NULL
);
