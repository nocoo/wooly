// ---------------------------------------------------------------------------
// Domain type definitions for Wooly
// ---------------------------------------------------------------------------

// -- Enums / Union Types ----------------------------------------------------

/** Relationship of a member to the account holder */
export type MemberRelationship =
  | "self"
  | "spouse"
  | "parent"
  | "child"
  | "sibling"
  | "other";

/** Cost billing cycle (independent from benefit cycle) */
export type CostCycle = "monthly" | "quarterly" | "yearly";

/** Source category */
export type SourceCategory =
  | "credit-card"
  | "insurance"
  | "membership"
  | "telecom"
  | "other";

/** Benefit type */
export type BenefitType =
  | "quota" // N times per cycle
  | "credit" // Fixed amount per cycle, one-click full redemption
  | "action"; // Reminder only, no redemption

/** Computed benefit status within a cycle */
export type BenefitCycleStatus =
  | "available"
  | "partially_used"
  | "exhausted"
  | "expiring_soon"
  | "pending" // action type: pending in current cycle
  | "not_applicable"; // action type: does not participate in redemption

// -- Value Objects ----------------------------------------------------------

/** Cycle anchor configuration — defines reset schedule for benefits */
export interface CycleAnchor {
  /** Reset frequency */
  period: "monthly" | "quarterly" | "yearly";

  /**
   * Start-day anchor for the cycle.
   *
   * - monthly:   dayOfMonth (1-31)
   * - quarterly: { month: 1-12, day: 1-31 }
   * - yearly:    { month: 1-12, day: 1-31 }
   */
  anchor: number | { month: number; day: number };
}

/** A left-closed, right-open cycle window [start, end) */
export interface CycleWindow {
  /** Cycle start date (inclusive), ISO 8601 YYYY-MM-DD */
  start: string;
  /** Cycle end date (exclusive), ISO 8601 YYYY-MM-DD */
  end: string;
}

/** Full computed status of a benefit within the current cycle */
export interface BenefitCycleInfo {
  /** Current cycle window */
  window: CycleWindow;
  /** Number of redemptions in this cycle */
  usedCount: number;
  /** Total quota (quota type) or 1 (credit type) or 0 (action type) */
  totalCount: number;
  /** Usage ratio 0-1 */
  usageRatio: number;
  /** Days until cycle end */
  daysUntilEnd: number;
  /** Whether the cycle is expiring soon */
  isExpiringSoon: boolean;
  /** Computed status */
  status: BenefitCycleStatus;
}

/** Resolved icon info for a source */
export interface SourceIconInfo {
  type: "favicon" | "icon" | "category";
  value: string;
}

// -- Entities ---------------------------------------------------------------

/** Family member / beneficiary */
export interface Member {
  id: string;
  name: string;
  relationship: MemberRelationship;
  avatar: string | null;
  createdAt: string;
}

/** Benefits source (credit card, insurance, membership, etc.) */
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
  validFrom: string | null;
  validUntil: string | null;
  archived: boolean;
  memo: string | null;
  cost: number | null;
  costCycle: CostCycle | null;
  createdAt: string;
}

/** Benefit under a source */
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
  createdAt: string;
}

/** Redemption record for a benefit */
export interface Redemption {
  id: string;
  benefitId: string;
  memberId: string;
  redeemedAt: string;
  memo: string | null;
}

/** Points source (special source type with balance) */
export interface PointsSource {
  id: string;
  memberId: string;
  name: string;
  icon: string | null;
  balance: number;
  memo: string | null;
  createdAt: string;
}

/** Redeemable item under a points source */
export interface Redeemable {
  id: string;
  pointsSourceId: string;
  name: string;
  cost: number;
  memo: string | null;
  createdAt: string;
}

// -- CRUD Input Types -------------------------------------------------------

export interface CreateMemberInput {
  name: string;
  relationship: MemberRelationship;
  avatar?: string | null;
}

export interface UpdateMemberInput {
  name?: string;
  relationship?: MemberRelationship;
  avatar?: string | null;
}

export interface CreateSourceInput {
  memberId: string;
  name: string;
  website?: string | null;
  icon?: string | null;
  phone?: string | null;
  category: SourceCategory;
  currency: string;
  cycleAnchor: CycleAnchor;
  validFrom?: string | null;
  validUntil?: string | null;
  memo?: string | null;
  cost?: number | null;
  costCycle?: CostCycle | null;
}

export interface UpdateSourceInput {
  memberId?: string;
  name?: string;
  website?: string | null;
  icon?: string | null;
  phone?: string | null;
  category?: SourceCategory;
  currency?: string;
  cycleAnchor?: CycleAnchor;
  validFrom?: string | null;
  validUntil?: string | null;
  memo?: string | null;
  cost?: number | null;
  costCycle?: CostCycle | null;
}

export interface CreateBenefitInput {
  sourceId: string;
  name: string;
  type: BenefitType;
  quota?: number | null;
  creditAmount?: number | null;
  shared?: boolean;
  cycleAnchor?: CycleAnchor | null;
  memo?: string | null;
}

export interface UpdateBenefitInput {
  name?: string;
  type?: BenefitType;
  quota?: number | null;
  creditAmount?: number | null;
  shared?: boolean;
  cycleAnchor?: CycleAnchor | null;
  memo?: string | null;
}

export interface CreateRedemptionInput {
  benefitId: string;
  memberId: string;
  redeemedAt?: string;
  memo?: string | null;
}

export interface CreatePointsSourceInput {
  memberId: string;
  name: string;
  icon?: string | null;
  balance: number;
  memo?: string | null;
}

export interface UpdatePointsSourceInput {
  name?: string;
  icon?: string | null;
  balance?: number;
  memo?: string | null;
}

export interface CreateRedeemableInput {
  pointsSourceId: string;
  name: string;
  cost: number;
  memo?: string | null;
}

export interface UpdateRedeemableInput {
  name?: string;
  cost?: number;
  memo?: string | null;
}

// -- Validation Types -------------------------------------------------------

/** A single validation error */
export interface ValidationError {
  field: string;
  message: string;
}

/** Summary of dependents affected by a delete operation */
export interface DependentsSummary {
  sources?: number;
  benefits?: number;
  redemptions?: number;
  pointsSources?: number;
  redeemables?: number;
}

// -- Settings ---------------------------------------------------------------

export interface AppSettings {
  timezone: string;
}
