"use client";

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
    <div className={cn("flex flex-wrap gap-2", className)}>
      {options.map((opt) => {
        const isActive = opt.id === selectedId;
        return (
          <button
            key={opt.id ?? "__all__"}
            onClick={() => onSelect(opt.id)}
            className={cn(
              "inline-flex items-center rounded-full px-3 py-1.5 text-sm transition-colors cursor-pointer",
              isActive
                ? "bg-primary text-primary-foreground"
                : "bg-secondary text-muted-foreground hover:bg-secondary/80 hover:text-foreground",
            )}
          >
            {opt.label}
          </button>
        );
      })}
    </div>
  );
}
