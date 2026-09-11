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
} from "@nocoo/basalt";
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
          <Field
            label="名称"
            required
            error={getFieldError(errors, "name")}
          >
            <Input
              id="redeemable-name"
              value={formInput.name}
              onChange={(e) => update({ name: e.target.value })}
              placeholder="例如：星巴克中杯拿铁"
            />
          </Field>

          {/* Cost */}
          <Field
            label="所需积分"
            required
            error={getFieldError(errors, "cost")}
          >
            <Input
              id="redeemable-cost"
              type="number"
              min={1}
              value={formInput.cost || ""}
              onChange={(e) => update({ cost: parseInt(e.target.value, 10) || 0 })}
              placeholder="例如：500"
            />
          </Field>

          {/* Memo */}
          <Field label="备注（可选）">
            <Input
              id="redeemable-memo"
              value={formInput.memo ?? ""}
              onChange={(e) => update({ memo: e.target.value || null })}
              placeholder="例如：限周末使用"
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
              {editing ? "保存" : "添加"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
