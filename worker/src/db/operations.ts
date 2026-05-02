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
    db.prepare('SELECT * FROM members'),
    db.prepare('SELECT * FROM sources'),
    db.prepare('SELECT * FROM benefits'),
    db.prepare('SELECT * FROM redemptions'),
    db.prepare('SELECT * FROM points_sources'),
    db.prepare('SELECT * FROM redeemables'),
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
