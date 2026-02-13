// ViewModel for the Tracker page.
// Composes model logic with data source — View consumes this hook only.

"use client";

import { useState, useMemo, useCallback } from "react";
import {
  sources as mockSources,
  benefits as mockBenefits,
  redemptions as mockRedemptions,
  members as mockMembers,
  defaultSettings,
} from "@/data/mock";
import type {
  Source,
  Benefit,
  Redemption,
  BenefitType,
} from "@/models/types";
import type { StatCard } from "@/models/dashboard";
import { computeBenefitCycleStatus } from "@/models/cycle";
import { addRedemption, removeRedemption } from "@/models/redemption";
import { useToday } from "@/hooks/use-today";

// ---------------------------------------------------------------------------
// ViewModel-local interfaces
// ---------------------------------------------------------------------------

export interface RedemptionLogItem {
  id: string;
  benefitName: string;
  sourceName: string;
  memberName: string;
  redeemedAt: string;
  memo: string | null;
}

export interface RedeemableBenefitItem {
  id: string;
  benefitName: string;
  sourceName: string;
  sourceId: string;
  sourceMemberId: string;
  type: BenefitType;
  statusLabel: string;
  progressPercent: number;
  daysUntilEnd: number;
  isExpiringSoon: boolean;
  isExhausted: boolean;
}

export interface TrackerViewModelResult {
  stats: StatCard[];
  recentRedemptions: RedemptionLogItem[];
  redeemableBenefits: RedeemableBenefitItem[];
  members: { id: string; name: string }[];
  redeem: (benefitId: string, memberId: string, memo?: string) => void;
  undoRedemption: (redemptionId: string) => void;
}

// ---------------------------------------------------------------------------
// Hook
// ---------------------------------------------------------------------------

export function useTrackerViewModel(): TrackerViewModelResult {
  const [redemptions, setRedemptions] = useState<Redemption[]>([...mockRedemptions]);

  const today = useToday(defaultSettings.timezone);

  // Lookup maps
  const sourceMap = useMemo(
    () => new Map<string, Source>(mockSources.map((s) => [s.id, s])),
    [],
  );
  const benefitMap = useMemo(
    () => new Map<string, Benefit>(mockBenefits.map((b) => [b.id, b])),
    [],
  );
  const memberMap = useMemo(
    () => new Map<string, string>(mockMembers.map((m) => [m.id, m.name])),
    [],
  );

  // Active (non-archived) source IDs
  const activeSourceIds = useMemo(
    () => new Set(mockSources.filter((s) => !s.archived).map((s) => s.id)),
    [],
  );

  // Active benefits (from non-archived sources)
  const activeBenefits = useMemo(
    () => mockBenefits.filter((b) => activeSourceIds.has(b.sourceId)),
    [activeSourceIds],
  );

  // ---------------------------------------------------------------------------
  // Stats: today / this week / this month
  // ---------------------------------------------------------------------------
  const stats: StatCard[] = useMemo(() => {
    // Parse today as local date
    const [y, m, d] = today.split("-").map(Number);
    const todayDate = new Date(y, m - 1, d);

    // Week boundaries: Monday to Sunday
    const dayOfWeek = todayDate.getDay(); // 0=Sun, 1=Mon, ...
    const mondayOffset = dayOfWeek === 0 ? -6 : 1 - dayOfWeek;
    const weekStart = new Date(y, m - 1, d + mondayOffset);
    const weekStartStr = formatLocalDate(weekStart);

    // Month start
    const monthStartStr = `${today.slice(0, 8)}01`;

    let todayCount = 0;
    let weekCount = 0;
    let monthCount = 0;

    for (const r of redemptions) {
      const rDate = r.redeemedAt.slice(0, 10);
      if (rDate === today) todayCount++;
      if (rDate >= weekStartStr && rDate <= today) weekCount++;
      if (rDate >= monthStartStr && rDate <= today) monthCount++;
    }

    return [
      { label: "今日核销", value: todayCount },
      { label: "本周核销", value: weekCount },
      { label: "本月核销", value: monthCount },
    ];
  }, [redemptions, today]);

  // ---------------------------------------------------------------------------
  // Recent redemptions (sorted desc by date)
  // ---------------------------------------------------------------------------
  const recentRedemptions: RedemptionLogItem[] = useMemo(() => {
    const sorted = [...redemptions].sort((a, b) =>
      b.redeemedAt.localeCompare(a.redeemedAt),
    );
    return sorted.map((r) => {
      const benefit = benefitMap.get(r.benefitId);
      const source = benefit ? sourceMap.get(benefit.sourceId) : undefined;
      return {
        id: r.id,
        benefitName: benefit?.name ?? "未知权益",
        sourceName: source?.name ?? "未知来源",
        memberName: memberMap.get(r.memberId) ?? "未知",
        redeemedAt: r.redeemedAt,
        memo: r.memo,
      };
    });
  }, [redemptions, benefitMap, sourceMap, memberMap]);

  // ---------------------------------------------------------------------------
  // Redeemable benefits (non-action, non-exhausted, non-archived)
  // ---------------------------------------------------------------------------
  const redeemableBenefits: RedeemableBenefitItem[] = useMemo(() => {
    const items: RedeemableBenefitItem[] = [];
    for (const benefit of activeBenefits) {
      if (benefit.type === "action") continue;

      const source = sourceMap.get(benefit.sourceId);
      if (!source) continue;

      const benefitRedemptions = redemptions.filter(
        (r) => r.benefitId === benefit.id,
      );
      const info = computeBenefitCycleStatus(
        benefit,
        source.cycleAnchor,
        benefitRedemptions,
        today,
      );

      if (info.status === "exhausted") continue;

      const statusLabel =
        benefit.type === "credit"
          ? "未使用"
          : `${info.usedCount}/${info.totalCount} 次`;

      const progressPercent =
        info.totalCount > 0
          ? Math.round((info.usedCount / info.totalCount) * 100)
          : 0;

      items.push({
        id: benefit.id,
        benefitName: benefit.name,
        sourceName: source.name,
        sourceId: source.id,
        sourceMemberId: source.memberId,
        type: benefit.type,
        statusLabel,
        progressPercent,
        daysUntilEnd: info.daysUntilEnd,
        isExpiringSoon: info.isExpiringSoon,
        isExhausted: false,
      });
    }
    return items;
  }, [activeBenefits, sourceMap, redemptions, today]);

  // ---------------------------------------------------------------------------
  // Actions
  // ---------------------------------------------------------------------------
  const redeem = useCallback(
    (benefitId: string, memberId: string, memo?: string) => {
      setRedemptions((prev) =>
        addRedemption(prev, {
          benefitId,
          memberId,
          redeemedAt: today,
          memo: memo ?? null,
        }),
      );
    },
    [today],
  );

  const undoRedemption = useCallback((redemptionId: string) => {
    setRedemptions((prev) => removeRedemption(prev, redemptionId));
  }, []);

  return {
    stats,
    recentRedemptions,
    redeemableBenefits,
    members: mockMembers.map((m) => ({ id: m.id, name: m.name })),
    redeem,
    undoRedemption,
  };
}

// ---------------------------------------------------------------------------
// Internal helper
// ---------------------------------------------------------------------------

function formatLocalDate(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}
