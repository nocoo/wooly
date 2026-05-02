// ---------------------------------------------------------------------------
// D1 data operations — read/write the full dataset via D1 binding.
//
// All operations go through env.DB (D1Database).
// Local dev uses wrangler dev --local which maps D1 to local SQLite.
// ---------------------------------------------------------------------------

import type {
  Dataset,
  AppSettings,
  MemberRow,
  SourceRow,
  BenefitRow,
  RedemptionRow,
  PointsSourceRow,
  RedeemableRow,
} from '../types.js';
import {
  rowToMember,
  rowToSource,
  rowToBenefit,
  rowToRedemption,
  rowToPointsSource,
  rowToRedeemable,
  memberToRow,
  sourceToRow,
  benefitToRow,
  redemptionToRow,
  pointsSourceToRow,
  redeemableToRow,
} from '../mapper.js';

// -- Read all -----------------------------------------------------------------

/**
 * Read the entire dataset from D1.
 * Returns a Dataset with camelCase entities and ISO date strings.
 */
export async function readAll(db: D1Database): Promise<Dataset> {
  const [
    membersResult,
    sourcesResult,
    benefitsResult,
    redemptionsResult,
    pointsSourcesResult,
    redeemablesResult,
    tzResult,
  ] = await db.batch([
    db.prepare('SELECT * FROM members ORDER BY created_at, id'),
    db.prepare('SELECT * FROM sources ORDER BY created_at, id'),
    db.prepare('SELECT * FROM benefits ORDER BY created_at, id'),
    db.prepare('SELECT * FROM redemptions ORDER BY redeemed_at, id'),
    db.prepare('SELECT * FROM points_sources ORDER BY created_at, id'),
    db.prepare('SELECT * FROM redeemables ORDER BY created_at, id'),
    db.prepare("SELECT value FROM settings WHERE key = 'timezone'"),
  ]);

  const members = membersResult.results.map((r) =>
    rowToMember(r as unknown as MemberRow),
  );
  const sources = sourcesResult.results.map((r) =>
    rowToSource(r as unknown as SourceRow),
  );
  const benefits = benefitsResult.results.map((r) =>
    rowToBenefit(r as unknown as BenefitRow),
  );
  const redemptions = redemptionsResult.results.map((r) =>
    rowToRedemption(r as unknown as RedemptionRow),
  );
  const pointsSources = pointsSourcesResult.results.map((r) =>
    rowToPointsSource(r as unknown as PointsSourceRow),
  );
  const redeemables = redeemablesResult.results.map((r) =>
    rowToRedeemable(r as unknown as RedeemableRow),
  );

  const tzRow = tzResult.results[0] as { value: string } | undefined;
  const defaultSettings: AppSettings = {
    timezone: tzRow?.value ?? 'Asia/Shanghai',
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

// -- Write all ----------------------------------------------------------------

/**
 * Replace all data in D1 with the given dataset.
 *
 * Uses D1 batch() for atomic all-or-nothing semantics:
 * 1. DELETE all tables in reverse dependency order
 * 2. INSERT all rows in forward dependency order
 *
 * D1 batch() guarantees atomicity — if any statement fails, all are rolled
 * back. This matches the behavior of zhe's handleD1Batch.
 *
 * Caller MUST validate the dataset before calling this function.
 */
export async function writeAll(
  db: D1Database,
  dataset: Dataset,
): Promise<void> {
  const statements: D1PreparedStatement[] = [];

  // Delete in reverse dependency order to satisfy FK constraints
  statements.push(db.prepare('DELETE FROM redeemables'));
  statements.push(db.prepare('DELETE FROM points_sources'));
  statements.push(db.prepare('DELETE FROM redemptions'));
  statements.push(db.prepare('DELETE FROM benefits'));
  statements.push(db.prepare('DELETE FROM sources'));
  statements.push(db.prepare('DELETE FROM members'));
  statements.push(db.prepare('DELETE FROM settings'));

  // Insert members
  for (const m of dataset.members) {
    const row = memberToRow(m);
    statements.push(
      db
        .prepare(
          'INSERT INTO members (id, name, relationship, avatar, created_at) VALUES (?, ?, ?, ?, ?)',
        )
        .bind(row.id, row.name, row.relationship, row.avatar, row.created_at),
    );
  }

  // Insert sources
  for (const s of dataset.sources) {
    const row = sourceToRow(s);
    statements.push(
      db
        .prepare(
          'INSERT INTO sources (id, member_id, name, website, icon, phone, category, currency, cycle_anchor, valid_from, valid_until, archived, memo, cost, card_number, color_index, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
        )
        .bind(
          row.id,
          row.member_id,
          row.name,
          row.website,
          row.icon,
          row.phone,
          row.category,
          row.currency,
          row.cycle_anchor,
          row.valid_from,
          row.valid_until,
          row.archived,
          row.memo,
          row.cost,
          row.card_number,
          row.color_index,
          row.created_at,
        ),
    );
  }

  // Insert benefits
  for (const b of dataset.benefits) {
    const row = benefitToRow(b);
    statements.push(
      db
        .prepare(
          'INSERT INTO benefits (id, source_id, name, type, quota, credit_amount, shared, cycle_anchor, memo, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
        )
        .bind(
          row.id,
          row.source_id,
          row.name,
          row.type,
          row.quota,
          row.credit_amount,
          row.shared,
          row.cycle_anchor,
          row.memo,
          row.created_at,
        ),
    );
  }

  // Insert redemptions
  for (const r of dataset.redemptions) {
    const row = redemptionToRow(r);
    statements.push(
      db
        .prepare(
          'INSERT INTO redemptions (id, benefit_id, member_id, redeemed_at, memo) VALUES (?, ?, ?, ?, ?)',
        )
        .bind(
          row.id,
          row.benefit_id,
          row.member_id,
          row.redeemed_at,
          row.memo,
        ),
    );
  }

  // Insert points_sources
  for (const ps of dataset.pointsSources) {
    const row = pointsSourceToRow(ps);
    statements.push(
      db
        .prepare(
          'INSERT INTO points_sources (id, member_id, name, icon, balance, memo, created_at) VALUES (?, ?, ?, ?, ?, ?, ?)',
        )
        .bind(
          row.id,
          row.member_id,
          row.name,
          row.icon,
          row.balance,
          row.memo,
          row.created_at,
        ),
    );
  }

  // Insert redeemables
  for (const rd of dataset.redeemables) {
    const row = redeemableToRow(rd);
    statements.push(
      db
        .prepare(
          'INSERT INTO redeemables (id, points_source_id, name, cost, memo, created_at) VALUES (?, ?, ?, ?, ?, ?)',
        )
        .bind(
          row.id,
          row.points_source_id,
          row.name,
          row.cost,
          row.memo,
          row.created_at,
        ),
    );
  }

  // Insert settings
  statements.push(
    db
      .prepare('INSERT INTO settings (key, value) VALUES (?, ?)')
      .bind('timezone', dataset.defaultSettings.timezone),
  );

  // Execute all statements atomically
  await db.batch(statements);
}

// -- Reset --------------------------------------------------------------------

/**
 * Delete all data from all tables.
 * Used for local/E2E testing — controlled by ALLOW_RESET env flag.
 */
export async function resetAll(db: D1Database): Promise<void> {
  await db.batch([
    db.prepare('DELETE FROM redeemables'),
    db.prepare('DELETE FROM points_sources'),
    db.prepare('DELETE FROM redemptions'),
    db.prepare('DELETE FROM benefits'),
    db.prepare('DELETE FROM sources'),
    db.prepare('DELETE FROM members'),
    db.prepare('DELETE FROM settings'),
  ]);
}
