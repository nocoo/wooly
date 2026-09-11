"use client";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogFooter,
  DialogTitle,
  DialogDescription,
  Button,
  Input,
  Field,
  Switch,
} from "@nocoo/basalt";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@nocoo/basalt/components/select";
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
  const cycleAnchor = formInput.cycleAnchor;

  const anchorDay =
    cycleAnchor && typeof cycleAnchor.anchor === "number"
      ? cycleAnchor.anchor
      : cycleAnchor && typeof cycleAnchor.anchor === "object"
        ? cycleAnchor.anchor.day
        : 1;

  const anchorMonth =
    cycleAnchor && typeof cycleAnchor.anchor === "object"
      ? cycleAnchor.anchor.month
      : 1;

  const toggleCycleOverride = (checked: boolean) => {
    if (checked) {
      update({
        cycleAnchor: { period: "yearly", anchor: { month: 1, day: 1 } },
      });
    } else {
      update({ cycleAnchor: null });
    }
  };

  const handleCyclePeriodChange = (period: string) => {
    const p = period as "monthly" | "quarterly" | "yearly";
    if (p === "monthly") {
      update({ cycleAnchor: { period: p, anchor: anchorDay } });
    } else {
      update({
        cycleAnchor: { period: p, anchor: { month: anchorMonth, day: anchorDay } },
      });
    }
  };

  const handleAnchorDayChange = (val: string) => {
    const d = Math.max(1, Math.min(31, parseInt(val, 10) || 1));
    if (cycleAnchor?.period === "monthly") {
      update({ cycleAnchor: { ...cycleAnchor, anchor: d } });
    } else if (cycleAnchor) {
      update({
        cycleAnchor: {
          ...cycleAnchor,
          anchor: { month: anchorMonth, day: d },
        },
      });
    }
  };

  const handleAnchorMonthChange = (val: string) => {
    const m = Math.max(1, Math.min(12, parseInt(val, 10) || 1));
    if (cycleAnchor && cycleAnchor.period !== "monthly") {
      update({
        cycleAnchor: {
          ...cycleAnchor,
          anchor: { month: m, day: anchorDay },
        },
      });
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit();
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[480px]">
        <DialogHeader>
          <DialogTitle>{editing ? "编辑权益" : "添加权益"}</DialogTitle>
          <DialogDescription>
            {editing ? "修改权益信息与周期规则" : "为此账户添加一项新权益"}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Name */}
          <Field
            label="权益名称"
            required
            error={getFieldError(errors, "name")}
          >
            <Input
              id="benefit-name"
              value={formInput.name}
              onChange={(e) => update({ name: e.target.value })}
              placeholder="例如：机场贵宾厅"
            />
          </Field>

          {/* Type selection */}
          <div className="space-y-2">
            <span className="text-sm font-medium text-basalt-foreground">权益类型 *</span>
            <div className="grid grid-cols-3 gap-2">
              {TYPE_OPTIONS.map((opt) => (
                <Button
                  key={opt.value}
                  type="button"
                  variant={formInput.type === opt.value ? "default" : "secondary"}
                  onClick={() => handleTypeChange(opt.value)}
                  className="flex flex-col items-center justify-center p-3 h-auto min-h-[64px]"
                >
                  <span className="text-sm font-medium">{opt.label}</span>
                  <span className="text-[10px] text-basalt-muted-foreground mt-0.5 line-clamp-1">
                    {opt.description}
                  </span>
                </Button>
              ))}
            </div>
            {getFieldError(errors, "type") && (
              <p className="text-xs text-basalt-destructive">
                {getFieldError(errors, "type")}
              </p>
            )}
          </div>

          {/* Quota amount (for quota type) */}
          {formInput.type === "quota" && (
            <Field
              label="每周期次数"
              required
              error={getFieldError(errors, "quota")}
            >
              <Input
                id="benefit-quota"
                type="number"
                min={1}
                value={formInput.quota ?? ""}
                onChange={(e) =>
                  update({
                    quota: e.target.value ? parseInt(e.target.value, 10) : null,
                  })
                }
                placeholder="例如：6"
              />
            </Field>
          )}

          {/* Credit amount (for credit type) */}
          {formInput.type === "credit" && (
            <Field
              label="每周期额度"
              required
              error={getFieldError(errors, "creditAmount")}
            >
              <Input
                id="benefit-credit"
                type="number"
                min={0}
                step="any"
                value={formInput.creditAmount ?? ""}
                onChange={(e) =>
                  update({
                    creditAmount: e.target.value ? parseFloat(e.target.value) : null,
                  })
                }
                placeholder="例如：200"
              />
            </Field>
          )}

          {/* Shared toggle */}
          <div className="flex items-center justify-between py-1">
            <div>
              <span className="text-sm font-medium text-basalt-foreground">全家共享</span>
              <p className="text-xs text-basalt-muted-foreground">
                开启后，所有受益人均可使用此权益
              </p>
            </div>
            <Switch
              checked={formInput.shared ?? false}
              onCheckedChange={(checked) => update({ shared: checked })}
            />
          </div>

          {/* Cycle override toggle */}
          <div className="space-y-2">
            <div className="flex items-center justify-between py-1">
              <div>
                <span className="text-sm font-medium text-basalt-foreground">自定义周期</span>
                <p className="text-xs text-basalt-muted-foreground">
                  默认继承账户的周期设置
                </p>
              </div>
              <Switch
                checked={hasCycleOverride}
                onCheckedChange={toggleCycleOverride}
              />
            </div>

            {hasCycleOverride && cycleAnchor && (
              <div className="grid grid-cols-2 gap-3 pt-2">
                <Select
                  value={cycleAnchor.period}
                  onValueChange={handleCyclePeriodChange}
                >
                  <SelectTrigger aria-label="自定义周期类型">
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
                  <span className="text-sm text-basalt-muted-foreground">
                    {cycleAnchor.period === "monthly" ? "日" : "月/日"}
                  </span>
                </div>
              </div>
            )}
          </div>

          {/* Memo */}
          <Field label="备注（可选）">
            <Input
              id="benefit-memo"
              value={formInput.memo ?? ""}
              onChange={(e) => update({ memo: e.target.value || null })}
              placeholder="可选备注信息"
            />
          </Field>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
            >
              取消
            </Button>
            <Button type="submit">
              {editing ? "保存" : "创建"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
