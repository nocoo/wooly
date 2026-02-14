// Shared hook for loading dataset from API and auto-syncing after CRUD.
// All ViewModels use this instead of direct getDataset() calls.

"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import type { Dataset } from "@/data/datasets";
import { getStoredDataMode } from "@/hooks/use-data-mode";
import { fetchDataset, syncDataset } from "@/data/api";

const SYNC_DEBOUNCE_MS = 500;

export interface UseDatasetResult {
  dataset: Dataset | null;
  loading: boolean;
  error: string | null;
  /** Call after any CRUD setState to schedule a debounced sync to DB. */
  scheduleSync: (getLatest: () => Dataset) => void;
}

/**
 * Fetches the full dataset on mount and provides debounced sync-back.
 *
 * Usage in ViewModel:
 * ```ts
 * const { dataset, loading, scheduleSync } = useDataset();
 * const [members, setMembers] = useState<Member[]>([]);
 * useEffect(() => { if (dataset) setMembers(dataset.members); }, [dataset]);
 * // After CRUD:
 * setMembers(prev => { const next = addMember(prev, input); return next; });
 * scheduleSync(() => ({ ...currentDataset, members: membersRef.current }));
 * ```
 */
export function useDataset(): UseDatasetResult {
  const [dataset, setDataset] = useState<Dataset | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const syncTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const modeRef = useRef(getStoredDataMode());

  // Fetch on mount
  useEffect(() => {
    const mode = getStoredDataMode();
    modeRef.current = mode;
    let cancelled = false;

    fetchDataset(mode)
      .then((data) => {
        if (!cancelled) {
          setDataset(data);
          setLoading(false);
        }
      })
      .catch((err) => {
        if (!cancelled) {
          console.error("[useDataset] Failed to fetch:", err);
          setError(err instanceof Error ? err.message : String(err));
          setLoading(false);
        }
      });

    return () => {
      cancelled = true;
    };
  }, []);

  // Debounced sync
  const scheduleSync = useCallback((getLatest: () => Dataset) => {
    if (syncTimerRef.current) {
      clearTimeout(syncTimerRef.current);
    }
    syncTimerRef.current = setTimeout(() => {
      const latest = getLatest();
      syncDataset(modeRef.current, latest).catch((err) => {
        console.error("[useDataset] Failed to sync:", err);
      });
    }, SYNC_DEBOUNCE_MS);
  }, []);

  // Cleanup timer on unmount
  useEffect(() => {
    return () => {
      if (syncTimerRef.current) {
        clearTimeout(syncTimerRef.current);
      }
    };
  }, []);

  return { dataset, loading, error, scheduleSync };
}
