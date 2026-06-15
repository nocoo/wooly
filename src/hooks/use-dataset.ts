// Shared hook for loading dataset from API and auto-syncing after CRUD.
// All ViewModels use this instead of direct getDataset() calls.
//
// Wraps useDatasetContext so callers can stay on the legacy import path.
// The actual fetch + cache lives in src/hooks/use-dataset-context.tsx
// (mounted via DatasetProvider in src/app/(dashboard)/layout.tsx) so
// route navigation does NOT re-fetch — see commit notes for the flicker
// fix this addresses.

"use client";

import type { Dataset } from "@/data/datasets";
import { useDatasetContext } from "@/hooks/use-dataset-context";

export interface UseDatasetResult {
  dataset: Dataset | null;
  loading: boolean;
  error: string | null;
  /** Call after any CRUD setState to schedule a debounced sync to DB. */
  scheduleSync: (getLatest: () => Dataset) => void;
}

export function useDataset(): UseDatasetResult {
  const { dataset, loading, error, scheduleSync } = useDatasetContext();
  return { dataset, loading, error, scheduleSync };
}
