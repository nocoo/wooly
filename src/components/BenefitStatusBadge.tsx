"use client";

import { Badge } from "@/components/ui/badge";
import type { BenefitCycleStatus } from "@/models/types";

/**
 * Maps domain status → Badge variant.
 *
 * - available     → success (green): unused & in-cycle
 * - partially_used → info (sky): mid-cycle, some used
 * - exhausted     → muted: nothing left to use
 * - expiring_soon → warning (amber): cycle ending within window
 * - pending       → secondary: action-type, not yet completed
 * - not_applicable → muted: action without trackable cycle
 *
 * Acts as a thin wrapper around the shared Badge so all status chips
 * share the same shape, padding, ring, and dark-mode handling.
 */
const STATUS_TO_VARIANT: Record<
  BenefitCycleStatus,
  "success" | "info" | "muted" | "warning" | "secondary"
> = {
  available: "success",
  partially_used: "info",
  exhausted: "muted",
  expiring_soon: "warning",
  pending: "secondary",
  not_applicable: "muted",
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

export function BenefitStatusBadge({
  status,
  label,
  className,
}: BenefitStatusBadgeProps) {
  return (
    <Badge variant={STATUS_TO_VARIANT[status]} className={className}>
      {label ?? STATUS_LABELS[status]}
    </Badge>
  );
}
