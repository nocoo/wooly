"use client";

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";

export interface TimezoneOption {
  value: string;
  label: string;
  offsetLabel: string;
}

export interface TimezoneSelectProps {
  value: string;
  onValueChange: (value: string) => void;
  options: TimezoneOption[];
}

export function TimezoneSelect({
  value,
  onValueChange,
  options,
}: TimezoneSelectProps) {
  return (
    <div className="space-y-3">
      <div className="space-y-1">
        <Label>时区</Label>
        <p className="text-xs text-muted-foreground">
          时区影响权益周期的日期判定。修改时区后，当前周期的剩余天数计算可能发生变化。
        </p>
      </div>
      <Select value={value} onValueChange={onValueChange}>
        <SelectTrigger className="w-full">
          <SelectValue placeholder="选择时区" />
        </SelectTrigger>
        <SelectContent>
          {options.map((opt) => (
            <SelectItem key={opt.value} value={opt.value}>
              <span className="flex items-center gap-2">
                <span className="text-xs font-mono text-muted-foreground w-12">
                  {opt.offsetLabel}
                </span>
                <span>{opt.label}</span>
              </span>
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}
