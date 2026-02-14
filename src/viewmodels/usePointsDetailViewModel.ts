// ViewModel for the Points Source Detail page.
// Composes model logic with data source — View consumes this hook only.

"use client";

import { useState, useMemo, useCallback } from "react";
import { getDataset } from "@/data/datasets";
import { getStoredDataMode } from "@/hooks/use-data-mode";
import type {
  PointsSource,
  Redeemable,
  CreateRedeemableInput,
  ValidationError,
} from "@/models/types";
import type { StatCard } from "@/models/dashboard";
import {
  addRedeemable,
  updateRedeemable,
  removeRedeemable,
  validateRedeemableInput,
  computeAffordableItems,
} from "@/models/points";

// ---------------------------------------------------------------------------
// ViewModel-local interfaces
// ---------------------------------------------------------------------------

export interface PointsDetailHeader {
  id: string;
  name: string;
  memberName: string;
  balance: number;
  icon: string | null;
  memo: string | null;
}

export interface RedeemableRow {
  id: string;
  pointsSourceId: string;
  name: string;
  cost: number;
  memo: string | null;
  affordable: boolean;
}

export interface PointsDetailViewModelResult {
  header: PointsDetailHeader | null;
  stats: StatCard[];
  redeemableRows: RedeemableRow[];

  // Redeemable CRUD
  redeemableFormOpen: boolean;
  setRedeemableFormOpen: (open: boolean) => void;
  editingRedeemableId: string | null;
  redeemableFormInput: CreateRedeemableInput;
  setRedeemableFormInput: (input: CreateRedeemableInput) => void;
  redeemableFormErrors: ValidationError[];
  handleCreateRedeemable: () => void;
  handleUpdateRedeemable: () => void;
  handleDeleteRedeemable: (id: string) => void;
  startEditRedeemable: (id: string) => void;

  // Balance update
  updateBalance: (newBalance: number) => void;
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function makeDefaultRedeemableInput(pointsSourceId: string): CreateRedeemableInput {
  return {
    pointsSourceId,
    name: "",
    cost: 0,
  };
}

// ---------------------------------------------------------------------------
// Hook
// ---------------------------------------------------------------------------

export function usePointsDetailViewModel(
  pointsSourceId: string,
): PointsDetailViewModelResult {
  const dataset = useMemo(() => getDataset(getStoredDataMode()), []);

  const [pointsSources, setPointsSources] = useState<PointsSource[]>(dataset.pointsSources);
  const [redeemables, setRedeemables] = useState<Redeemable[]>(dataset.redeemables);

  const [redeemableFormOpen, setRedeemableFormOpen] = useState(false);
  const [editingRedeemableId, setEditingRedeemableId] = useState<string | null>(
    null,
  );
  const [redeemableFormInput, setRedeemableFormInput] =
    useState<CreateRedeemableInput>(
      makeDefaultRedeemableInput(pointsSourceId),
    );
  const [redeemableFormErrors, setRedeemableFormErrors] = useState<
    ValidationError[]
  >([]);

  const memberMap = useMemo(
    () => new Map(dataset.members.map((m) => [m.id, m.name])),
    [dataset.members],
  );

  // Find the points source
  const rawSource = useMemo(
    () => pointsSources.find((ps) => ps.id === pointsSourceId) ?? null,
    [pointsSources, pointsSourceId],
  );

  // Filter redeemables for this points source
  const sourceRedeemables = useMemo(
    () => redeemables.filter((r) => r.pointsSourceId === pointsSourceId),
    [redeemables, pointsSourceId],
  );

  // Build header
  const header: PointsDetailHeader | null = useMemo(() => {
    if (!rawSource) return null;
    return {
      id: rawSource.id,
      name: rawSource.name,
      memberName: memberMap.get(rawSource.memberId) ?? "未知",
      balance: rawSource.balance,
      icon: rawSource.icon,
      memo: rawSource.memo,
    };
  }, [rawSource, memberMap]);

  // Build redeemable rows
  const redeemableRows: RedeemableRow[] = useMemo(() => {
    if (!rawSource) return [];
    const affordableSet = new Set(
      computeAffordableItems(sourceRedeemables, rawSource.balance).map(
        (r) => r.id,
      ),
    );
    return sourceRedeemables.map((r) => ({
      id: r.id,
      pointsSourceId: r.pointsSourceId,
      name: r.name,
      cost: r.cost,
      memo: r.memo,
      affordable: affordableSet.has(r.id),
    }));
  }, [rawSource, sourceRedeemables]);

  // Stats
  const stats: StatCard[] = useMemo(() => {
    if (!rawSource) return [];
    const affordableCount = computeAffordableItems(
      sourceRedeemables,
      rawSource.balance,
    ).length;
    return [
      { label: "积分余额", value: rawSource.balance },
      { label: "可兑换项", value: sourceRedeemables.length },
      { label: "可负担项", value: affordableCount },
    ];
  }, [rawSource, sourceRedeemables]);

  // Redeemable CRUD
  const handleCreateRedeemable = useCallback(() => {
    const errors = validateRedeemableInput(redeemableFormInput);
    if (errors.length > 0) {
      setRedeemableFormErrors(errors);
      return;
    }
    setRedeemables((prev) => addRedeemable(prev, redeemableFormInput));
    setRedeemableFormInput(makeDefaultRedeemableInput(pointsSourceId));
    setRedeemableFormErrors([]);
    setRedeemableFormOpen(false);
  }, [redeemableFormInput, pointsSourceId]);

  const handleUpdateRedeemable = useCallback(() => {
    if (!editingRedeemableId) return;
    const errors = validateRedeemableInput(redeemableFormInput);
    if (errors.length > 0) {
      setRedeemableFormErrors(errors);
      return;
    }
    setRedeemables((prev) =>
      updateRedeemable(prev, editingRedeemableId, redeemableFormInput),
    );
    setEditingRedeemableId(null);
    setRedeemableFormInput(makeDefaultRedeemableInput(pointsSourceId));
    setRedeemableFormErrors([]);
    setRedeemableFormOpen(false);
  }, [editingRedeemableId, redeemableFormInput, pointsSourceId]);

  const handleDeleteRedeemable = useCallback((id: string) => {
    setRedeemables((prev) => removeRedeemable(prev, id));
  }, []);

  const startEditRedeemable = useCallback(
    (id: string) => {
      const item = redeemables.find((r) => r.id === id);
      if (!item) return;
      setEditingRedeemableId(id);
      setRedeemableFormInput({
        pointsSourceId: item.pointsSourceId,
        name: item.name,
        cost: item.cost,
        memo: item.memo,
      });
      setRedeemableFormErrors([]);
      setRedeemableFormOpen(true);
    },
    [redeemables],
  );

  // Balance update
  const updateBalance = useCallback(
    (newBalance: number) => {
      setPointsSources((prev) =>
        prev.map((ps) =>
          ps.id === pointsSourceId ? { ...ps, balance: newBalance } : ps,
        ),
      );
    },
    [pointsSourceId],
  );

  return {
    header,
    stats,
    redeemableRows,
    redeemableFormOpen,
    setRedeemableFormOpen,
    editingRedeemableId,
    redeemableFormInput,
    setRedeemableFormInput,
    redeemableFormErrors,
    handleCreateRedeemable,
    handleUpdateRedeemable,
    handleDeleteRedeemable,
    startEditRedeemable,
    updateBalance,
  };
}
