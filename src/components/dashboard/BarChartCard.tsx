"use client";

import type { LucideIcon } from "lucide-react";
import { BarChart as BasaltBarChart } from "@nocoo/basalt/charts/bar";
import { LayerCard } from "@nocoo/basalt";
import { cn } from "@/lib/utils";

export interface BarChartDataItem {
  name: string;
  value: number;
}

export interface BarChartCardProps {
  title: string;
  icon: LucideIcon;
  headline?: string;
  headlineLabel?: string;
  seriesLabel?: string;
  data: BarChartDataItem[];
  barColor?: string;
  yAxisFormatter?: (value: number) => string;
  className?: string;
}

export function BarChartCard({
  title,
  icon: HeaderIcon,
  headline,
  headlineLabel,
  seriesLabel = "核销次数",
  data,
  barColor,
  yAxisFormatter = (v: number) => String(v),
  className,
}: BarChartCardProps) {
  // Map BarChartDataItem[] { name, value } to XYPoint format { x, y }
  const chartData = data.map((d) => ({
    x: d.name,
    count: d.value,
  }));

  return (
    <LayerCard className={cn("h-full flex flex-col", className)}>
      <LayerCard.Header className="flex flex-col gap-1">
        <div className="flex items-center gap-2">
          <HeaderIcon
            className="h-4 w-4 text-basalt-muted-foreground"
            strokeWidth={1.5}
          />
          <span className="text-sm font-normal text-basalt-muted-foreground">
            {title}
          </span>
        </div>
        {headline && (
          <div className="flex items-baseline gap-3">
            <h2 className="text-3xl font-semibold text-basalt-foreground font-display tracking-tight tabular-nums">
              {headline}
            </h2>
            {headlineLabel && (
              <span className="text-sm text-basalt-muted-foreground">
                {headlineLabel}
              </span>
            )}
          </div>
        )}
      </LayerCard.Header>
      <LayerCard.Body className="flex-1 flex flex-col min-h-[200px]">
        <div className="w-full flex-1">
          <BasaltBarChart
            data={chartData}
            series={[
              {
                key: "count",
                label: seriesLabel,
                color: barColor,
              },
            ]}
            showAxes
            showLegend={false}
            valueFormatter={yAxisFormatter}
            ariaLabel={`${title} bar chart`}
            className="h-full w-full"
          />
        </div>
      </LayerCard.Body>
    </LayerCard>
  );
}
