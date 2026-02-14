"use client";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogFooter,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type {
  BenefitType,
  CreateBenefitInput,
  ValidationError,
} from "@/models/types";

export interface BenefitFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  editing: boolean;
  formInput: CreateBenefitInput;
  onFormInputChange: (input: CreateBenefitInput) => void;
  errors: ValidationError[];
  onSubmit: () => void;
}

const TYPE_OPTIONS: { value: BenefitType; label: string; description: string }[] = [
  { value: "quota", label: "次数型", description: "每周期可使用固定次数" },
  { value: "credit", label: "额度型", description: "每周期一次性使用全部额度" },
  { value: "action", label: "任务型", description: "仅提醒，不参与核销计算" },
];

const PERIOD_OPTIONS = [
  { value: "monthly", label: "每月" },
  { value: "quarterly", label: "每季" },
  { value: "yearly", label: "每年" },
];

function getFieldError(errors: ValidationError[], field: string): string | undefined {
  return errors.find((e) => e.field === field)?.message;
}

export function BenefitFormDialog({
  open,
  onOpenChange,
  editing,
  formInput,
  onFormInputChange,
  errors,
  onSubmit,
}: BenefitFormDialogProps) {
  const update = (patch: Partial<CreateBenefitInput>) => {
    onFormInputChange({ ...formInput, ...patch });
  };

  const handleTypeChange = (type: BenefitType) => {
    if (type === "quota") {
      update({ type, quota: formInput.quota ?? 1, creditAmount: null });
    } else if (type === "credit") {
      update({ type, quota: null, creditAmount: formInput.creditAmount ?? 100 });
    } else {
      update({ type, quota: null, creditAmount: null });
    }
  };

  const hasCycleOverride = formInput.cycleAnchor != null;

  const toggleCycleOverride = () => {
    if (hasCycleOverride) {
      update({ cycleAnchor: null });
    } else {
      update({ cycleAnchor: { period: "monthly", anchor: 1 } });
    }
  };

  const cycleAnchor = formInput.cycleAnchor;

  const anchorDay =
    cycleAnchor == null
      ? 1
      : typeof cycleAnchor.anchor === "number"
        ? cycleAnchor.anchor
        : cycleAnchor.anchor.day;

  const anchorMonth =
    cycleAnchor != null && typeof cycleAnchor.anchor === "object"
      ? cycleAnchor.anchor.month
      : 1;

  const handleCyclePeriodChange = (period: string) => {
    if (!cycleAnchor) return;
    const p = period as "monthly" | "quarterly" | "yearly";
    if (p === "monthly") {
      update({ cycleAnchor: { period: p, anchor: anchorDay } });
    } else {
      update({
        cycleAnchor: { period: p, anchor: { month: anchorMonth, day: anchorDay } },
      });
    }
  };

  const handleAnchorDayChange = (value: string) => {
    if (!cycleAnchor) return;
    const day = Math.max(1, Math.min(31, parseInt(value, 10) || 1));
    if (cycleAnchor.period === "monthly") {
      update({ cycleAnchor: { ...cycleAnchor, anchor: day } });
    } else {
      update({
        cycleAnchor: {
          ...cycleAnchor,
          anchor: { month: anchorMonth, day },
        },
      });
    }
  };

  const handleAnchorMonthChange = (value: string) => {
    if (!cycleAnchor) return;
    const month = Math.max(1, Math.min(12, parseInt(value, 10) || 1));
    update({
      cycleAnchor: {
        ...cycleAnchor,
        anchor: { month, day: anchorDay },
      },
    });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit();
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[450px]">
        <DialogHeader>
          <DialogTitle>{editing ? "编辑权益" : "新增权益"}</DialogTitle>
          <DialogDescription>
            {editing ? "修改权益信息" : "为当前账户添加一项权益"}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Name */}
          <div className="space-y-2">
            <Label htmlFor="benefit-name">名称 *</Label>
            <Input
              id="benefit-name"
              value={formInput.name}
              onChange={(e) => update({ name: e.target.value })}
              placeholder="例如：机场贵宾厅"
            />
            {getFieldError(errors, "name") && (
              <p className="text-xs text-destructive">{getFieldError(errors, "name")}</p>
            )}
          </div>

          {/* Type */}
          <div className="space-y-2">
            <Label>类型 *</Label>
            <Select
              value={formInput.type}
              onValueChange={(v) => handleTypeChange(v as BenefitType)}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {TYPE_OPTIONS.map((opt) => (
                  <SelectItem key={opt.value} value={opt.value}>
                    {opt.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <p className="text-xs text-muted-foreground">
              {TYPE_OPTIONS.find((o) => o.value === formInput.type)?.description}
            </p>
          </div>

          {/* Quota (only for quota type) */}
          {formInput.type === "quota" && (
            <div className="space-y-2">
              <Label htmlFor="benefit-quota">每周期次数 *</Label>
              <Input
                id="benefit-quota"
                type="number"
                min={1}
                value={formInput.quota ?? ""}
                onChange={(e) =>
                  update({ quota: e.target.value ? parseInt(e.target.value, 10) : null })
                }
                placeholder="例如：6"
              />
              {getFieldError(errors, "quota") && (
                <p className="text-xs text-destructive">{getFieldError(errors, "quota")}</p>
              )}
            </div>
          )}

          {/* Credit amount (only for credit type) */}
          {formInput.type === "credit" && (
            <div className="space-y-2">
              <Label htmlFor="benefit-credit">额度金额 *</Label>
              <Input
                id="benefit-credit"
                type="number"
                min={0.01}
                step={0.01}
                value={formInput.creditAmount ?? ""}
                onChange={(e) =>
                  update({
                    creditAmount: e.target.value ? parseFloat(e.target.value) : null,
                  })
                }
                placeholder="例如：200"
              />
              {getFieldError(errors, "creditAmount") && (
                <p className="text-xs text-destructive">
                  {getFieldError(errors, "creditAmount")}
                </p>
              )}
            </div>
          )}

          {/* Shared toggle */}
          <div className="flex items-center gap-3">
            <button
              type="button"
              role="switch"
              aria-checked={formInput.shared ?? false}
              onClick={() => update({ shared: !(formInput.shared ?? false) })}
              className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors ${
                formInput.shared ? "bg-primary" : "bg-muted"
              }`}
            >
              <span
                className={`pointer-events-none block h-5 w-5 rounded-full bg-background shadow-lg ring-0 transition-transform ${
                  formInput.shared ? "translate-x-5" : "translate-x-0"
                }`}
              />
            </button>
            <div>
              <Label className="cursor-pointer">全家共享</Label>
              <p className="text-xs text-muted-foreground">
                开启后，所有受益人均可使用此权益
              </p>
            </div>
          </div>

          {/* Cycle override toggle */}
          <div className="space-y-2">
            <div className="flex items-center gap-3">
              <button
                type="button"
                role="switch"
                aria-checked={hasCycleOverride}
                onClick={toggleCycleOverride}
                className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors ${
                  hasCycleOverride ? "bg-primary" : "bg-muted"
                }`}
              >
                <span
                  className={`pointer-events-none block h-5 w-5 rounded-full bg-background shadow-lg ring-0 transition-transform ${
                    hasCycleOverride ? "translate-x-5" : "translate-x-0"
                  }`}
                />
              </button>
              <div>
                <Label className="cursor-pointer">自定义周期</Label>
                <p className="text-xs text-muted-foreground">
                  默认继承账户的周期设置
                </p>
              </div>
            </div>

            {hasCycleOverride && cycleAnchor && (
              <div className="grid grid-cols-2 gap-3 pl-14">
                <Select
                  value={cycleAnchor.period}
                  onValueChange={handleCyclePeriodChange}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {PERIOD_OPTIONS.map((opt) => (
                      <SelectItem key={opt.value} value={opt.value}>
                        {opt.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <div className="flex items-center gap-2">
                  {cycleAnchor.period !== "monthly" && (
                    <Input
                      type="number"
                      min={1}
                      max={12}
                      value={anchorMonth}
                      onChange={(e) => handleAnchorMonthChange(e.target.value)}
                      className="w-20"
                      placeholder="月"
                    />
                  )}
                  <Input
                    type="number"
                    min={1}
                    max={31}
                    value={anchorDay}
                    onChange={(e) => handleAnchorDayChange(e.target.value)}
                    className="w-20"
                    placeholder="日"
                  />
                  <span className="text-sm text-muted-foreground">
                    {cycleAnchor.period === "monthly" ? "日" : "月/日"}
                  </span>
                </div>
              </div>
            )}
          </div>

          {/* Memo */}
          <div className="space-y-2">
            <Label htmlFor="benefit-memo">备注</Label>
            <Input
              id="benefit-memo"
              value={formInput.memo ?? ""}
              onChange={(e) => update({ memo: e.target.value || null })}
              placeholder="可选备注信息"
            />
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              取消
            </Button>
            <Button type="submit">{editing ? "保存" : "创建"}</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
