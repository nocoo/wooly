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
import type {
  CreateRedeemableInput,
  ValidationError,
} from "@/models/types";

export interface RedeemableFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  editing: boolean;
  formInput: CreateRedeemableInput;
  onFormInputChange: (input: CreateRedeemableInput) => void;
  errors: ValidationError[];
  onSubmit: () => void;
}

function getFieldError(errors: ValidationError[], field: string): string | undefined {
  return errors.find((e) => e.field === field)?.message;
}

export function RedeemableFormDialog({
  open,
  onOpenChange,
  editing,
  formInput,
  onFormInputChange,
  errors,
  onSubmit,
}: RedeemableFormDialogProps) {
  const update = (patch: Partial<CreateRedeemableInput>) => {
    onFormInputChange({ ...formInput, ...patch });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit();
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[400px]">
        <DialogHeader>
          <DialogTitle>{editing ? "编辑可兑换项" : "新增可兑换项"}</DialogTitle>
          <DialogDescription>
            {editing ? "修改可兑换项信息" : "添加一个可用积分兑换的项目"}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Name */}
          <div className="space-y-2">
            <Label htmlFor="redeemable-name">名称 *</Label>
            <Input
              id="redeemable-name"
              value={formInput.name}
              onChange={(e) => update({ name: e.target.value })}
              placeholder="例如：星巴克中杯拿铁"
            />
            {getFieldError(errors, "name") && (
              <p className="text-xs text-destructive">
                {getFieldError(errors, "name")}
              </p>
            )}
          </div>

          {/* Cost */}
          <div className="space-y-2">
            <Label htmlFor="redeemable-cost">所需积分 *</Label>
            <Input
              id="redeemable-cost"
              type="number"
              min={1}
              value={formInput.cost || ""}
              onChange={(e) =>
                update({
                  cost: e.target.value ? parseInt(e.target.value, 10) : 0,
                })
              }
              placeholder="例如：699"
            />
            {getFieldError(errors, "cost") && (
              <p className="text-xs text-destructive">
                {getFieldError(errors, "cost")}
              </p>
            )}
          </div>

          {/* Memo */}
          <div className="space-y-2">
            <Label htmlFor="redeemable-memo">备注</Label>
            <Input
              id="redeemable-memo"
              value={formInput.memo ?? ""}
              onChange={(e) => update({ memo: e.target.value || null })}
              placeholder="可选备注信息"
            />
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
            >
              取消
            </Button>
            <Button type="submit">{editing ? "保存" : "创建"}</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
