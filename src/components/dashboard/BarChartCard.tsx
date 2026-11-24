"use client";

import type { LucideIcon } from "@nocoo/basalt/icons";
import {
  ANIMATION_PROPS,
  BAR_RADIUS,
  CHART_PLOT_MARGIN,
  ChartFrame,
  cartesianAxisProps,
  chartTooltipProps,
  GRID_PROPS,
  RESPONSIVE_CONTAINER_PROPS,
  seriesColor,
} from "@nocoo/basalt/components/chart";
import { LayerCard } from "@nocoo/basalt";
import {
  Bar,
  CartesianGrid,
  BarChart as RechartsBar,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
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
          <HeaderIcon className="h-4 w-4 text-basalt-muted-foreground" strokeWidth={1.5} />
          <span className="text-sm font-normal text-basalt-muted-foreground">{title}</span>
        </div>
        {headline && (
          <div className="flex items-baseline gap-3">
            <h2 className="text-3xl font-semibold text-basalt-foreground font-basalt-display tracking-tight tabular-nums">
              {headline}
            </h2>
            {headlineLabel && (
              <span className="text-sm text-basalt-muted-foreground">{headlineLabel}</span>
            )}
          </div>
        )}
      </LayerCard.Header>
      <LayerCard.Body className="flex-1 flex flex-col min-h-[200px]">
        <div className="w-full flex-1">
          <ChartFrame
            ariaLabel={`${title} bar chart`}
            className="h-full w-full"
            size="h-full w-full"
          >
            <ResponsiveContainer {...RESPONSIVE_CONTAINER_PROPS}>
              <RechartsBar data={chartData} margin={CHART_PLOT_MARGIN}>
                <CartesianGrid {...GRID_PROPS} />
                <XAxis dataKey="x" {...cartesianAxisProps()} />
                <YAxis {...cartesianAxisProps()} tickFormatter={yAxisFormatter} />
                <Tooltip
                  {...chartTooltipProps({
                    formatter: yAxisFormatter,
                    cursor: "bar",
                  })}
                />
                <Bar
                  dataKey="count"
                  name={seriesLabel}
                  fill={seriesColor({ key: "count", label: seriesLabel, color: barColor }, 0)}
                  radius={BAR_RADIUS.vertical}
                  {...ANIMATION_PROPS}
                />
              </RechartsBar>
            </ResponsiveContainer>
          </ChartFrame>
        </div>
      </LayerCard.Body>
    </LayerCard>
  );
}
