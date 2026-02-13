"use client";

import { BarChart, Bar, XAxis, YAxis, ResponsiveContainer } from "recharts";
import type { LucideIcon } from "lucide-react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { chart, chartAxis } from "@/lib/palette";
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
  data,
  barColor = chart.primary,
  yAxisFormatter = (v: number) => String(v),
  className,
}: BarChartCardProps) {
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
        {headline && (
          <div className="flex items-baseline gap-3">
            <h2 className="text-3xl font-semibold text-foreground font-display tracking-tight">
              {headline}
            </h2>
            {headlineLabel && (
              <span className="text-sm text-muted-foreground">
                {headlineLabel}
              </span>
            )}
          </div>
        )}
      </CardHeader>
      <CardContent className="flex flex-col">
        <div
          className="flex-1 min-h-[200px]"
          role="img"
          aria-label={`${title} bar chart`}
        >
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={data} barCategoryGap="25%">
              <XAxis
                dataKey="name"
                tick={{ fill: chartAxis, fontSize: 12 }}
                axisLine={false}
                tickLine={false}
              />
              <YAxis
                tickFormatter={yAxisFormatter}
                tick={{ fill: chartAxis, fontSize: 12 }}
                axisLine={false}
                tickLine={false}
                width={35}
              />
              <Bar
                dataKey="value"
                fill={barColor}
                radius={[4, 4, 0, 0]}
              />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
}
