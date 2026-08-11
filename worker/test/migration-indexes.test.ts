import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { createD1Miniflare } from './create-d1-miniflare.js';
import { readFileSync } from 'fs';
import { applyMigration } from '../src/db/migrate.js';

let mf: ReturnType<typeof createD1Miniflare>;
let db: D1Database;

beforeAll(async () => {
  mf = createD1Miniflare();
  db = await mf.getD1Database('DB');
  const sql = readFileSync(
    new URL('../migrations/0001_init.sql', import.meta.url),
    'utf-8',
  );
  await applyMigration(db, sql);
});

afterAll(async () => {
  await mf.dispose();
});

describe('migration — FK indexes exist', () => {
  const expectedIndexes = [
    'idx_sources_member_id',
    'idx_benefits_source_id',
    'idx_redemptions_benefit_id',
    'idx_redemptions_member_id',
    'idx_points_sources_member_id',
    'idx_redeemables_points_source_id',
  ];

  it.each(expectedIndexes)('index %s exists', async (indexName) => {
    const result = await db
      .prepare("SELECT name FROM sqlite_master WHERE type = 'index' AND name = ?")
      .bind(indexName)
      .first<{ name: string }>();
    expect(result).not.toBeNull();
    expect(result!.name).toBe(indexName);
  });
});
