"use client";

import type { LucideIcon } from "lucide-react";
import {
  StatCard as BasaltStatCard,
  StatGrid as BasaltStatGrid,
} from "@nocoo/basalt/charts/stat-card";
import { cn } from "@/lib/utils";

export interface StatCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon?: LucideIcon;
  iconColor?: string;
  trend?: { value: number; label?: string };
  variant?: "primary" | "secondary";
  accentColor?: string;
  className?: string;
  style?: React.CSSProperties;
}

export function StatCardWidget({
  title,
  value,
  subtitle,
  icon: Icon,
  iconColor = "text-basalt-muted-foreground",
  trend,
  variant = "secondary",
  accentColor,
  className,
  style,
}: StatCardProps) {
  const isPrimary = variant === "primary";
  const showAccentBar = isPrimary || !!accentColor;
  const accentClass =
    accentColor ?? "bg-gradient-to-r from-basalt-primary to-basalt-chart-8";

  return (
    <div style={style} className={className}>
      <BasaltStatCard
        title={title}
        value={value}
        subtitle={subtitle}
        icon={Icon}
        iconColor={iconColor}
        trend={trend}
        className={cn(
          "h-full",
          isPrimary && "ring-1 ring-basalt-primary/30",
        )}
      >
        {showAccentBar && (
          <div className={cn("h-0.5 w-8 rounded-full -mt-1 mb-2", accentClass)} />
        )}
      </BasaltStatCard>
    </div>
  );
}

export interface StatGridProps {
  children: React.ReactNode;
  columns?: 2 | 3 | 4;
  className?: string;
}

export function StatGrid({ children, columns = 4, className }: StatGridProps) {
  return (
    <BasaltStatGrid columns={columns} className={className}>
      {children}
    </BasaltStatGrid>
  );
}
