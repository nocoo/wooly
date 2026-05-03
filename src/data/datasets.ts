// Test fixture dataset accessor.
// Returns the mock dataset for use in test setup and dev fixtures only.
// Runtime data is served by the Worker/D1 backend via src/services/worker-client.ts.

import type {
  Member,
  Source,
  Benefit,
  Redemption,
  PointsSource,
  Redeemable,
  AppSettings,
} from "@/models/types";

import * as mock from "@/data/mock";

export interface Dataset {
  members: Member[];
  sources: Source[];
  benefits: Benefit[];
  redemptions: Redemption[];
  pointsSources: PointsSource[];
  redeemables: Redeemable[];
  defaultSettings: AppSettings;
}

/**
 * Returns a deep-copied mock dataset for tests and dev fixtures.
 * Each call returns fresh arrays so consumers can safely mutate
 * without sharing references.
 */
export function getDataset(): Dataset {
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
