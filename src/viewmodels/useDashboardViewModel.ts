// ViewModel for the Dashboard page.
// Composes model logic with data source — View consumes this hook only.

"use client";

import { useMemo } from "react";
import { useDataset } from "@/hooks/use-dataset";
import {
  computeStatCards,
  computeAlerts,
  computeOverallProgress,
  computeTopSources,
  computeMonthlyTrend,
} from "@/models/dashboard";
import type { StatCard, AlertItem, SourceSummary, MonthlyBar } from "@/models/dashboard";
import { useToday } from "@/hooks/use-today";

export interface DashboardViewModelResult {
  loading: boolean;
  stats: StatCard[];
  expiringAlerts: AlertItem[];
  overallUsage: { usedCount: number; totalCount: number; percentage: number };
  monthlyTrend: MonthlyBar[];
  topSources: SourceSummary[];
}

const EMPTY_RESULT: DashboardViewModelResult = {
  loading: true,
  stats: [],
  expiringAlerts: [],
  overallUsage: { usedCount: 0, totalCount: 0, percentage: 0 },
  monthlyTrend: [],
  topSources: [],
};

export function useDashboardViewModel(): DashboardViewModelResult {
  const { dataset, loading } = useDataset();

  const timezone = dataset?.defaultSettings.timezone ?? "Asia/Shanghai";
  const today = useToday(timezone);

  const sources = useMemo(() => dataset?.sources ?? [], [dataset]);
  const benefits = useMemo(() => dataset?.benefits ?? [], [dataset]);
  const redemptions = useMemo(() => dataset?.redemptions ?? [], [dataset]);

  const activeSources = useMemo(
    () => sources.filter((s) => !s.archived),
    [sources],
  );

  const activeBenefits = useMemo(
    () => benefits.filter((b) => activeSources.some((s) => s.id === b.sourceId)),
    [activeSources, benefits],
  );

  const stats = useMemo(
    () => computeStatCards(activeSources, activeBenefits, redemptions, today),
    [activeSources, activeBenefits, redemptions, today],
  );

  const expiringAlerts = useMemo(
    () => computeAlerts(activeSources, activeBenefits, redemptions, today),
    [activeSources, activeBenefits, redemptions, today],
  );

  const overallUsage = useMemo(
    () => computeOverallProgress(activeSources, activeBenefits, redemptions, today),
    [activeSources, activeBenefits, redemptions, today],
  );

  const monthlyTrend = useMemo(
    () => computeMonthlyTrend(redemptions, today),
    [redemptions, today],
  );

  const topSources = useMemo(
    () => computeTopSources(activeSources, activeBenefits, redemptions, today),
    [activeSources, activeBenefits, redemptions, today],
  );

  if (loading || !dataset) return EMPTY_RESULT;

  return {
    loading: false,
    stats,
    expiringAlerts,
    overallUsage,
    monthlyTrend,
    topSources,
  };
}
