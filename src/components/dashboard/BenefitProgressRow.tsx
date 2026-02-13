"use client";

import type { BenefitType, BenefitCycleStatus } from "@/models/types";
import { BenefitStatusBadge } from "@/components/BenefitStatusBadge";
import { Button } from "@/components/ui/button";
import { Pencil, Trash2, CheckCircle } from "lucide-react";
import { cn } from "@/lib/utils";

export interface BenefitProgressRowProps {
  id: string;
  name: string;
  type: BenefitType;
  status: BenefitCycleStatus;
  statusLabel: string;
  statusColorClass: string;
  progressPercent: number;
  isExpiringSoon: boolean;
  expiryWarning: string | null;
  shared: boolean;
  onRedeem?: () => void;
  onEdit?: () => void;
  onDelete?: () => void;
}

export function BenefitProgressRow({
  name,
  type,
  status,
  statusLabel,
  statusColorClass,
  progressPercent,
  isExpiringSoon,
  expiryWarning,
  shared,
  onRedeem,
  onEdit,
  onDelete,
}: BenefitProgressRowProps) {
  const canRedeem = type !== "action" && status !== "exhausted";

  return (
    <div className="rounded-widget bg-card p-3 md:p-4">
      {/* Header row: name + status + actions */}
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2 min-w-0 flex-1">
          <span className="text-sm font-medium text-foreground truncate">
            {name}
          </span>
          {shared && (
            <span className="text-xs text-muted-foreground">(共享)</span>
          )}
          <BenefitStatusBadge status={status} />
        </div>
        <div className="flex items-center gap-1 ml-2 shrink-0">
          {canRedeem && onRedeem && (
            <Button
              variant="ghost"
              size="sm"
              onClick={onRedeem}
              className="h-7 px-2 text-xs text-primary hover:text-primary"
            >
              <CheckCircle className="h-3.5 w-3.5 mr-1" />
              核销
            </Button>
          )}
          {onEdit && (
            <Button
              variant="ghost"
              size="icon"
              onClick={onEdit}
              className="h-7 w-7"
            >
              <Pencil className="h-3.5 w-3.5" />
            </Button>
          )}
          {onDelete && (
            <Button
              variant="ghost"
              size="icon"
              onClick={onDelete}
              className="h-7 w-7 text-destructive hover:text-destructive"
            >
              <Trash2 className="h-3.5 w-3.5" />
            </Button>
          )}
        </div>
      </div>

      {/* Progress bar */}
      {type !== "action" && (
        <div className="flex items-center gap-3">
          <div
            className="flex-1 h-2 rounded-full bg-secondary"
            role="progressbar"
            aria-valuenow={progressPercent}
            aria-valuemin={0}
            aria-valuemax={100}
            aria-label={`${name}: ${statusLabel}`}
          >
            <div
              className={cn(
                "h-full rounded-full transition-all",
                statusColorClass.replace("text-", "bg-"),
              )}
              style={{ width: `${Math.min(progressPercent, 100)}%` }}
              aria-hidden="true"
            />
          </div>
          <span className="text-xs text-muted-foreground shrink-0">
            {statusLabel}
          </span>
        </div>
      )}

      {/* Action type: just show the status label */}
      {type === "action" && (
        <p className="text-xs text-muted-foreground">{statusLabel}</p>
      )}

      {/* Expiry warning */}
      {isExpiringSoon && expiryWarning && (
        <p className="mt-1 text-xs text-amber-600">{expiryWarning}</p>
      )}
    </div>
  );
}
