"use client";

import type { LucideIcon } from "lucide-react";
import { Gauge } from "@nocoo/basalt/charts/gauge";
import { LayerCard } from "@nocoo/basalt";
import { cn } from "@/lib/utils";

export interface RadialProgressCardProps {
  title: string;
  icon: LucideIcon;
  percentage: number;
  segments: { label: string; value: string }[];
  fillColor?: string;
  className?: string;
}

export function RadialProgressCard({
  title,
  icon: HeaderIcon,
  percentage,
  segments,
  fillColor,
  className,
}: RadialProgressCardProps) {
  return (
    <LayerCard className={cn("h-full flex flex-col", className)}>
      <LayerCard.Header className="flex items-center gap-2 pb-2">
        <HeaderIcon
          className="h-4 w-4 text-basalt-muted-foreground"
          strokeWidth={1.5}
        />
        <span className="text-sm font-normal text-basalt-muted-foreground">
          {title}
        </span>
      </LayerCard.Header>
      <LayerCard.Body className="flex-1 flex flex-col items-center justify-between pt-0">
        <div
          className="w-full flex-1 flex items-center justify-center min-h-[140px] max-h-[180px]"
          role="img"
          aria-label={`${title}: ${percentage}%`}
        >
          <Gauge
            value={percentage}
            max={100}
            series={
              fillColor
                ? [
                    {
                      key: "value",
                      label: title,
                      color: fillColor,
                    },
                  ]
                : undefined
            }
            ariaLabel={`${title}: ${percentage}%`}
            valueFormatter={(v) => `${v}%`}
            className="h-full w-full max-w-[200px]"
          />
        </div>
        <div
          className={cn(
            "mt-3 grid w-full gap-x-4 gap-y-3 pt-2 border-t border-basalt-border/50",
            segments.length === 2
              ? "grid-cols-2"
              : segments.length >= 3
                ? "grid-cols-3"
                : "grid-cols-1",
          )}
        >
          {segments.map((seg) => (
            <div
              key={seg.label}
              className="flex flex-col items-center gap-0.5"
            >
              <span className="text-sm font-medium text-basalt-foreground font-display tabular-nums">
                {seg.value}
              </span>
              <span className="text-xs text-basalt-muted-foreground">
                {seg.label}
              </span>
            </div>
          ))}
        </div>
      </LayerCard.Body>
    </LayerCard>
  );
}
