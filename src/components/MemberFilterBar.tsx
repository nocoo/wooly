"use client";

import { Button } from "@nocoo/basalt";
import { cn } from "@/lib/utils";

export interface MemberFilterOption {
  id: string | null;
  label: string;
}

export interface MemberFilterBarProps {
  members: MemberFilterOption[];
  selectedId: string | null;
  onSelect: (id: string | null) => void;
  className?: string;
}

export function MemberFilterBar({
  members,
  selectedId,
  onSelect,
  className,
}: MemberFilterBarProps) {
  const options: MemberFilterOption[] = [
    { id: null, label: "全部" },
    ...members,
  ];

  return (
    <div className={cn("flex flex-wrap gap-1.5", className)}>
      {options.map((opt) => {
        const isActive = opt.id === selectedId;
        return (
          <Button
            key={opt.id ?? "__all__"}
            size="sm"
            variant={isActive ? "default" : "secondary"}
            onClick={() => onSelect(opt.id)}
            className="rounded-full px-3 h-8 text-xs font-normal"
          >
            {opt.label}
          </Button>
        );
      })}
    </div>
  );
}
