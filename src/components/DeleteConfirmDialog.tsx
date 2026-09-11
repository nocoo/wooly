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
} from "@nocoo/basalt/components/alert-dialog";
import { Button } from "@nocoo/basalt";
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

  const handleAction = () => {
    onConfirm();
    onOpenChange(false);
  };

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>{title}</AlertDialogTitle>
          <AlertDialogDescription asChild>
            <div className="space-y-2 text-sm text-basalt-muted-foreground">
              <p>{description}</p>
              {hasDependents && dependents && (
                <div className="rounded-lg bg-basalt-destructive/10 p-3 space-y-1 text-left">
                  <p className="text-sm font-medium text-basalt-destructive">级联影响</p>
                  <p className="text-xs text-basalt-muted-foreground">
                    以下关联数据将被一并删除：
                  </p>
                  <ul className="text-sm text-basalt-foreground space-y-0.5 mt-1">
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
            </div>
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel asChild>
            <Button variant="outline">取消</Button>
          </AlertDialogCancel>
          <AlertDialogAction asChild>
            <Button variant="destructive" onClick={handleAction}>
              确认删除
            </Button>
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
