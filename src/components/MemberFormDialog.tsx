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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@nocoo/basalt/components/select";
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
          <Field
            label="名称"
            required
            error={getFieldError(errors, "name")}
          >
            <Input
              id="member-name"
              value={formInput.name}
              onChange={(e) => update({ name: e.target.value })}
              placeholder="例如：爸爸"
            />
          </Field>

          {/* Relationship */}
          <Select
            value={formInput.relationship}
            onValueChange={(v: string) => update({ relationship: v as MemberRelationship })}
          >
            <Field
              label="与户主关系"
              required
              error={getFieldError(errors, "relationship")}
            >
              <SelectTrigger aria-label="与户主关系">
                <SelectValue />
              </SelectTrigger>
            </Field>
            <SelectContent>
              {RELATIONSHIP_OPTIONS.map((opt) => (
                <SelectItem key={opt.value} value={opt.value}>
                  {opt.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          {/* Avatar emoji picker */}
          <div className="space-y-2">
            <span className="text-sm font-medium text-basalt-foreground">头像</span>
            <div className="flex flex-wrap gap-2">
              {AVATAR_OPTIONS.map((emoji) => (
                <Button
                  key={emoji}
                  type="button"
                  size="icon"
                  variant={formInput.avatar === emoji ? "default" : "secondary"}
                  onClick={() => update({ avatar: emoji })}
                  className="h-10 w-10 text-xl rounded-xl"
                >
                  {emoji}
                </Button>
              ))}
            </div>
            {formInput.avatar && (
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => update({ avatar: null })}
                className="text-xs text-basalt-muted-foreground hover:text-basalt-foreground p-0 h-auto"
              >
                清除头像
              </Button>
            )}
          </div>

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
