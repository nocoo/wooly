"use client";

import { useRef } from "react";
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
 * Keyboard model (WAI-ARIA radio group): ArrowLeft/Up moves to the
 * previous option, ArrowRight/Down moves to the next, Home jumps to the
 * first, End to the last; selection wraps. Tab moves into / out of the
 * group via roving tabIndex (only the active option is in the tab order).
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
  const buttonRef = useRef<Array<HTMLButtonElement | null>>([]);

  const moveTo = (index: number) => {
    const wrapped = ((index % options.length) + options.length) % options.length;
    const next = options[wrapped];
    if (!next) return;
    onChange(next.value);
    // Defer focus to the next tick so the re-render lands first.
    requestAnimationFrame(() => {
      buttonRef.current[wrapped]?.focus();
    });
  };

  const handleKeyDown =
    (currentIndex: number) =>
    (e: React.KeyboardEvent<HTMLButtonElement>) => {
      switch (e.key) {
        case "ArrowRight":
        case "ArrowDown":
          e.preventDefault();
          moveTo(currentIndex + 1);
          break;
        case "ArrowLeft":
        case "ArrowUp":
          e.preventDefault();
          moveTo(currentIndex - 1);
          break;
        case "Home":
          e.preventDefault();
          moveTo(0);
          break;
        case "End":
          e.preventDefault();
          moveTo(options.length - 1);
          break;
        default:
      }
    };

  return (
    <div
      role="radiogroup"
      aria-label={ariaLabel}
      className={cn(
        "inline-flex items-center gap-1 rounded-lg bg-secondary p-1",
        className,
      )}
    >
      {options.map((opt, i) => {
        const active = opt.value === value;
        return (
          <button
            key={opt.value}
            ref={(el) => {
              buttonRef.current[i] = el;
            }}
            type="button"
            role="radio"
            aria-checked={active}
            tabIndex={active ? 0 : -1}
            onClick={() => onChange(opt.value)}
            onKeyDown={handleKeyDown(i)}
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
