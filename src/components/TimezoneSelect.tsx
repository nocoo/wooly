"use client";

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@nocoo/basalt/components/select";
import { Field } from "@nocoo/basalt";

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
    <Select value={value} onValueChange={onValueChange}>
      <Field
        label="时区"
        hint="时区影响权益周期的日期判定。修改时区后，当前周期的剩余天数计算可能发生变化。"
      >
        <SelectTrigger className="w-full" aria-label="选择时区">
          <SelectValue placeholder="选择时区" />
        </SelectTrigger>
      </Field>
      <SelectContent>
        {options.map((opt) => (
          <SelectItem key={opt.value} value={opt.value}>
            <span className="flex items-center gap-2">
              <span className="text-xs font-mono text-basalt-muted-foreground w-12">
                {opt.offsetLabel}
              </span>
              <span>{opt.label}</span>
            </span>
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
