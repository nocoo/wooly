// ViewModel for the Source Detail page.
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
  CreateBenefitInput,
  ValidationError,
  SourceIconInfo,
} from "@/models/types";
import type { StatCard } from "@/models/dashboard";
import { resolveSourceIcon, isSourceExpired, isSourceExpiringSoon, extractDomain } from "@/models/source";
import { addBenefit, updateBenefit, removeBenefit, validateBenefitInput } from "@/models/benefit";
import { getBenefitStatusLabel, getBenefitStatusColorClass, computeUsageRatio } from "@/models/benefit";
import { addRedemption } from "@/models/redemption";
import { computeBenefitCycleStatus } from "@/models/cycle";
import { formatDateInTimezone, formatCycleLabel } from "@/models/format";

// ---------------------------------------------------------------------------
// ViewModel-local interfaces
// ---------------------------------------------------------------------------

export interface SourceHeader {
  id: string;
  name: string;
  memberName: string;
  categoryLabel: string;
  currency: string;
  icon: SourceIconInfo;
  phone: string | null;
  websiteDomain: string | null;
  validFromLabel: string | null;
  validUntilLabel: string | null;
  isExpired: boolean;
  isExpiringSoon: boolean;
  expiryWarning: string | null;
  overallUsagePercent: number;
  cycleLabel: string;
  archived: boolean;
}

export interface BenefitRow {
  id: string;
  name: string;
  type: BenefitType;
  statusLabel: string;
  statusColorClass: string;
  progressPercent: number;
  isExpiringSoon: boolean;
  expiryWarning: string | null;
  cycleLabel: string;
  shared: boolean;
}

export interface MemberUsageItem {
  memberId: string;
  memberName: string;
  count: number;
}

export interface SourceDetailViewModelResult {
  source: SourceHeader | null;
  stats: StatCard[];
  benefitRows: BenefitRow[];
  memberUsage: MemberUsageItem[];

  // Benefit CRUD
  benefitFormOpen: boolean;
  setBenefitFormOpen: (open: boolean) => void;
  editingBenefitId: string | null;
  benefitFormInput: CreateBenefitInput;
  setBenefitFormInput: (input: CreateBenefitInput) => void;
  benefitFormErrors: ValidationError[];
  handleCreateBenefit: () => void;
  handleUpdateBenefit: () => void;
  handleDeleteBenefit: (id: string) => void;
  startEditBenefit: (id: string) => void;

  // Redeem
  redeem: (benefitId: string, memberId: string, memo?: string) => void;
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const CATEGORY_LABELS: Record<string, string> = {
  "credit-card": "信用卡",
  insurance: "保险",
  membership: "会员",
  telecom: "通信",
  other: "其他",
};

function makeDefaultBenefitInput(sourceId: string): CreateBenefitInput {
  return {
    sourceId,
    name: "",
    type: "quota",
    quota: 1,
  };
}

// ---------------------------------------------------------------------------
// Hook
// ---------------------------------------------------------------------------

export function useSourceDetailViewModel(sourceId: string): SourceDetailViewModelResult {
  const [sources] = useState<Source[]>([...mockSources]);
  const [benefits, setBenefits] = useState<Benefit[]>([...mockBenefits]);
  const [redemptions, setRedemptions] = useState<Redemption[]>([...mockRedemptions]);

  const [benefitFormOpen, setBenefitFormOpen] = useState(false);
  const [editingBenefitId, setEditingBenefitId] = useState<string | null>(null);
  const [benefitFormInput, setBenefitFormInput] = useState<CreateBenefitInput>(
    makeDefaultBenefitInput(sourceId),
  );
  const [benefitFormErrors, setBenefitFormErrors] = useState<ValidationError[]>([]);

  const today = useMemo(
    () => formatDateInTimezone(new Date(), defaultSettings.timezone),
    [],
  );

  const memberMap = useMemo(
    () => new Map(mockMembers.map((m) => [m.id, m.name])),
    [],
  );

  // Find the source
  const rawSource = useMemo(
    () => sources.find((s) => s.id === sourceId) ?? null,
    [sources, sourceId],
  );

  // Filter benefits for this source
  const sourceBenefits = useMemo(
    () => benefits.filter((b) => b.sourceId === sourceId),
    [benefits, sourceId],
  );

  // Filter redemptions for benefits in this source
  const sourceBenefitIds = useMemo(
    () => new Set(sourceBenefits.map((b) => b.id)),
    [sourceBenefits],
  );
  const sourceRedemptions = useMemo(
    () => redemptions.filter((r) => sourceBenefitIds.has(r.benefitId)),
    [redemptions, sourceBenefitIds],
  );

  // Build source header
  const source: SourceHeader | null = useMemo(() => {
    if (!rawSource) return null;
    const icon = resolveSourceIcon(rawSource);
    const expired = isSourceExpired(rawSource, today);
    const expiringSoon = isSourceExpiringSoon(rawSource, today);
    const domain = rawSource.website ? extractDomain(rawSource.website) : null;

    // Overall usage
    let usedTotal = 0;
    let countTotal = 0;
    for (const benefit of sourceBenefits) {
      if (benefit.type === "action") continue;
      const info = computeBenefitCycleStatus(
        benefit,
        rawSource.cycleAnchor,
        [...redemptions],
        today,
      );
      usedTotal += info.usedCount;
      countTotal += info.totalCount;
    }

    let expiryWarning: string | null = null;
    if (expired) expiryWarning = "已过期";
    else if (expiringSoon && rawSource.validUntil) expiryWarning = `即将到期`;

    return {
      id: rawSource.id,
      name: rawSource.name,
      memberName: memberMap.get(rawSource.memberId) ?? "未知",
      categoryLabel: CATEGORY_LABELS[rawSource.category] ?? rawSource.category,
      currency: rawSource.currency,
      icon,
      phone: rawSource.phone,
      websiteDomain: domain,
      validFromLabel: rawSource.validFrom,
      validUntilLabel: rawSource.validUntil,
      isExpired: expired,
      isExpiringSoon: expiringSoon,
      expiryWarning,
      overallUsagePercent: countTotal > 0 ? Math.round((usedTotal / countTotal) * 100) : 0,
      cycleLabel: formatCycleLabel(rawSource.cycleAnchor),
      archived: rawSource.archived,
    };
  }, [rawSource, sourceBenefits, redemptions, today, memberMap]);

  // Stats
  const stats: StatCard[] = useMemo(() => {
    if (!rawSource) return [];
    let exhaustedCount = 0;
    let expiringSoonCount = 0;
    for (const benefit of sourceBenefits) {
      if (benefit.type === "action") continue;
      const info = computeBenefitCycleStatus(
        benefit,
        rawSource.cycleAnchor,
        [...redemptions],
        today,
      );
      if (info.status === "exhausted") exhaustedCount++;
      if (info.isExpiringSoon) expiringSoonCount++;
    }
    return [
      { label: "权益总数", value: sourceBenefits.length },
      { label: "已用完", value: exhaustedCount },
      { label: "即将过期", value: expiringSoonCount },
    ];
  }, [rawSource, sourceBenefits, redemptions, today]);

  // Benefit rows
  const benefitRows: BenefitRow[] = useMemo(() => {
    if (!rawSource) return [];
    return sourceBenefits.map((benefit) => {
      const info = computeBenefitCycleStatus(
        benefit,
        rawSource.cycleAnchor,
        [...redemptions],
        today,
      );
      const statusLabel = benefit.type === "action"
        ? "待办"
        : benefit.type === "credit"
          ? (info.status === "exhausted" ? "已使用" : "未使用")
          : `${info.usedCount}/${info.totalCount} 次`;
      const progressPercent = benefit.type === "action"
        ? 0
        : computeUsageRatio(info.usedCount, info.totalCount) * 100;
      const anchor = benefit.cycleAnchor ?? rawSource.cycleAnchor;
      const cycleLabel = formatCycleLabel(anchor);
      const isExpiring = info.isExpiringSoon && info.status !== "exhausted";
      const expiryWarning = isExpiring ? `${info.daysUntilEnd}天后过期` : null;

      return {
        id: benefit.id,
        name: benefit.name,
        type: benefit.type,
        statusLabel,
        statusColorClass: getBenefitStatusColorClass(info.status),
        progressPercent: Math.round(progressPercent),
        isExpiringSoon: isExpiring,
        expiryWarning,
        cycleLabel,
        shared: benefit.shared,
      };
    });
  }, [rawSource, sourceBenefits, redemptions, today]);

  // Member usage
  const memberUsage: MemberUsageItem[] = useMemo(() => {
    const countMap = new Map<string, number>();
    for (const r of sourceRedemptions) {
      countMap.set(r.memberId, (countMap.get(r.memberId) ?? 0) + 1);
    }
    return Array.from(countMap.entries()).map(([memberId, count]) => ({
      memberId,
      memberName: memberMap.get(memberId) ?? "未知",
      count,
    }));
  }, [sourceRedemptions, memberMap]);

  // Benefit CRUD
  const handleCreateBenefit = useCallback(() => {
    const errors = validateBenefitInput(benefitFormInput);
    if (errors.length > 0) {
      setBenefitFormErrors(errors);
      return;
    }
    setBenefits((prev) => addBenefit(prev, benefitFormInput));
    setBenefitFormInput(makeDefaultBenefitInput(sourceId));
    setBenefitFormErrors([]);
    setBenefitFormOpen(false);
  }, [benefitFormInput, sourceId]);

  const handleUpdateBenefit = useCallback(() => {
    if (!editingBenefitId) return;
    const errors = validateBenefitInput(benefitFormInput);
    if (errors.length > 0) {
      setBenefitFormErrors(errors);
      return;
    }
    setBenefits((prev) => updateBenefit(prev, editingBenefitId, benefitFormInput));
    setEditingBenefitId(null);
    setBenefitFormInput(makeDefaultBenefitInput(sourceId));
    setBenefitFormErrors([]);
    setBenefitFormOpen(false);
  }, [editingBenefitId, benefitFormInput, sourceId]);

  const handleDeleteBenefit = useCallback((id: string) => {
    setBenefits((prev) => removeBenefit(prev, id));
  }, []);

  const startEditBenefit = useCallback(
    (id: string) => {
      const benefit = benefits.find((b) => b.id === id);
      if (!benefit) return;
      setEditingBenefitId(id);
      setBenefitFormInput({
        sourceId: benefit.sourceId,
        name: benefit.name,
        type: benefit.type,
        quota: benefit.quota,
        creditAmount: benefit.creditAmount,
        shared: benefit.shared,
        cycleAnchor: benefit.cycleAnchor,
        memo: benefit.memo,
      });
      setBenefitFormErrors([]);
      setBenefitFormOpen(true);
    },
    [benefits],
  );

  // Redeem
  const redeem = useCallback(
    (benefitId: string, memberId: string, memo?: string) => {
      setRedemptions((prev) =>
        addRedemption(prev, {
          benefitId,
          memberId,
          redeemedAt: new Date().toISOString(),
          memo: memo ?? null,
        }),
      );
    },
    [],
  );

  return {
    source,
    stats,
    benefitRows,
    memberUsage,
    benefitFormOpen,
    setBenefitFormOpen,
    editingBenefitId,
    benefitFormInput,
    setBenefitFormInput,
    benefitFormErrors,
    handleCreateBenefit,
    handleUpdateBenefit,
    handleDeleteBenefit,
    startEditBenefit,
    redeem,
  };
}
