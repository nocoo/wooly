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
  CreateSourceInput,
  SourceCategory,
  ValidationError,
} from "@/models/types";
import { CHART_COLOR_LABELS, getCardGradient, getCardTextScheme, COLOR_SCHEME_COUNT } from "@/lib/palette";
import { cn } from "@/lib/utils";
import { Check } from "lucide-react";

export interface SourceFormMember {
  id: string;
  name: string;
}

export interface SourceFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  editing: boolean;
  formInput: CreateSourceInput;
  onFormInputChange: (input: CreateSourceInput) => void;
  errors: ValidationError[];
  members: SourceFormMember[];
  onSubmit: () => void;
}

const CATEGORY_OPTIONS: { value: SourceCategory; label: string }[] = [
  { value: "credit-card", label: "信用卡" },
  { value: "insurance", label: "保险" },
  { value: "membership", label: "会员" },
  { value: "telecom", label: "通信" },
  { value: "other", label: "其他" },
];

const CURRENCY_OPTIONS = [
  { value: "CNY", label: "CNY (人民币)" },
  { value: "USD", label: "USD (美元)" },
  { value: "EUR", label: "EUR (欧元)" },
  { value: "JPY", label: "JPY (日元)" },
  { value: "HKD", label: "HKD (港币)" },
  { value: "GBP", label: "GBP (英镑)" },
];

const PERIOD_OPTIONS = [
  { value: "monthly", label: "每月" },
  { value: "quarterly", label: "每季" },
  { value: "yearly", label: "每年" },
];

function getFieldError(errors: ValidationError[], field: string): string | undefined {
  return errors.find((e) => e.field === field)?.message;
}

export function SourceFormDialog({
  open,
  onOpenChange,
  editing,
  formInput,
  onFormInputChange,
  errors,
  members,
  onSubmit,
}: SourceFormDialogProps) {
  const update = (patch: Partial<CreateSourceInput>) => {
    onFormInputChange({ ...formInput, ...patch });
  };

  const anchorDay =
    typeof formInput.cycleAnchor.anchor === "number"
      ? formInput.cycleAnchor.anchor
      : formInput.cycleAnchor.anchor.day;

  const anchorMonth =
    typeof formInput.cycleAnchor.anchor === "object"
      ? formInput.cycleAnchor.anchor.month
      : 1;

  const handlePeriodChange = (period: string) => {
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
    const day = Math.max(1, Math.min(31, parseInt(value, 10) || 1));
    if (formInput.cycleAnchor.period === "monthly") {
      update({ cycleAnchor: { ...formInput.cycleAnchor, anchor: day } });
    } else {
      update({
        cycleAnchor: {
          ...formInput.cycleAnchor,
          anchor: { month: anchorMonth, day },
        },
      });
    }
  };

  const handleAnchorMonthChange = (value: string) => {
    const month = Math.max(1, Math.min(12, parseInt(value, 10) || 1));
    update({
      cycleAnchor: {
        ...formInput.cycleAnchor,
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
      <DialogContent className="sm:max-w-[500px] max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{editing ? "编辑账户" : "添加账户"}</DialogTitle>
          <DialogDescription>
            {editing ? "修改账户信息" : "添加一个新的权益账户"}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Name */}
          <div className="space-y-2">
            <Label htmlFor="source-name">名称 *</Label>
            <Input
              id="source-name"
              value={formInput.name}
              onChange={(e) => update({ name: e.target.value })}
              placeholder="例如：招行经典白金卡"
            />
            {getFieldError(errors, "name") && (
              <p className="text-xs text-destructive">{getFieldError(errors, "name")}</p>
            )}
          </div>

          {/* Member */}
          <div className="space-y-2">
            <Label>受益人 *</Label>
            <Select
              value={formInput.memberId}
              onValueChange={(v) => update({ memberId: v })}
            >
              <SelectTrigger>
                <SelectValue placeholder="选择受益人" />
              </SelectTrigger>
              <SelectContent>
                {members.map((m) => (
                  <SelectItem key={m.id} value={m.id}>
                    {m.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {getFieldError(errors, "memberId") && (
              <p className="text-xs text-destructive">{getFieldError(errors, "memberId")}</p>
            )}
          </div>

          {/* Category + Currency row */}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label>分类 *</Label>
              <Select
                value={formInput.category}
                onValueChange={(v) => update({ category: v as SourceCategory })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {CATEGORY_OPTIONS.map((opt) => (
                    <SelectItem key={opt.value} value={opt.value}>
                      {opt.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>币种</Label>
              <Select
                value={formInput.currency}
                onValueChange={(v) => update({ currency: v })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {CURRENCY_OPTIONS.map((opt) => (
                    <SelectItem key={opt.value} value={opt.value}>
                      {opt.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Website */}
          <div className="space-y-2">
            <Label htmlFor="source-website">网站</Label>
            <Input
              id="source-website"
              value={formInput.website ?? ""}
              onChange={(e) => update({ website: e.target.value || null })}
              placeholder="https://example.com"
            />
            <p className="text-xs text-muted-foreground">
              用于自动获取图标，请输入完整 URL
            </p>
          </div>

          {/* Phone */}
          <div className="space-y-2">
            <Label htmlFor="source-phone">服务热线</Label>
            <Input
              id="source-phone"
              value={formInput.phone ?? ""}
              onChange={(e) => update({ phone: e.target.value || null })}
              placeholder="例如：95555"
            />
          </div>

          {/* Cycle anchor */}
          <div className="space-y-2">
            <Label>周期设置 *</Label>
            <div className="grid grid-cols-2 gap-3">
              <Select
                value={formInput.cycleAnchor.period}
                onValueChange={handlePeriodChange}
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
                {formInput.cycleAnchor.period !== "monthly" && (
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
                  {formInput.cycleAnchor.period === "monthly" ? "日" : "月/日"}
                </span>
              </div>
            </div>
          </div>

          {/* Valid period */}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label htmlFor="source-valid-from">生效日期</Label>
              <Input
                id="source-valid-from"
                type="date"
                value={formInput.validFrom ?? ""}
                onChange={(e) => update({ validFrom: e.target.value || null })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="source-valid-until">到期日期</Label>
              <Input
                id="source-valid-until"
                type="date"
                value={formInput.validUntil ?? ""}
                onChange={(e) => update({ validUntil: e.target.value || null })}
              />
            </div>
          </div>

          {/* Memo */}
          <div className="space-y-2">
            <Label htmlFor="source-memo">备注</Label>
            <Input
              id="source-memo"
              value={formInput.memo ?? ""}
              onChange={(e) => update({ memo: e.target.value || null })}
              placeholder="可选备注信息"
            />
          </div>

          {/* Cost */}
          <div className="space-y-2">
            <Label htmlFor="source-cost">维护成本</Label>
            <Input
              id="source-cost"
              value={formInput.cost ?? ""}
              onChange={(e) => update({ cost: e.target.value || null })}
              placeholder="例如：¥3600/年、首年免年费"
            />
            {getFieldError(errors, "cost") && (
              <p className="text-xs text-destructive">{getFieldError(errors, "cost")}</p>
            )}
            <p className="text-xs text-muted-foreground">
              如年费、月费等维护成本描述，留空表示无成本
            </p>
          </div>

          {/* Card Number */}
          <div className="space-y-2">
            <Label htmlFor="source-card-number">卡号</Label>
            <Input
              id="source-card-number"
              value={formInput.cardNumber ?? ""}
              onChange={(e) => update({ cardNumber: e.target.value || null })}
              placeholder="例如：7689"
            />
            {getFieldError(errors, "cardNumber") && (
              <p className="text-xs text-destructive">{getFieldError(errors, "cardNumber")}</p>
            )}
            <p className="text-xs text-muted-foreground">
              卡号后四位或完整卡号，方便快速识别
            </p>
          </div>

          {/* Color Scheme */}
          <div className="space-y-2">
            <Label>卡面配色</Label>
            <div className="grid grid-cols-6 gap-1.5">
              {CHART_COLOR_LABELS.map((label, i) => {
                const index = i + 1;
                const isSelected = formInput.colorIndex === index;
                const textScheme = getCardTextScheme(index);
                const checkColor = textScheme ? textScheme.textPrimary : undefined;
                return (
                  <button
                    key={index}
                    type="button"
                    title={label}
                    className={cn(
                      "h-7 w-full rounded-md transition-all flex items-center justify-center",
                      "ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
                      isSelected && "ring-2 ring-ring ring-offset-2",
                    )}
                    style={{ background: getCardGradient(index) }}
                    onClick={() =>
                      update({ colorIndex: isSelected ? null : index })
                    }
                  >
                    {isSelected && (
                      <Check
                        className="h-3.5 w-3.5"
                        style={{ color: checkColor }}
                        strokeWidth={2.5}
                      />
                    )}
                    {!isSelected && textScheme && (
                      <span
                        className="h-1.5 w-1.5 rounded-full"
                        style={{ background: textScheme.textPrimary }}
                      />
                    )}
                  </button>
                );
              })}
            </div>
            {getFieldError(errors, "colorIndex") && (
              <p className="text-xs text-destructive">{getFieldError(errors, "colorIndex")}</p>
            )}
            <p className="text-xs text-muted-foreground">
              选择卡面背景颜色，不选则使用默认分类配色
            </p>
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
