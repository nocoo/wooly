// Seed data provider for the test database.
// Imports mock.ts data and wraps it as a Dataset for resetAndSeed().
//
// @deprecated — API routes now use the Worker client (src/services/worker-client.ts).
// This module will be removed once DataMode cleanup is confirmed.

import * as mock from "@/data/mock";
import type { Dataset } from "./operations";

/**
 * Returns the full test seed dataset from mock.ts.
 * Used by resetAndSeed() to populate test.db.
 */
export function getTestSeedData(): Dataset {
  return {
    members: [...mock.members],
    sources: [...mock.sources],
    benefits: [...mock.benefits],
    redemptions: [...mock.redemptions],
    pointsSources: [...mock.pointsSources],
    redeemables: [...mock.redeemables],
    defaultSettings: { ...mock.defaultSettings },
  };
}
