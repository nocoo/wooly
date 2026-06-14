"use client";

import type { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

export interface StatCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon?: LucideIcon;
  iconColor?: string;
  trend?: { value: number; label?: string };
  /**
   * Visual weight:
   * - "secondary" (default): compact, no top accent
   * - "primary": larger value, gradient top accent bar — for headline metrics
   */
  variant?: "primary" | "secondary";
  /**
   * Override the top accent bar color. Pass any Tailwind background class
   * (e.g. "bg-chart-3" or "bg-gradient-to-r from-primary to-chart-8").
   * When omitted, primary variant gets a primary→chart-8 gradient and
   * secondary variant has no accent bar.
   */
  accentColor?: string;
  className?: string;
  style?: React.CSSProperties;
}

export function StatCardWidget({
  title,
  value,
  subtitle,
  icon: Icon,
  iconColor = "text-muted-foreground",
  trend,
  variant = "secondary",
  accentColor,
  className,
  style,
}: StatCardProps) {
  const isPositiveTrend = trend && trend.value > 0;
  const isNegativeTrend = trend && trend.value < 0;
  const isPrimary = variant === "primary";
  const showAccentBar = isPrimary || !!accentColor;
  const accentClass =
    accentColor ?? "bg-gradient-to-r from-primary to-chart-8";

  return (
    <div
      className={cn(
        "rounded-card bg-secondary",
        isPrimary ? "p-5 md:p-6" : "p-4 md:p-5",
        className,
      )}
      style={style}
    >
      {showAccentBar && (
        <div className={cn("h-0.5 w-8 rounded-full mb-4", accentClass)} />
      )}
      <div className="flex items-start justify-between">
        <div className="space-y-1">
          <p
            className={cn(
              "text-muted-foreground",
              isPrimary ? "text-xs md:text-sm font-medium" : "text-xs md:text-sm",
            )}
          >
            {title}
          </p>
          <p
            className={cn(
              "font-semibold text-foreground font-display tracking-tight tabular-nums",
              isPrimary ? "text-3xl md:text-4xl" : "text-xl md:text-2xl",
            )}
          >
            {typeof value === "number" ? value.toLocaleString() : value}
          </p>
          {subtitle && (
            <p className="text-xs text-muted-foreground">{subtitle}</p>
          )}
        </div>
        {Icon && (
          <div className={cn("rounded-md bg-background p-2", iconColor)}>
            <Icon
              className={cn(isPrimary ? "h-6 w-6" : "h-5 w-5")}
              strokeWidth={1.5}
            />
          </div>
        )}
      </div>
      {trend && (
        <div className="mt-3 flex items-center gap-1 text-xs">
          <span
            className={cn(
              "font-medium",
              isPositiveTrend && "text-success",
              isNegativeTrend && "text-destructive",
              !isPositiveTrend &&
                !isNegativeTrend &&
                "text-muted-foreground",
            )}
          >
            {isPositiveTrend && "+"}
            <span className="tabular-nums">{trend.value}%</span>
          </span>
          {trend.label && (
            <span className="text-muted-foreground">{trend.label}</span>
          )}
        </div>
      )}
    </div>
  );
}

export interface StatGridProps {
  children: React.ReactNode;
  columns?: 2 | 3 | 4;
  className?: string;
}

export function StatGrid({ children, columns = 4, className }: StatGridProps) {
  const gridCols = {
    2: "grid-cols-1 sm:grid-cols-2",
    3: "grid-cols-1 sm:grid-cols-2 lg:grid-cols-3",
    4: "grid-cols-1 sm:grid-cols-2 lg:grid-cols-4",
  };

  return (
    <div className={cn("grid gap-3 md:gap-4", gridCols[columns], className)}>
      {children}
    </div>
  );
}
