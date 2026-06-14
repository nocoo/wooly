"use client";

import { cn } from "@/lib/utils";

export interface SegmentedControlOption<T extends string> {
  value: T;
  label: string;
}

export interface SegmentedControlProps<T extends string> {
  options: readonly SegmentedControlOption<T>[];
  value: T;
  onChange: (next: T) => void;
  /** Optional extra classes on the outer container. */
  className?: string;
  /** A11y label — required for screen-reader users since the visual
   *  appearance has no inherent label. */
  ariaLabel: string;
}

/**
 * Horizontal mutually-exclusive option toggle. Reserved for ≤4 fixed
 * options where a "tab-like" affordance fits — e.g. a dashboard period
 * filter (本月/本季/全部). NOT a replacement for:
 *
 *  - dynamic pill filters (MemberFilterBar) — those are filters with
 *    variable count, not modes
 *  - vertical navigation (settings left rail) — different visual idiom
 *  - action buttons (tracker undo) — those are commands, not state toggles
 *
 * See docs/07-ui-design-audit.md §2.3.
 */
export function SegmentedControl<T extends string>({
  options,
  value,
  onChange,
  className,
  ariaLabel,
}: SegmentedControlProps<T>) {
  return (
    <div
      role="radiogroup"
      aria-label={ariaLabel}
      className={cn(
        "inline-flex items-center gap-1 rounded-lg bg-secondary p-1",
        className,
      )}
    >
      {options.map((opt) => {
        const active = opt.value === value;
        return (
          <button
            key={opt.value}
            type="button"
            role="radio"
            aria-checked={active}
            onClick={() => onChange(opt.value)}
            className={cn(
              "rounded-md px-3 py-1.5 text-xs font-medium transition-colors cursor-pointer",
              active
                ? "bg-card text-foreground shadow-sm"
                : "text-muted-foreground hover:text-foreground",
            )}
          >
            {opt.label}
          </button>
        );
      })}
    </div>
  );
}
