// ViewModel for the Source Detail page.
// Composes model logic with data source — View consumes this hook only.

"use client";

import { useState, useMemo, useCallback } from "react";
import { getDataset } from "@/data/datasets";
import { getStoredDataMode } from "@/hooks/use-data-mode";
import type {
  Source,
  Benefit,
  Redemption,
  BenefitType,
  BenefitCycleStatus,
  CreateBenefitInput,
  ValidationError,
  SourceIconInfo,
} from "@/models/types";
import type { StatCard } from "@/models/dashboard";
import { resolveSourceIcon, isSourceExpired, isSourceExpiringSoon, extractDomain } from "@/models/source";
import { addBenefit, updateBenefit, removeBenefit, validateBenefitInput } from "@/models/benefit";
import { getBenefitStatusSeverity, computeUsageRatio } from "@/models/benefit";
import type { BenefitStatusSeverity } from "@/models/benefit";
import { addRedemption } from "@/models/redemption";
import { computeBenefitCycleStatus } from "@/models/cycle";
import { formatCycleLabel } from "@/models/format";
import { useToday } from "@/hooks/use-today";

// ---------------------------------------------------------------------------
// ViewModel-local interfaces
// ---------------------------------------------------------------------------

export interface SourceHeader {
  id: string;
  name: string;
  memberId: string;
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
  status: BenefitCycleStatus;
  statusLabel: string;
  statusSeverity: BenefitStatusSeverity;
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
  members: { id: string; name: string }[];

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
  const dataset = useMemo(() => getDataset(getStoredDataMode()), []);

  const [sources] = useState<Source[]>(dataset.sources);
  const [benefits, setBenefits] = useState<Benefit[]>(dataset.benefits);
  const [redemptions, setRedemptions] = useState<Redemption[]>(dataset.redemptions);

  const [benefitFormOpen, setBenefitFormOpen] = useState(false);
  const [editingBenefitId, setEditingBenefitId] = useState<string | null>(null);
  const [benefitFormInput, setBenefitFormInput] = useState<CreateBenefitInput>(
    makeDefaultBenefitInput(sourceId),
  );
  const [benefitFormErrors, setBenefitFormErrors] = useState<ValidationError[]>([]);

  const today = useToday(dataset.defaultSettings.timezone);

  const memberMap = useMemo(
    () => new Map(dataset.members.map((m) => [m.id, m.name])),
    [dataset.members],
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
      const benefitRedemptions = redemptions.filter(
        (r) => r.benefitId === benefit.id,
      );
      const info = computeBenefitCycleStatus(
        benefit,
        rawSource.cycleAnchor,
        benefitRedemptions,
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
      memberId: rawSource.memberId,
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
      const benefitRedemptions = redemptions.filter(
        (r) => r.benefitId === benefit.id,
      );
      const info = computeBenefitCycleStatus(
        benefit,
        rawSource.cycleAnchor,
        benefitRedemptions,
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
      const benefitRedemptions = redemptions.filter(
        (r) => r.benefitId === benefit.id,
      );
      const info = computeBenefitCycleStatus(
        benefit,
        rawSource.cycleAnchor,
        benefitRedemptions,
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
        status: info.status,
        statusLabel,
        statusSeverity: getBenefitStatusSeverity(info.status),
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
    members: dataset.members.map((m) => ({ id: m.id, name: m.name })),
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
