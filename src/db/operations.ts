// Bulk read/write operations for the SQLite database.
// Maps between SQLite rows and domain entity types.

import type Database from "better-sqlite3";
import type {
  Member,
  Source,
  Benefit,
  Redemption,
  PointsSource,
  Redeemable,
  AppSettings,
  CycleAnchor,
} from "@/models/types";
import { SCHEMA_SQL } from "./schema";

// -- Dataset interface (mirrors src/data/datasets.ts) -------------------------

export interface Dataset {
  members: Member[];
  sources: Source[];
  benefits: Benefit[];
  redemptions: Redemption[];
  pointsSources: PointsSource[];
  redeemables: Redeemable[];
  defaultSettings: AppSettings;
}

// -- Row → Entity mappers -----------------------------------------------------

function rowToMember(row: Record<string, unknown>): Member {
  return {
    id: row.id as string,
    name: row.name as string,
    relationship: row.relationship as Member["relationship"],
    avatar: (row.avatar as string) ?? null,
    createdAt: row.createdAt as string,
  };
}

function rowToSource(row: Record<string, unknown>): Source {
  return {
    id: row.id as string,
    memberId: row.memberId as string,
    name: row.name as string,
    website: (row.website as string) ?? null,
    icon: (row.icon as string) ?? null,
    phone: (row.phone as string) ?? null,
    category: row.category as Source["category"],
    currency: row.currency as string,
    cycleAnchor: JSON.parse(row.cycleAnchor as string) as CycleAnchor,
    validFrom: (row.validFrom as string) ?? null,
    validUntil: (row.validUntil as string) ?? null,
    archived: row.archived === 1,
    memo: (row.memo as string) ?? null,
    cost: (row.cost as string) ?? null,
    cardNumber: (row.cardNumber as string) ?? null,
    colorIndex: (row.colorIndex as number) ?? null,
    createdAt: row.createdAt as string,
  };
}

function rowToBenefit(row: Record<string, unknown>): Benefit {
  return {
    id: row.id as string,
    sourceId: row.sourceId as string,
    name: row.name as string,
    type: row.type as Benefit["type"],
    quota: (row.quota as number) ?? null,
    creditAmount: (row.creditAmount as number) ?? null,
    shared: row.shared === 1,
    cycleAnchor: row.cycleAnchor
      ? (JSON.parse(row.cycleAnchor as string) as CycleAnchor)
      : null,
    memo: (row.memo as string) ?? null,
    createdAt: row.createdAt as string,
  };
}

function rowToRedemption(row: Record<string, unknown>): Redemption {
  return {
    id: row.id as string,
    benefitId: row.benefitId as string,
    memberId: row.memberId as string,
    redeemedAt: row.redeemedAt as string,
    memo: (row.memo as string) ?? null,
  };
}

function rowToPointsSource(row: Record<string, unknown>): PointsSource {
  return {
    id: row.id as string,
    memberId: row.memberId as string,
    name: row.name as string,
    icon: (row.icon as string) ?? null,
    balance: row.balance as number,
    memo: (row.memo as string) ?? null,
    createdAt: row.createdAt as string,
  };
}

function rowToRedeemable(row: Record<string, unknown>): Redeemable {
  return {
    id: row.id as string,
    pointsSourceId: row.pointsSourceId as string,
    name: row.name as string,
    cost: row.cost as number,
    memo: (row.memo as string) ?? null,
    createdAt: row.createdAt as string,
  };
}

// -- Read all data from DB ----------------------------------------------------

/**
 * Read the entire dataset from the database.
 * Returns a Dataset object matching the domain types.
 */
export function readAll(db: Database.Database): Dataset {
  const members = db
    .prepare("SELECT * FROM members")
    .all()
    .map((r) => rowToMember(r as Record<string, unknown>));

  const sources = db
    .prepare("SELECT * FROM sources")
    .all()
    .map((r) => rowToSource(r as Record<string, unknown>));

  const benefits = db
    .prepare("SELECT * FROM benefits")
    .all()
    .map((r) => rowToBenefit(r as Record<string, unknown>));

  const redemptions = db
    .prepare("SELECT * FROM redemptions")
    .all()
    .map((r) => rowToRedemption(r as Record<string, unknown>));

  const pointsSources = db
    .prepare("SELECT * FROM points_sources")
    .all()
    .map((r) => rowToPointsSource(r as Record<string, unknown>));

  const redeemables = db
    .prepare("SELECT * FROM redeemables")
    .all()
    .map((r) => rowToRedeemable(r as Record<string, unknown>));

  // Read settings (timezone)
  const tzRow = db
    .prepare("SELECT value FROM settings WHERE key = 'timezone'")
    .get() as { value: string } | undefined;

  const defaultSettings: AppSettings = {
    timezone: tzRow?.value ?? "Asia/Shanghai",
  };

  return {
    members,
    sources,
    benefits,
    redemptions,
    pointsSources,
    redeemables,
    defaultSettings,
  };
}

// -- Write all data to DB (full replace) --------------------------------------

/**
 * Replace all data in the database with the given dataset.
 * Runs inside a transaction for atomicity.
 */
export function writeAll(db: Database.Database, dataset: Dataset): void {
  const tx = db.transaction(() => {
    // Clear all tables
    db.exec(`
      DELETE FROM redeemables;
      DELETE FROM points_sources;
      DELETE FROM redemptions;
      DELETE FROM benefits;
      DELETE FROM sources;
      DELETE FROM members;
      DELETE FROM settings;
    `);

    // Insert members
    const insertMember = db.prepare(
      "INSERT INTO members (id, name, relationship, avatar, createdAt) VALUES (?, ?, ?, ?, ?)",
    );
    for (const m of dataset.members) {
      insertMember.run(m.id, m.name, m.relationship, m.avatar, m.createdAt);
    }

    // Insert sources
    const insertSource = db.prepare(
      "INSERT INTO sources (id, memberId, name, website, icon, phone, category, currency, cycleAnchor, validFrom, validUntil, archived, memo, cost, cardNumber, colorIndex, createdAt) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)",
    );
    for (const s of dataset.sources) {
      insertSource.run(
        s.id, s.memberId, s.name, s.website, s.icon, s.phone,
        s.category, s.currency, JSON.stringify(s.cycleAnchor),
        s.validFrom, s.validUntil, s.archived ? 1 : 0, s.memo,
        s.cost, s.cardNumber, s.colorIndex, s.createdAt,
      );
    }

    // Insert benefits
    const insertBenefit = db.prepare(
      "INSERT INTO benefits (id, sourceId, name, type, quota, creditAmount, shared, cycleAnchor, memo, createdAt) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)",
    );
    for (const b of dataset.benefits) {
      insertBenefit.run(
        b.id, b.sourceId, b.name, b.type, b.quota, b.creditAmount,
        b.shared ? 1 : 0, b.cycleAnchor ? JSON.stringify(b.cycleAnchor) : null,
        b.memo, b.createdAt,
      );
    }

    // Insert redemptions
    const insertRedemption = db.prepare(
      "INSERT INTO redemptions (id, benefitId, memberId, redeemedAt, memo) VALUES (?, ?, ?, ?, ?)",
    );
    for (const r of dataset.redemptions) {
      insertRedemption.run(r.id, r.benefitId, r.memberId, r.redeemedAt, r.memo);
    }

    // Insert points sources
    const insertPointsSource = db.prepare(
      "INSERT INTO points_sources (id, memberId, name, icon, balance, memo, createdAt) VALUES (?, ?, ?, ?, ?, ?, ?)",
    );
    for (const ps of dataset.pointsSources) {
      insertPointsSource.run(
        ps.id, ps.memberId, ps.name, ps.icon, ps.balance, ps.memo, ps.createdAt,
      );
    }

    // Insert redeemables
    const insertRedeemable = db.prepare(
      "INSERT INTO redeemables (id, pointsSourceId, name, cost, memo, createdAt) VALUES (?, ?, ?, ?, ?, ?)",
    );
    for (const rd of dataset.redeemables) {
      insertRedeemable.run(
        rd.id, rd.pointsSourceId, rd.name, rd.cost, rd.memo, rd.createdAt,
      );
    }

    // Insert settings
    const insertSetting = db.prepare(
      "INSERT INTO settings (key, value) VALUES (?, ?)",
    );
    insertSetting.run("timezone", dataset.defaultSettings.timezone);
  });

  tx();
}

// -- Reset and seed -----------------------------------------------------------

/**
 * Drop all data, recreate tables, and optionally seed with data.
 * If seedData is provided, insert it after recreating tables.
 * If not, leave the database empty (for production reset).
 */
export function resetAndSeed(
  db: Database.Database,
  seedData?: Dataset,
): void {
  const tx = db.transaction(() => {
    // Drop all tables
    db.exec(`
      DROP TABLE IF EXISTS redeemables;
      DROP TABLE IF EXISTS points_sources;
      DROP TABLE IF EXISTS redemptions;
      DROP TABLE IF EXISTS benefits;
      DROP TABLE IF EXISTS sources;
      DROP TABLE IF EXISTS members;
      DROP TABLE IF EXISTS settings;
    `);

    // Recreate schema
    db.exec(SCHEMA_SQL);

    // Seed if data provided
    if (seedData) {
      writeAll(db, seedData);
    }
  });

  tx();
}
