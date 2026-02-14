// Unified dataset accessor — returns the correct dataset based on DataMode.

import type {
  Member,
  Source,
  Benefit,
  Redemption,
  PointsSource,
  Redeemable,
  AppSettings,
} from "@/models/types";
import type { DataMode } from "@/hooks/use-data-mode";

import * as mock from "@/data/mock";
import * as empty from "@/data/empty";

export interface Dataset {
  members: Member[];
  sources: Source[];
  benefits: Benefit[];
  redemptions: Redemption[];
  pointsSources: PointsSource[];
  redeemables: Redeemable[];
  defaultSettings: AppSettings;
}

const datasets: Record<DataMode, Dataset> = {
  test: mock,
  production: empty,
};

/**
 * Returns a deep-copied dataset for the given mode.
 * Each call returns fresh arrays so ViewModels can safely
 * spread them into useState without sharing references.
 */
export function getDataset(mode: DataMode): Dataset {
  const ds = datasets[mode];
  return {
    members: [...ds.members],
    sources: [...ds.sources],
    benefits: [...ds.benefits],
    redemptions: [...ds.redemptions],
    pointsSources: [...ds.pointsSources],
    redeemables: [...ds.redeemables],
    defaultSettings: { ...ds.defaultSettings },
  };
}
