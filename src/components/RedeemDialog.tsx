"use client";

import { useState } from "react";
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
          <DialogDescription>
            确认使用以下权益
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-2">
          {/* Benefit info */}
          <div className="rounded-widget bg-secondary p-3 space-y-1">
            <p className="text-sm font-medium text-foreground">{benefitName}</p>
            <p className="text-xs text-muted-foreground">
              账户：{sourceName}
            </p>
            <p className="text-xs text-muted-foreground">
              类型：{typeLabels[benefitType]}（{statusLabel}）
            </p>
          </div>

          {/* Member selection */}
          <div className="space-y-2">
            <Label>使用人</Label>
            <div className="flex flex-wrap gap-2">
              {members.map((member) => (
                <button
                  key={member.id}
                  onClick={() => setSelectedMemberId(member.id)}
                  className={`inline-flex items-center rounded-full px-3 py-1.5 text-sm transition-colors cursor-pointer ${
                    selectedMemberId === member.id
                      ? "bg-primary text-primary-foreground"
                      : "bg-card text-muted-foreground hover:text-foreground"
                  }`}
                >
                  {member.name}
                </button>
              ))}
            </div>
          </div>

          {/* Memo */}
          <div className="space-y-2">
            <Label>备注（可选）</Label>
            <Input
              value={memo}
              onChange={(e) => setMemo(e.target.value)}
              placeholder="添加备注..."
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            取消
          </Button>
          <Button onClick={handleConfirm}>确认核销</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
