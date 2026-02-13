"use client";

import { cn } from "@/lib/utils";
import type { BenefitCycleStatus } from "@/models/types";

const STATUS_STYLES: Record<BenefitCycleStatus, string> = {
  available: "bg-emerald-500/10 text-emerald-600",
  partially_used: "bg-sky-500/10 text-sky-600",
  exhausted: "bg-muted text-muted-foreground",
  expiring_soon: "bg-amber-500/10 text-amber-600",
  pending: "bg-violet-500/10 text-violet-600",
  not_applicable: "bg-muted text-muted-foreground",
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
    <span
      className={cn(
        "inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium",
        STATUS_STYLES[status],
        className,
      )}
    >
      {label ?? STATUS_LABELS[status]}
    </span>
  );
}
