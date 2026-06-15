"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
  type ReactNode,
} from "react";
import type { Dataset } from "@/data/datasets";
import { fetchDataset, syncDataset } from "@/data/api";

const SYNC_DEBOUNCE_MS = 500;

export interface DatasetContextValue {
  dataset: Dataset | null;
  loading: boolean;
  error: string | null;
  /** Call after any CRUD setState to schedule a debounced sync to DB. */
  scheduleSync: (getLatest: () => Dataset) => void;
  /** Replace the in-memory dataset (used by ViewModels after local CRUD). */
  setDataset: (next: Dataset) => void;
}

const DatasetContext = createContext<DatasetContextValue | null>(null);

/**
 * Single fetcher + cache for the full Dataset. Mount once at a layout
 * level that does NOT remount on route change — the (dashboard) route
 * group layout is the right home, because DashboardLayout itself uses
 * key={pathname} for mobileOpen reset and would otherwise blow away
 * the cache on every navigation.
 *
 * Without this provider, useDataset()'s legacy mode would re-run
 * fetchDataset() on every page mount, causing the "empty → real data"
 * flash哥 reported on detail pages, member filter switches, and the
 * tracker page.
 */
export function DatasetProvider({ children }: { children: ReactNode }) {
  const [dataset, setDataset] = useState<Dataset | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const syncTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Fetch on mount — runs ONCE for the whole dashboard session.
  useEffect(() => {
    let cancelled = false;
    fetchDataset()
      .then((data) => {
        if (!cancelled) {
          setDataset(data);
          setLoading(false);
        }
      })
      .catch((err) => {
        if (!cancelled) {
          console.error("[DatasetProvider] fetch failed:", err);
          setError(err instanceof Error ? err.message : String(err));
          setLoading(false);
        }
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const scheduleSync = useCallback((getLatest: () => Dataset) => {
    if (syncTimerRef.current) clearTimeout(syncTimerRef.current);
    syncTimerRef.current = setTimeout(() => {
      const latest = getLatest();
      // Mirror the latest snapshot into context so other consumers
      // (e.g. components mounted after a CRUD) see the new shape.
      setDataset(latest);
      syncDataset(latest).catch((err) => {
        console.error("[DatasetProvider] sync failed:", err);
      });
    }, SYNC_DEBOUNCE_MS);
  }, []);

  useEffect(() => {
    return () => {
      if (syncTimerRef.current) clearTimeout(syncTimerRef.current);
    };
  }, []);

  const value: DatasetContextValue = {
    dataset,
    loading,
    error,
    scheduleSync,
    setDataset,
  };
  return (
    <DatasetContext.Provider value={value}>{children}</DatasetContext.Provider>
  );
}

/**
 * Returns the shared Dataset state. Will throw if used outside a
 * <DatasetProvider/>, which would indicate someone consumed dataset
 * data outside the (dashboard) layout — fail loudly so the regression
 * surfaces immediately.
 */
export function useDatasetContext(): DatasetContextValue {
  const ctx = useContext(DatasetContext);
  if (!ctx) {
    throw new Error(
      "useDatasetContext must be used within <DatasetProvider/>. " +
        "Make sure the consuming page sits under src/app/(dashboard)/layout.tsx.",
    );
  }
  return ctx;
}
