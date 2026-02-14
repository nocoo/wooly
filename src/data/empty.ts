// Empty dataset for production mode.
// All collections are empty arrays — users start from scratch.

import type {
  Member,
  Source,
  Benefit,
  Redemption,
  PointsSource,
  Redeemable,
  AppSettings,
} from "@/models/types";

export const members: Member[] = [];
export const sources: Source[] = [];
export const benefits: Benefit[] = [];
export const redemptions: Redemption[] = [];
export const pointsSources: PointsSource[] = [];
export const redeemables: Redeemable[] = [];

export const defaultSettings: AppSettings = {
  timezone: "Asia/Shanghai",
};
