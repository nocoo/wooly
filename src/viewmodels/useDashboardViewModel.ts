// ViewModel for the Dashboard page.
// Composes model logic with data source — View consumes this hook only.

"use client";

import { useMemo } from "react";
import { sources, benefits, redemptions } from "@/data/mock";
import {
  computeStatCards,
  computeAlerts,
  computeOverallProgress,
  computeTopSources,
  computeMonthlyTrend,
} from "@/models/dashboard";
import type { StatCard, AlertItem, SourceSummary, MonthlyBar } from "@/models/dashboard";
import { defaultSettings } from "@/data/mock";
import { useToday } from "@/hooks/use-today";

export interface DashboardViewModelResult {
  stats: StatCard[];
  expiringAlerts: AlertItem[];
  overallUsage: { usedCount: number; totalCount: number; percentage: number };
  monthlyTrend: MonthlyBar[];
  topSources: SourceSummary[];
}

export function useDashboardViewModel(): DashboardViewModelResult {
  const today = useToday(defaultSettings.timezone);

  const activeSources = useMemo(
    () => sources.filter((s) => !s.archived),
    [],
  );

  const activeBenefits = useMemo(
    () => benefits.filter((b) => activeSources.some((s) => s.id === b.sourceId)),
    [activeSources],
  );

  const stats = useMemo(
    () => computeStatCards(activeSources, activeBenefits, redemptions, today),
    [activeSources, activeBenefits, today],
  );

  const expiringAlerts = useMemo(
    () => computeAlerts(activeSources, activeBenefits, redemptions, today),
    [activeSources, activeBenefits, today],
  );

  const overallUsage = useMemo(
    () => computeOverallProgress(activeSources, activeBenefits, redemptions, today),
    [activeSources, activeBenefits, today],
  );

  const monthlyTrend = useMemo(
    () => computeMonthlyTrend(redemptions, today),
    [today],
  );

  const topSources = useMemo(
    () => computeTopSources(activeSources, activeBenefits, redemptions, today),
    [activeSources, activeBenefits, today],
  );

  return {
    stats,
    expiringAlerts,
    overallUsage,
    monthlyTrend,
    topSources,
  };
}
