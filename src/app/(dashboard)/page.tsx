"use client";

import {
  LayoutDashboard,
  AlertTriangle,
  TrendingUp,
  BarChart3,
  Star,
} from "lucide-react";
import { useDashboardViewModel } from "@/viewmodels/useDashboardViewModel";
import { StatCardWidget, StatGrid } from "@/components/dashboard/StatCardWidget";
import { RecentListCard } from "@/components/dashboard/RecentListCard";
import type { RecentListItem } from "@/components/dashboard/RecentListCard";
import { RadialProgressCard } from "@/components/dashboard/RadialProgressCard";
import { BarChartCard } from "@/components/dashboard/BarChartCard";
import type { BarChartDataItem } from "@/components/dashboard/BarChartCard";
import { ItemListCard } from "@/components/dashboard/ItemListCard";
import type { ListItem } from "@/components/dashboard/ItemListCard";
import { chart } from "@/lib/palette";

export default function DashboardPage() {
  const {
    stats,
    expiringAlerts,
    overallUsage,
    monthlyTrend,
    topSources,
  } = useDashboardViewModel();

  // Map StatCard[] → StatCardWidget props
  const statIcons = [LayoutDashboard, AlertTriangle, TrendingUp, BarChart3];

  // Map urgency level → Tailwind color class
  const urgencyColorClass = (urgency: "urgent" | "warning" | "normal") => {
    switch (urgency) {
      case "urgent": return "text-red-600";
      case "warning": return "text-amber-600";
      case "normal": return "text-muted-foreground";
    }
  };

  // Map AlertItem[] → RecentListItem[]
  const alertItems: RecentListItem[] = expiringAlerts.map((alert) => ({
    id: alert.id,
    label: alert.label,
    sublabel: alert.sourceName,
    icon: AlertTriangle,
    iconClassName: urgencyColorClass(alert.urgency),
    rightText: `${alert.daysUntil}天后`,
    rightClassName: urgencyColorClass(alert.urgency),
  }));

  // Map MonthlyBar[] → BarChartDataItem[]
  const trendData: BarChartDataItem[] = monthlyTrend.map((bar) => ({
    name: bar.month.slice(5), // "02" from "2026-02"
    value: bar.count,
  }));

  const totalTrend = monthlyTrend.reduce((sum, b) => sum + b.count, 0);

  // Map SourceSummary[] → ListItem[]
  const topSourceItems: ListItem[] = topSources.map((s) => {
    const pct = s.totalCount > 0
      ? Math.round((s.usedCount / s.totalCount) * 100)
      : 0;
    return {
      id: s.sourceId,
      label: s.sourceName,
      value: `${s.usedCount}/${s.totalCount}`,
      extra: `${pct}%`,
    };
  });

  return (
    <div className="space-y-4 md:space-y-6">
      {/* Row 1: StatGrid */}
      <StatGrid columns={4}>
        {stats.map((stat, i) => (
          <StatCardWidget
            key={stat.label}
            title={stat.label}
            value={stat.value}
            icon={statIcons[i]}
          />
        ))}
      </StatGrid>

      {/* Row 2: Expiring alerts + Overall usage (2:1) */}
      <div className="grid gap-4 md:gap-6 md:grid-cols-3">
        <div className="md:col-span-2">
          <RecentListCard
            title="即将过期提醒"
            icon={AlertTriangle}
            items={alertItems}
            emptyText="暂无过期提醒"
          />
        </div>
        <div className="md:col-span-1">
          <RadialProgressCard
            title="总体使用率"
            icon={TrendingUp}
            percentage={overallUsage.percentage}
            segments={[
              { label: "已用", value: String(overallUsage.usedCount) },
              { label: "总数", value: String(overallUsage.totalCount) },
              { label: "剩余", value: String(overallUsage.totalCount - overallUsage.usedCount) },
            ]}
            fillColor={chart.primary}
          />
        </div>
      </div>

      {/* Row 3: Monthly trend + Top sources (2:1) */}
      <div className="grid gap-4 md:gap-6 md:grid-cols-3">
        <div className="md:col-span-2">
          <BarChartCard
            title="月度核销趋势"
            icon={BarChart3}
            headline={String(totalTrend)}
            headlineLabel="总核销次数"
            data={trendData}
          />
        </div>
        <div className="md:col-span-1">
          <ItemListCard
            title="热门账户"
            icon={Star}
            items={topSourceItems}
            emptyText="暂无数据"
          />
        </div>
      </div>
    </div>
  );
}
