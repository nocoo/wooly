"use client";

import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogFooter,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogCancel,
  AlertDialogAction,
} from "@/components/ui/alert-dialog";
import type { DependentsSummary } from "@/models/types";

export interface DeleteConfirmDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description: string;
  dependents?: DependentsSummary | null;
  onConfirm: () => void;
}

const DEPENDENT_LABELS: { key: keyof DependentsSummary; label: string }[] = [
  { key: "sources", label: "账户" },
  { key: "benefits", label: "权益" },
  { key: "redemptions", label: "核销记录" },
  { key: "pointsSources", label: "积分账户" },
  { key: "redeemables", label: "可兑换项" },
];

export function DeleteConfirmDialog({
  open,
  onOpenChange,
  title,
  description,
  dependents,
  onConfirm,
}: DeleteConfirmDialogProps) {
  const hasDependents =
    dependents != null &&
    DEPENDENT_LABELS.some(({ key }) => {
      const val = dependents[key];
      return val != null && val > 0;
    });

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>{title}</AlertDialogTitle>
          <AlertDialogDescription>{description}</AlertDialogDescription>
        </AlertDialogHeader>

        {hasDependents && dependents && (
          <div className="rounded-widget bg-destructive/10 p-3 space-y-1">
            <p className="text-sm font-medium text-destructive">级联影响</p>
            <p className="text-xs text-muted-foreground">
              以下关联数据将被一并删除：
            </p>
            <ul className="text-sm text-foreground space-y-0.5 mt-1">
              {DEPENDENT_LABELS.map(({ key, label }) => {
                const val = dependents[key];
                if (val == null || val === 0) return null;
                return (
                  <li key={key}>
                    · {val} 个{label}
                  </li>
                );
              })}
            </ul>
          </div>
        )}

        <AlertDialogFooter>
          <AlertDialogCancel>取消</AlertDialogCancel>
          <AlertDialogAction
            onClick={onConfirm}
            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
          >
            确认删除
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
