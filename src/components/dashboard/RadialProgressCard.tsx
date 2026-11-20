"use client";

import type { LucideIcon } from "@nocoo/basalt/icons";
import {
  ANIMATION_PROPS,
  ChartFrame,
  chartMuted,
  RESPONSIVE_CONTAINER_PROPS,
  seriesColor,
} from "@nocoo/basalt/components/chart";
import { LayerCard } from "@nocoo/basalt";
import {
  PolarAngleAxis,
  RadialBar,
  RadialBarChart,
  ResponsiveContainer,
} from "recharts";
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
  const percent = Math.min(100, Math.max(0, percentage));

  return (
    <LayerCard className={cn("h-full flex flex-col", className)}>
      <LayerCard.Header className="flex items-center gap-2">
        <HeaderIcon
          className="h-4 w-4 text-basalt-muted-foreground"
          strokeWidth={1.5}
        />
        <span className="text-sm font-normal text-basalt-muted-foreground">
          {title}
        </span>
      </LayerCard.Header>
      <LayerCard.Body className="flex-1 flex flex-col items-center justify-between">
        <div className="w-full flex-1 flex items-center justify-center min-h-[140px] max-h-[180px]">
          <div className="relative h-full w-full max-w-[200px]">
            <ChartFrame
              ariaLabel={`${title}: ${percentage}%`}
              className="h-full w-full"
              size="h-full w-full"
            >
              <ResponsiveContainer {...RESPONSIVE_CONTAINER_PROPS}>
                <RadialBarChart
                  cx="50%"
                  cy="50%"
                  innerRadius="75%"
                  outerRadius="95%"
                  startAngle={90}
                  endAngle={-270}
                  data={[{ value: percent }]}
                  barSize={12}
                >
                  <PolarAngleAxis
                    type="number"
                    domain={[0, 100]}
                    angleAxisId={0}
                    tick={false}
                  />
                  <RadialBar
                    dataKey="value"
                    cornerRadius={6}
                    fill={seriesColor(
                      fillColor
                        ? { key: "value", label: title, color: fillColor }
                        : undefined,
                      2,
                    )}
                    background={{ fill: chartMuted }}
                    {...ANIMATION_PROPS}
                  />
                </RadialBarChart>
              </ResponsiveContainer>
            </ChartFrame>
            <span className="pointer-events-none absolute inset-0 flex items-center justify-center text-basalt-base font-semibold text-basalt-foreground">
              {percentage}%
            </span>
          </div>
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
              <span className="text-sm font-medium text-basalt-foreground font-basalt-display tabular-nums">
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
