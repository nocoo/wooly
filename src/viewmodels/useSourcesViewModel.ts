// ViewModel for the Sources page.
// Composes model logic with data source — View consumes this hook only.

"use client";

import { useState, useMemo, useCallback, useEffect, useRef } from "react";
import { useDataset } from "@/hooks/use-dataset";
import type {
  Source,
  Benefit,
  Redemption,
  PointsSource,
  Redeemable,
  Member,
  CreateSourceInput,
  ValidationError,
  SourceIconInfo,
  CostCycle,
} from "@/models/types";
import type { StatCard } from "@/models/dashboard";
import { resolveSourceIcon, isSourceExpired, isSourceExpiringSoon } from "@/models/source";
import { addSource, updateSource, removeSource, toggleSourceArchived, validateSourceInput } from "@/models/source";
import { computeAffordableItems } from "@/models/points";
import { computeBenefitCycleStatus } from "@/models/cycle";
import { useToday } from "@/hooks/use-today";

// ---------------------------------------------------------------------------
// ViewModel-local interfaces (contract between VM and View)
// ---------------------------------------------------------------------------

export interface SourceCardItem {
  id: string;
  memberId: string;
  name: string;
  memberName: string;
  category: string;
  categoryLabel: string;
  icon: SourceIconInfo;
  phone: string | null;
  currency: string;
  isExpired: boolean;
  isExpiringSoon: boolean;
  validUntilLabel: string | null;
  usedCount: number;
  totalCount: number;
  benefitCount: number;
  nextResetLabel: string | null;
  archived: boolean;
  cost: number | null;
  costCycle: CostCycle | null;
}

export interface PointsSourceCardItem {
  id: string;
  name: string;
  memberName: string;
  balance: number;
  redeemableCount: number;
  affordableCount: number;
}

export interface MemberOption {
  id: string;
  name: string;
}

export interface SourcesViewModelResult {
  loading: boolean;
  stats: StatCard[];
  members: MemberOption[];
  selectedMember: string | null;
  setSelectedMember: (id: string | null) => void;
  sourceCards: SourceCardItem[];
  archivedSourceCards: SourceCardItem[];
  pointsSourceCards: PointsSourceCardItem[];
  usageSummary: UsageSummary;
  categoryChart: CategoryChartItem[];
  expiringAlerts: ExpiringAlertItem[];

  // CRUD
  formOpen: boolean;
  setFormOpen: (open: boolean) => void;
  editingSource: Source | null;
  formInput: CreateSourceInput;
  setFormInput: (input: CreateSourceInput) => void;
  formErrors: ValidationError[];
  handleCreateSource: () => void;
  handleUpdateSource: () => void;
  handleDeleteSource: (id: string) => void;
  handleToggleArchive: (id: string) => void;
  startEditSource: (id: string) => void;
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

const DEFAULT_FORM_INPUT: CreateSourceInput = {
  memberId: "",
  name: "",
  category: "other",
  currency: "CNY",
  cycleAnchor: { period: "monthly", anchor: 1 },
  cost: null,
  costCycle: null,
};

export interface UsageSummary {
  usedCount: number;
  totalCount: number;
  remainingCount: number;
  percent: number;
}

export interface CategoryChartItem {
  name: string;
  value: number;
}

export interface ExpiringAlertItem {
  id: string;
  label: string;
  value: string;
  tone: "expired" | "soon";
}

function buildSourceCard(
  source: Source,
  allBenefits: readonly Benefit[],
  allRedemptions: readonly Redemption[],
  memberName: string,
  today: string,
): SourceCardItem {
  const sourceBenefits = allBenefits.filter((b) => b.sourceId === source.id);
  let usedCount = 0;
  let totalCount = 0;

  for (const benefit of sourceBenefits) {
    if (benefit.type === "action") continue;
    const cycleInfo = computeBenefitCycleStatus(
      benefit,
      source.cycleAnchor,
      [...allRedemptions.filter((r) => r.benefitId === benefit.id)],
      today,
    );
    usedCount += cycleInfo.usedCount;
    totalCount += cycleInfo.totalCount;
  }

  const expired = isSourceExpired(source, today);
  const expiringSoon = isSourceExpiringSoon(source, today);

  return {
    id: source.id,
    memberId: source.memberId,
    name: source.name,
    memberName,
    category: source.category,
    categoryLabel: CATEGORY_LABELS[source.category] ?? source.category,
    icon: resolveSourceIcon(source),
    phone: source.phone,
    currency: source.currency,
    isExpired: expired,
    isExpiringSoon: expiringSoon,
    validUntilLabel: source.validUntil,
    usedCount,
    totalCount,
    benefitCount: sourceBenefits.length,
    nextResetLabel: null,
    archived: source.archived,
    cost: source.cost,
    costCycle: source.costCycle,
  };
}

// ---------------------------------------------------------------------------
// Hook
// ---------------------------------------------------------------------------

export function useSourcesViewModel(): SourcesViewModelResult {
  const { dataset, loading, scheduleSync } = useDataset();

  const [sources, setSources] = useState<Source[]>([]);
  const [benefits, setBenefits] = useState<Benefit[]>([]);
  const [redemptions, setRedemptions] = useState<Redemption[]>([]);
  const [pointsSources, setPointsSources] = useState<PointsSource[]>([]);
  const [redeemables, setRedeemables] = useState<Redeemable[]>([]);
  const [membersData, setMembersData] = useState<Member[]>([]);
  const [timezone, setTimezoneState] = useState("Asia/Shanghai");

  const [selectedMember, setSelectedMember] = useState<string | null>(null);
  const [formOpen, setFormOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formInput, setFormInput] = useState<CreateSourceInput>(DEFAULT_FORM_INPUT);
  const [formErrors, setFormErrors] = useState<ValidationError[]>([]);

  // Track initialized state to avoid re-init on re-renders
  const initializedRef = useRef(false);

  // Refs for sync getter
  const sourcesRef = useRef(sources);
  const benefitsRef = useRef(benefits);
  const redemptionsRef = useRef(redemptions);
  const datasetRef = useRef(dataset);

  useEffect(() => { sourcesRef.current = sources; }, [sources]);
  useEffect(() => { benefitsRef.current = benefits; }, [benefits]);
  useEffect(() => { redemptionsRef.current = redemptions; }, [redemptions]);
  useEffect(() => { datasetRef.current = dataset; }, [dataset]);

  // Hydrate state from dataset on first load (one-time async API → local state sync)
  /* eslint-disable react-hooks/set-state-in-effect */
  useEffect(() => {
    if (dataset && !initializedRef.current) {
      initializedRef.current = true;
      setSources(dataset.sources);
      setBenefits(dataset.benefits);
      setRedemptions(dataset.redemptions);
      setPointsSources(dataset.pointsSources);
      setRedeemables(dataset.redeemables);
      setMembersData(dataset.members);
      setTimezoneState(dataset.defaultSettings.timezone);
    }
  }, [dataset]);
  /* eslint-enable react-hooks/set-state-in-effect */

  const today = useToday(timezone);

  // Build sync payload
  const doSync = useCallback(() => {
    scheduleSync(() => ({
      members: datasetRef.current?.members ?? [],
      sources: sourcesRef.current,
      benefits: benefitsRef.current,
      redemptions: redemptionsRef.current,
      pointsSources: datasetRef.current?.pointsSources ?? [],
      redeemables: datasetRef.current?.redeemables ?? [],
      defaultSettings: datasetRef.current?.defaultSettings ?? { timezone: "Asia/Shanghai" },
    }));
  }, [scheduleSync]);

  const members: MemberOption[] = useMemo(
    () => membersData.map((m) => ({ id: m.id, name: m.name })),
    [membersData],
  );

  const memberMap = useMemo(
    () => new Map(membersData.map((m) => [m.id, m.name])),
    [membersData],
  );

  // Split active vs archived
  const activeSources = useMemo(
    () => sources.filter((s) => !s.archived),
    [sources],
  );

  const archivedSources = useMemo(
    () => sources.filter((s) => s.archived),
    [sources],
  );

  // Build cards
  const allActiveCards = useMemo(
    () =>
      activeSources.map((s) =>
        buildSourceCard(s, benefits, redemptions, memberMap.get(s.memberId) ?? "未知", today),
      ),
    [activeSources, benefits, redemptions, memberMap, today],
  );

  const archivedSourceCards = useMemo(
    () =>
      archivedSources.map((s) =>
        buildSourceCard(s, benefits, redemptions, memberMap.get(s.memberId) ?? "未知", today),
      ),
    [archivedSources, benefits, redemptions, memberMap, today],
  );

  // Apply member filter
  const sourceCards = useMemo(
    () =>
      selectedMember
        ? allActiveCards.filter((c) => c.memberId === selectedMember)
        : allActiveCards,
    [allActiveCards, selectedMember],
  );

  // Points source cards
  const pointsSourceCards: PointsSourceCardItem[] = useMemo(
    () =>
      pointsSources.map((ps) => {
        const psRedeemables = redeemables.filter((r) => r.pointsSourceId === ps.id);
        const affordable = computeAffordableItems(psRedeemables, ps.balance);
        return {
          id: ps.id,
          name: ps.name,
          memberName: memberMap.get(ps.memberId) ?? "未知",
          balance: ps.balance,
          redeemableCount: psRedeemables.length,
          affordableCount: affordable.length,
        };
      }),
    [pointsSources, redeemables, memberMap],
  );

  const usageSummary: UsageSummary = useMemo(() => {
    let usedCount = 0;
    let totalCount = 0;
    for (const card of allActiveCards) {
      usedCount += card.usedCount;
      totalCount += card.totalCount;
    }
    const remainingCount = Math.max(totalCount - usedCount, 0);
    const percent = totalCount > 0 ? Math.round((usedCount / totalCount) * 100) : 0;
    return {
      usedCount,
      totalCount,
      remainingCount,
      percent,
    };
  }, [allActiveCards]);

  const categoryChart: CategoryChartItem[] = useMemo(() => {
    const counts = new Map<string, number>();
    for (const source of activeSources) {
      counts.set(source.category, (counts.get(source.category) ?? 0) + 1);
    }
    return Array.from(counts.entries()).map(([category, count]) => ({
      name: CATEGORY_LABELS[category] ?? category,
      value: count,
    }));
  }, [activeSources]);

  const expiringAlerts: ExpiringAlertItem[] = useMemo(() => {
    const items: ExpiringAlertItem[] = [];
    for (const card of allActiveCards) {
      if (card.isExpired) {
        items.push({
          id: card.id,
          label: card.name,
          value: "已过期",
          tone: "expired",
        });
      } else if (card.isExpiringSoon) {
        items.push({
          id: card.id,
          label: card.name,
          value: "即将到期",
          tone: "soon",
        });
      }
    }
    return items.slice(0, 5);
  }, [allActiveCards]);

  // Stats
  const stats: StatCard[] = useMemo(() => {
    const activeBenefits = benefits.filter((b) =>
      activeSources.some((s) => s.id === b.sourceId),
    );
    return [
      { label: "总账户数", value: activeSources.length },
      { label: "活跃权益", value: activeBenefits.length },
      { label: "积分账户", value: pointsSources.length },
    ];
  }, [activeSources, benefits, pointsSources]);

  // Editing source object
  const editingSource = useMemo(
    () => (editingId ? sources.find((s) => s.id === editingId) ?? null : null),
    [editingId, sources],
  );

  // CRUD callbacks
  const handleCreateSource = useCallback(() => {
    const errors = validateSourceInput(formInput);
    if (errors.length > 0) {
      setFormErrors(errors);
      return;
    }
    setSources((prev) => addSource(prev, formInput));
    setFormInput(DEFAULT_FORM_INPUT);
    setFormErrors([]);
    setFormOpen(false);
    doSync();
  }, [formInput, doSync]);

  const handleUpdateSource = useCallback(() => {
    if (!editingId) return;
    const errors = validateSourceInput(formInput);
    if (errors.length > 0) {
      setFormErrors(errors);
      return;
    }
    setSources((prev) => updateSource(prev, editingId, formInput));
    setEditingId(null);
    setFormInput(DEFAULT_FORM_INPUT);
    setFormErrors([]);
    setFormOpen(false);
    doSync();
  }, [editingId, formInput, doSync]);

  const handleDeleteSource = useCallback((id: string) => {
    // Cascade: remove benefits belonging to this source, then redemptions for those benefits
    setBenefits((prevBenefits) => {
      const orphanedBenefitIds = new Set(
        prevBenefits.filter((b) => b.sourceId === id).map((b) => b.id),
      );
      if (orphanedBenefitIds.size > 0) {
        setRedemptions((prevRedemptions) =>
          prevRedemptions.filter((r) => !orphanedBenefitIds.has(r.benefitId)),
        );
      }
      return prevBenefits.filter((b) => b.sourceId !== id);
    });
    setSources((prev) => removeSource(prev, id));
    doSync();
  }, [doSync]);

  const handleToggleArchive = useCallback((id: string) => {
    setSources((prev) => toggleSourceArchived(prev, id));
    doSync();
  }, [doSync]);

  const startEditSource = useCallback(
    (id: string) => {
      const source = sources.find((s) => s.id === id);
      if (!source) return;
      setEditingId(id);
      setFormInput({
        memberId: source.memberId,
        name: source.name,
        website: source.website,
        icon: source.icon,
        phone: source.phone,
        category: source.category,
        currency: source.currency,
        cycleAnchor: source.cycleAnchor,
        validFrom: source.validFrom,
        validUntil: source.validUntil,
        memo: source.memo,
        cost: source.cost,
        costCycle: source.costCycle,
      });
      setFormErrors([]);
      setFormOpen(true);
    },
    [sources],
  );

  if (loading || !dataset) {
    return {
      loading: true,
      stats: [],
      members: [],
      selectedMember: null,
      setSelectedMember,
      sourceCards: [],
      archivedSourceCards: [],
      pointsSourceCards: [],
      usageSummary: { usedCount: 0, totalCount: 0, remainingCount: 0, percent: 0 },
      categoryChart: [],
      expiringAlerts: [],
      formOpen: false,
      setFormOpen,
      editingSource: null,
      formInput: DEFAULT_FORM_INPUT,
      setFormInput,
      formErrors: [],
      handleCreateSource,
      handleUpdateSource,
      handleDeleteSource,
      handleToggleArchive,
      startEditSource,
    };
  }

  return {
    loading: false,
    stats,
    members,
    selectedMember,
    setSelectedMember,
    sourceCards,
    archivedSourceCards,
    pointsSourceCards,
    usageSummary,
    categoryChart,
    expiringAlerts,
    formOpen,
    setFormOpen,
    editingSource,
    formInput,
    setFormInput,
    formErrors,
    handleCreateSource,
    handleUpdateSource,
    handleDeleteSource,
    handleToggleArchive,
    startEditSource,
  };
}
