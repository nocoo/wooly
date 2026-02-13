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
  CreateMemberInput,
  MemberRelationship,
  ValidationError,
} from "@/models/types";

export interface MemberFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  editing: boolean;
  formInput: CreateMemberInput;
  onFormInputChange: (input: CreateMemberInput) => void;
  errors: ValidationError[];
  onSubmit: () => void;
}

const RELATIONSHIP_OPTIONS: { value: MemberRelationship; label: string }[] = [
  { value: "self", label: "本人" },
  { value: "spouse", label: "配偶" },
  { value: "parent", label: "父母" },
  { value: "child", label: "子女" },
  { value: "sibling", label: "兄弟姐妹" },
  { value: "other", label: "其他" },
];

const AVATAR_OPTIONS = [
  "👨", "👩", "👴", "👵", "👦", "👧", "👶", "🧑",
  "👨‍💼", "👩‍💼", "🧓", "👱", "🤵", "👰", "🦸", "🧙",
];

function getFieldError(errors: ValidationError[], field: string): string | undefined {
  return errors.find((e) => e.field === field)?.message;
}

export function MemberFormDialog({
  open,
  onOpenChange,
  editing,
  formInput,
  onFormInputChange,
  errors,
  onSubmit,
}: MemberFormDialogProps) {
  const update = (patch: Partial<CreateMemberInput>) => {
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
          <DialogTitle>{editing ? "编辑受益人" : "添加受益人"}</DialogTitle>
          <DialogDescription>
            {editing ? "修改受益人信息" : "添加一位家庭受益人"}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Name */}
          <div className="space-y-2">
            <Label htmlFor="member-name">名称 *</Label>
            <Input
              id="member-name"
              value={formInput.name}
              onChange={(e) => update({ name: e.target.value })}
              placeholder="例如：爸爸"
            />
            {getFieldError(errors, "name") && (
              <p className="text-xs text-destructive">{getFieldError(errors, "name")}</p>
            )}
          </div>

          {/* Relationship */}
          <div className="space-y-2">
            <Label>与户主关系 *</Label>
            <Select
              value={formInput.relationship}
              onValueChange={(v) => update({ relationship: v as MemberRelationship })}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {RELATIONSHIP_OPTIONS.map((opt) => (
                  <SelectItem key={opt.value} value={opt.value}>
                    {opt.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {getFieldError(errors, "relationship") && (
              <p className="text-xs text-destructive">
                {getFieldError(errors, "relationship")}
              </p>
            )}
          </div>

          {/* Avatar emoji picker */}
          <div className="space-y-2">
            <Label>头像</Label>
            <div className="flex flex-wrap gap-2">
              {AVATAR_OPTIONS.map((emoji) => (
                <button
                  key={emoji}
                  type="button"
                  onClick={() => update({ avatar: emoji })}
                  className={`flex h-10 w-10 items-center justify-center rounded-widget text-xl transition-colors cursor-pointer ${
                    formInput.avatar === emoji
                      ? "bg-primary text-primary-foreground ring-2 ring-primary ring-offset-2 ring-offset-background"
                      : "bg-card hover:bg-secondary"
                  }`}
                >
                  {emoji}
                </button>
              ))}
            </div>
            {formInput.avatar && (
              <button
                type="button"
                onClick={() => update({ avatar: null })}
                className="text-xs text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
              >
                清除头像
              </button>
            )}
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
