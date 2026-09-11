"use client";

import { Badge } from "@nocoo/basalt";
import type { BenefitCycleStatus } from "@/models/types";

/**
 * Maps domain status → Basalt Badge variant.
 *
 * - available     → success (green)
 * - partially_used → info (blue)
 * - exhausted     → secondary
 * - expiring_soon → warning (amber/orange)
 * - pending       → secondary
 * - not_applicable → outline
 */
const STATUS_TO_VARIANT: Record<
  BenefitCycleStatus,
  "success" | "info" | "secondary" | "warning" | "outline"
> = {
  available: "success",
  partially_used: "info",
  exhausted: "secondary",
  expiring_soon: "warning",
  pending: "secondary",
  not_applicable: "outline",
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
