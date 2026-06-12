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

export type DatasetState = "normal" | "empty";

/**
 * Returns a deep-copied mock dataset for tests and dev fixtures.
 * Each call returns fresh arrays so consumers can safely mutate
 * without sharing references.
 *
 * @param state — `"normal"` (default) returns the full mock; `"empty"`
 * returns a dataset with no members/sources/benefits/etc, used by the
 * visual snapshot scaffold to capture empty-state UI.
 */
export function getDataset(state: DatasetState = "normal"): Dataset {
  if (state === "empty") {
    return {
      members: [],
      sources: [],
      benefits: [],
      redemptions: [],
      pointsSources: [],
      redeemables: [],
      defaultSettings: { ...mock.defaultSettings },
    };
  }
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
