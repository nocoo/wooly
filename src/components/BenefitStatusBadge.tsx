"use client";

import { Badge } from "@nocoo/basalt";
import type { BenefitCycleStatus } from "@/models/types";

/**
 * Maps domain status → Basalt Badge tone/variant.
 *
 * - available      → success (green)
 * - partially_used → info (blue)
 * - exhausted      → neutral (soft)
 * - expiring_soon  → warning (amber/orange)
 * - pending        → neutral (soft)
 * - not_applicable → neutral (outline)
 */
const STATUS_TO_BADGE: Record<
  BenefitCycleStatus,
  {
    tone: "success" | "info" | "neutral" | "warning";
    variant?: "soft" | "outline";
  }
> = {
  available: { tone: "success" },
  partially_used: { tone: "info" },
  exhausted: { tone: "neutral" },
  expiring_soon: { tone: "warning" },
  pending: { tone: "neutral" },
  not_applicable: { tone: "neutral", variant: "outline" },
};

const STATUS_LABELS: Record<BenefitCycleStatus, string> = {
  available: "可用",
  partially_used: "部分使用",
  exhausted: "已用完",
  expiring_soon: "即将过期",
  pending: "待办",
  not_applicable: "仅提醒",
};

export interface BenefitStatusBadgeProps {
  status: BenefitCycleStatus;
  label?: string;
  className?: string;
}

export function BenefitStatusBadge({ status, label, className }: BenefitStatusBadgeProps) {
  return (
    <Badge {...STATUS_TO_BADGE[status]} className={className}>
      {label ?? STATUS_LABELS[status]}
    </Badge>
  );
}
