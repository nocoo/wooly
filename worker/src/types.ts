export type Env = WorkerBindings;

export interface AccessUser {
  email: string;
  name: string;
}

// -- DB Row Types (snake_case, mirrors D1 schema) -----------------------------

export interface MemberRow {
  id: string;
  name: string;
  relationship: string;
  avatar: string | null;
  created_at: number; // epoch ms
}

export interface SourceRow {
  id: string;
  member_id: string;
  name: string;
  website: string | null;
  icon: string | null;
  phone: string | null;
  category: string;
  currency: string;
  cycle_anchor: string; // JSON string
  valid_from: number | null; // epoch ms, nullable
  valid_until: number | null; // epoch ms, nullable
  archived: number; // 0 or 1
  memo: string | null;
  cost: string | null;
  card_number: string | null;
  color_index: number | null;
  card_network: string | null;
  created_at: number; // epoch ms
}

export interface BenefitRow {
  id: string;
  source_id: string;
  name: string;
  type: string;
  quota: number | null;
  credit_amount: number | null;
  shared: number; // 0 or 1
  cycle_anchor: string | null; // JSON string, nullable
  memo: string | null;
  created_at: number; // epoch ms
}

export interface RedemptionRow {
  id: string;
  benefit_id: string;
  member_id: string;
  redeemed_at: number; // epoch ms
  memo: string | null;
}

export interface PointsSourceRow {
  id: string;
  member_id: string;
  name: string;
  icon: string | null;
  balance: number;
  memo: string | null;
  created_at: number; // epoch ms
}

export interface RedeemableRow {
  id: string;
  points_source_id: string;
  name: string;
  cost: number;
  memo: string | null;
  created_at: number; // epoch ms
}

export interface SettingRow {
  key: string;
  value: string;
}

// -- API / Domain Types (camelCase, matches Dataset) --------------------------

export type MemberRelationship =
  | 'self'
  | 'spouse'
  | 'parent'
  | 'child'
  | 'sibling'
  | 'other';

export type SourceCategory =
  | 'credit-card'
  | 'insurance'
  | 'membership'
  | 'telecom'
  | 'other';

export type BenefitType = 'quota' | 'credit' | 'action';

export interface CycleAnchor {
  period: 'monthly' | 'quarterly' | 'yearly';
  anchor: number | { month: number; day: number };
}

export interface Member {
  id: string;
  name: string;
  relationship: MemberRelationship;
  avatar: string | null;
  createdAt: string; // ISO 8601
}

export interface Source {
  id: string;
  memberId: string;
  name: string;
  website: string | null;
  icon: string | null;
  phone: string | null;
  category: SourceCategory;
  currency: string;
  cycleAnchor: CycleAnchor;
  validFrom: string | null; // ISO 8601, nullable
  validUntil: string | null; // ISO 8601, nullable
  archived: boolean;
  memo: string | null;
  cost: string | null;
  cardNumber: string | null;
  colorIndex: number | null;
  cardNetwork: string | null;
  createdAt: string; // ISO 8601
}

export interface Benefit {
  id: string;
  sourceId: string;
  name: string;
  type: BenefitType;
  quota: number | null;
  creditAmount: number | null;
  shared: boolean;
  cycleAnchor: CycleAnchor | null;
  memo: string | null;
  createdAt: string; // ISO 8601
}

export interface Redemption {
  id: string;
  benefitId: string;
  memberId: string;
  redeemedAt: string; // ISO 8601
  memo: string | null;
}

export interface PointsSource {
  id: string;
  memberId: string;
  name: string;
  icon: string | null;
  balance: number;
  memo: string | null;
  createdAt: string; // ISO 8601
}

export interface Redeemable {
  id: string;
  pointsSourceId: string;
  name: string;
  cost: number;
  memo: string | null;
  createdAt: string; // ISO 8601
}

export interface AppSettings {
  timezone: string;
}

/**
 * Full dataset — matches the household dataset API contract.
 */
export interface Dataset {
  members: Member[];
  sources: Source[];
  benefits: Benefit[];
  redemptions: Redemption[];
  pointsSources: PointsSource[];
  redeemables: Redeemable[];
  defaultSettings: AppSettings;
}
