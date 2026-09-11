"use client";

import type { BenefitType, BenefitCycleStatus } from "@/models/types";
import type { BenefitStatusSeverity } from "@/models/benefit";
import { BenefitStatusBadge } from "@/components/BenefitStatusBadge";
import { Button, LayerCard, Meter } from "@nocoo/basalt";
import { Pencil, Trash2, CheckCircle, RefreshCw } from "lucide-react";

/** Map benefit type to Chinese label */
const TYPE_LABEL: Record<BenefitType, string> = {
  quota: "次数型",
  credit: "额度型",
  action: "任务型",
};

export interface BenefitProgressRowProps {
  id: string;
  name: string;
  type: BenefitType;
  status: BenefitCycleStatus;
  statusLabel: string;
  statusSeverity: BenefitStatusSeverity;
  progressPercent: number;
  isExpiringSoon: boolean;
  expiryWarning: string | null;
  cycleLabel?: string;
  shared: boolean;
  memo?: string | null;
  onRedeem?: () => void;
  onEdit?: () => void;
  onDelete?: () => void;
}

export function BenefitProgressRow({
  name,
  type,
  status,
  statusLabel,
  statusSeverity: _statusSeverity,
  progressPercent,
  isExpiringSoon,
  expiryWarning,
  cycleLabel,
  shared,
  memo,
  onRedeem,
  onEdit,
  onDelete,
}: BenefitProgressRowProps) {
  const canRedeem = type !== "action" && status !== "exhausted";

  return (
    <LayerCard.Well className="p-4 md:p-5 rounded-card">
      {/* Header row: name + badge + actions */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 min-w-0 flex-1">
          <span className="text-sm font-semibold text-basalt-foreground truncate">
            {name}
          </span>
          {shared && (
            <span className="shrink-0 rounded-full bg-basalt-primary/10 px-2 py-0.5 text-[10px] font-medium text-basalt-primary">
              共享
            </span>
          )}
          <BenefitStatusBadge
            status={status}
            label={statusLabel}
            className="shrink-0"
          />
        </div>
        <div className="flex items-center gap-1 shrink-0">
          {canRedeem && onRedeem && (
            <Button
              size="sm"
              variant="outline"
              onClick={onRedeem}
              className="h-7 text-xs px-2"
              icon={<CheckCircle className="h-3.5 w-3.5" />}
            >
              核销
            </Button>
          )}
          {onEdit && (
            <Button
              size="icon"
              variant="ghost"
              onClick={onEdit}
              className="h-7 w-7 text-basalt-muted-foreground hover:text-basalt-foreground"
              aria-label="编辑权益"
            >
              <Pencil className="h-3.5 w-3.5" />
            </Button>
          )}
          {onDelete && (
            <Button
              size="icon"
              variant="ghost"
              onClick={onDelete}
              className="h-7 w-7 text-basalt-muted-foreground hover:text-basalt-destructive"
              aria-label="删除权益"
            >
              <Trash2 className="h-3.5 w-3.5" />
            </Button>
          )}
        </div>
      </div>

      {/* Progress / Status display */}
      <div className="mt-3">
        {type === "action" ? (
          <div className="flex items-center justify-between text-xs text-basalt-muted-foreground py-1 bg-basalt-secondary/50 rounded-lg px-2.5">
            <span>{TYPE_LABEL[type]}（任务提醒）</span>
            <span className="font-medium text-basalt-foreground">{statusLabel}</span>
          </div>
        ) : (
          <Meter
            value={Math.round(progressPercent)}
            label={TYPE_LABEL[type]}
            customValue={`${Math.round(progressPercent)}%`}
            aria-label={`${name} 使用进度`}
          />
        )}
      </div>

      {/* Footer info: cycle, memo, expiry warning */}
      <div className="mt-2.5 flex items-center justify-between text-xs text-basalt-muted-foreground">
        <div className="flex items-center gap-3">
          {cycleLabel && (
            <span className="flex items-center gap-1">
              <RefreshCw className="h-3 w-3" strokeWidth={1.5} />
              {cycleLabel}
            </span>
          )}
          {memo && <span className="truncate max-w-[200px]">{memo}</span>}
        </div>
        {isExpiringSoon && expiryWarning && (
          <span className="text-amber-600 dark:text-amber-400 font-medium shrink-0">
            {expiryWarning}
          </span>
        )}
      </div>
    </LayerCard.Well>
  );
}
