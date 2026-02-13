// ViewModel for the Sources page.
// Composes model logic with data source — View consumes this hook only.

"use client";

import { useState, useMemo, useCallback } from "react";
import {
  sources as mockSources,
  benefits as mockBenefits,
  redemptions as mockRedemptions,
  members as mockMembers,
  pointsSources as mockPointsSources,
  redeemables as mockRedeemables,
  defaultSettings,
} from "@/data/mock";
import type {
  Source,
  Benefit,
  Redemption,
  PointsSource,
  Redeemable,
  CreateSourceInput,
  ValidationError,
  SourceIconInfo,
} from "@/models/types";
import type { StatCard } from "@/models/dashboard";
import { resolveSourceIcon, isSourceExpired, isSourceExpiringSoon, extractDomain } from "@/models/source";
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
  stats: StatCard[];
  members: MemberOption[];
  selectedMember: string | null;
  setSelectedMember: (id: string | null) => void;
  sourceCards: SourceCardItem[];
  archivedSourceCards: SourceCardItem[];
  pointsSourceCards: PointsSourceCardItem[];

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
};

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
    const info = computeBenefitCycleStatus(benefit, source.cycleAnchor, [...allRedemptions], today);
    usedCount += info.usedCount;
    totalCount += info.totalCount;
  }

  const icon = resolveSourceIcon(source);
  const expired = isSourceExpired(source, today);
  const expiringSoon = isSourceExpiringSoon(source, today);
  const domain = source.website ? extractDomain(source.website) : null;

  return {
    id: source.id,
    memberId: source.memberId,
    name: source.name,
    memberName,
    categoryLabel: CATEGORY_LABELS[source.category] ?? source.category,
    icon,
    phone: source.phone,
    currency: source.currency,
    isExpired: expired,
    isExpiringSoon: expiringSoon,
    validUntilLabel: source.validUntil ?? null,
    usedCount,
    totalCount,
    benefitCount: sourceBenefits.length,
    nextResetLabel: domain,
    archived: source.archived,
  };
}

// ---------------------------------------------------------------------------
// Hook
// ---------------------------------------------------------------------------

export function useSourcesViewModel(): SourcesViewModelResult {
  const [sources, setSources] = useState<Source[]>([...mockSources]);
  const [benefits, setBenefits] = useState<Benefit[]>([...mockBenefits]);
  const [redemptions, setRedemptions] = useState<Redemption[]>([...mockRedemptions]);
  const [pointsSources] = useState<PointsSource[]>([...mockPointsSources]);
  const [redeemables] = useState<Redeemable[]>([...mockRedeemables]);

  const [selectedMember, setSelectedMember] = useState<string | null>(null);
  const [formOpen, setFormOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formInput, setFormInput] = useState<CreateSourceInput>(DEFAULT_FORM_INPUT);
  const [formErrors, setFormErrors] = useState<ValidationError[]>([]);

  const today = useToday(defaultSettings.timezone);

  const members: MemberOption[] = useMemo(
    () => mockMembers.map((m) => ({ id: m.id, name: m.name })),
    [],
  );

  const memberMap = useMemo(
    () => new Map(mockMembers.map((m) => [m.id, m.name])),
    [],
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

  // Stats
  const stats: StatCard[] = useMemo(() => {
    const activeBenefits = benefits.filter((b) =>
      activeSources.some((s) => s.id === b.sourceId),
    );
    return [
      { label: "总来源数", value: activeSources.length },
      { label: "活跃权益", value: activeBenefits.length },
      { label: "积分来源", value: pointsSources.length },
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
  }, [formInput]);

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
  }, [editingId, formInput]);

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
  }, []);

  const handleToggleArchive = useCallback((id: string) => {
    setSources((prev) => toggleSourceArchived(prev, id));
  }, []);

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
      });
      setFormErrors([]);
      setFormOpen(true);
    },
    [sources],
  );

  return {
    stats,
    members,
    selectedMember,
    setSelectedMember,
    sourceCards,
    archivedSourceCards,
    pointsSourceCards,
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
