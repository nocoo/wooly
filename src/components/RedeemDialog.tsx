"use client";

import { useState } from "react";
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
  LayerCard,
} from "@nocoo/basalt";
import type { BenefitType } from "@/models/types";

export interface RedeemDialogMember {
  id: string;
  name: string;
}

export interface RedeemDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  benefitName: string;
  sourceName: string;
  benefitType: BenefitType;
  statusLabel: string;
  defaultMemberId: string;
  members: RedeemDialogMember[];
  onConfirm: (memberId: string, memo?: string) => void;
}

export function RedeemDialog({
  open,
  onOpenChange,
  benefitName,
  sourceName,
  benefitType,
  statusLabel,
  defaultMemberId,
  members,
  onConfirm,
}: RedeemDialogProps) {
  const [selectedMemberId, setSelectedMemberId] = useState(defaultMemberId);
  const [memo, setMemo] = useState("");

  const typeLabels: Record<BenefitType, string> = {
    quota: "次数型",
    credit: "额度型",
    action: "任务型",
  };

  const handleConfirm = () => {
    onConfirm(selectedMemberId, memo.trim() || undefined);
    setMemo("");
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>确认核销</DialogTitle>
          <DialogDescription>确认使用以下权益</DialogDescription>
        </DialogHeader>

        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleConfirm();
          }}
          className="space-y-4 py-2"
        >
          {/* Benefit info */}
          <LayerCard.Well className="p-3 rounded-basalt-card space-y-1">
            <p className="text-sm font-medium text-basalt-foreground">{benefitName}</p>
            <p className="text-xs text-basalt-muted-foreground">账户：{sourceName}</p>
            <p className="text-xs text-basalt-muted-foreground">
              类型：{typeLabels[benefitType]}（{statusLabel}）
            </p>
          </LayerCard.Well>

          {/* Member selection */}
          <div className="space-y-2">
            <span className="text-sm font-medium text-basalt-foreground">使用人</span>
            <div className="flex flex-wrap gap-2">
              {members.map((member) => (
                <Button
                  key={member.id}
                  type="button"
                  size="sm"
                  variant={selectedMemberId === member.id ? "default" : "secondary"}
                  onClick={() => setSelectedMemberId(member.id)}
                  className="rounded-full px-3 h-8 text-xs font-normal"
                >
                  {member.name}
                </Button>
              ))}
            </div>
          </div>

          {/* Memo */}
          <Field label="备注（可选）">
            <Input
              value={memo}
              onChange={(e) => setMemo(e.target.value)}
              placeholder="添加备注..."
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
            <Button type="submit">确认核销</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
