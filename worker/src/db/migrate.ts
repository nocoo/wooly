// ---------------------------------------------------------------------------
// Helper to apply SQL migration files to a D1 database.
//
// D1's exec() in miniflare processes SQL line-by-line, so multi-line
// CREATE TABLE statements must be collapsed to single lines first.
// This helper strips comments, splits by semicolons, and executes
// each statement individually.
// ---------------------------------------------------------------------------

/**
 * Apply a SQL migration string to a D1 database.
 * Handles miniflare's line-by-line exec limitation by collapsing
 * multi-line statements to single lines.
 */
export async function applyMigration(
  db: D1Database,
  sql: string,
): Promise<void> {
  const statements = sql
    .replace(/--.*$/gm, '') // strip line comments
    .split(';')
    .map((s) => s.trim().replace(/\s+/g, ' '))
    .filter((s) => s.length > 0);

  for (const stmt of statements) {
    await db.exec(`${stmt};`);
  }
}
