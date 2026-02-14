"use client";

import { Database, FlaskConical } from "lucide-react";
import { useDataMode, setDataMode } from "@/hooks/use-data-mode";
import type { DataMode } from "@/hooks/use-data-mode";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";

const MODE_OPTIONS: { value: DataMode; label: string; description: string }[] = [
  { value: "production", label: "生产数据库", description: "空白数据，从零开始" },
  { value: "test", label: "测试数据库", description: "示例数据，用于演示" },
];

const ICON_PROPS = { className: "h-4 w-4", "aria-hidden": true as const, strokeWidth: 1.5 };

export function DataModeToggle() {
  const dataMode = useDataMode();

  const handleValueChange = (value: string) => {
    if (value === "production" || value === "test") {
      setDataMode(value);
      // Force full page remount by reloading — simplest way to reset all VM state.
      // The DashboardLayout key-based approach handles this without reload,
      // but we call setDataMode first so the new value is persisted.
    }
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button
          className="flex h-8 w-8 items-center justify-center rounded-lg text-muted-foreground hover:text-foreground hover:bg-accent transition-colors"
          aria-label={`数据模式: ${dataMode === "production" ? "生产" : "测试"}`}
        >
          {dataMode === "production" ? (
            <Database {...ICON_PROPS} />
          ) : (
            <FlaskConical {...ICON_PROPS} />
          )}
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-48">
        <DropdownMenuLabel>数据模式</DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuRadioGroup value={dataMode} onValueChange={handleValueChange}>
          {MODE_OPTIONS.map((opt) => (
            <DropdownMenuRadioItem key={opt.value} value={opt.value} className="flex flex-col items-start gap-0.5 py-2">
              <span className="text-sm font-medium">{opt.label}</span>
              <span className="text-xs text-muted-foreground">{opt.description}</span>
            </DropdownMenuRadioItem>
          ))}
        </DropdownMenuRadioGroup>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
