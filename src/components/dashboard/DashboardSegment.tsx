import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

export interface DashboardSegmentProps {
  /** Section label — short noun phrase (e.g. "概览", "关注"). Chinese-safe. */
  title: string;
  /** Optional right-side slot (filters, period selector, etc.). */
  action?: ReactNode;
  children: ReactNode;
  className?: string;
}

/**
 * Section divider for dashboard-style pages.
 *
 * Layout differs from pew's original by being responsive-first:
 * - mobile: title row on its own line, action on a second line, no divider
 * - desktop (sm+): label + 1px divider + action laid out horizontally
 *
 * Chinese titles get tracking-[0.15em] in place of uppercase, which has
 * no effect on CJK glyphs.
 *
 * See docs/07-ui-design-audit.md §2.1.
 */
export function DashboardSegment({
  title,
  action,
  children,
  className,
}: DashboardSegmentProps) {
  return (
    <section className={cn("space-y-3 md:space-y-4", className)}>
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:gap-3">
        <h2 className="shrink-0 text-xs font-medium uppercase tracking-[0.15em] text-muted-foreground">
          {title}
        </h2>
        <div className="hidden sm:block h-px flex-1 bg-border/60" />
        {action && <div className="sm:shrink-0">{action}</div>}
      </div>
      {children}
    </section>
  );
}
