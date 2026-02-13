"use client";

import { RadialBarChart, RadialBar, ResponsiveContainer } from "recharts";
import type { LucideIcon } from "lucide-react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { chart } from "@/lib/palette";
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
  fillColor = chart.teal,
  className,
}: RadialProgressCardProps) {
  const data = [
    { name: "bg", value: 100, fill: chart.gray },
    { name: "progress", value: percentage, fill: fillColor },
  ];

  return (
    <Card
      className={cn(
        "h-full rounded-card border-0 bg-secondary shadow-none",
        className,
      )}
    >
      <CardHeader>
        <div className="flex items-center gap-2">
          <HeaderIcon
            className="h-4 w-4 text-muted-foreground"
            strokeWidth={1.5}
          />
          <CardTitle className="text-sm font-normal text-muted-foreground">
            {title}
          </CardTitle>
        </div>
      </CardHeader>
      <CardContent className="flex flex-col">
        <div className="flex flex-1 flex-col items-center min-h-0">
          <div
            className="flex-1 min-h-0 w-full flex items-center justify-center"
            role="img"
            aria-label={`${title}: ${percentage}%`}
          >
            <div className="relative aspect-square h-full max-h-[180px] min-h-[100px]">
              <ResponsiveContainer width="100%" height="100%">
                <RadialBarChart
                  cx="50%"
                  cy="50%"
                  innerRadius="70%"
                  outerRadius="90%"
                  startAngle={90}
                  endAngle={-270}
                  data={data}
                  barSize={10}
                >
                  <RadialBar
                    dataKey="value"
                    cornerRadius={5}
                    background={false}
                  />
                </RadialBarChart>
              </ResponsiveContainer>
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span className="text-xl font-semibold text-foreground font-display tracking-tight">
                  {percentage}%
                </span>
              </div>
            </div>
          </div>
          <div
            className={cn(
              "mt-3 grid w-full gap-x-4 gap-y-3",
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
                <span className="text-sm font-medium text-foreground font-display">
                  {seg.value}
                </span>
                <span className="text-xs text-muted-foreground">
                  {seg.label}
                </span>
              </div>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
