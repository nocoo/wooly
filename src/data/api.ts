// Client-side data service — wraps fetch calls to /api/data endpoints.
// Used by ViewModels to load/sync data with the SQLite backend.

import type { DataMode } from "@/hooks/use-data-mode";
import type { Dataset } from "@/data/datasets";

/**
 * Fetch the full dataset for the given data mode from the API.
 */
export async function fetchDataset(mode: DataMode): Promise<Dataset> {
  const res = await fetch("/api/data", {
    headers: { "X-Data-Mode": mode },
  });
  if (!res.ok) {
    throw new Error(`Failed to fetch dataset: ${res.status} ${res.statusText}`);
  }
  return res.json();
}

/**
 * Sync the full dataset back to the API (debounce-friendly).
 */
export async function syncDataset(
  mode: DataMode,
  dataset: Dataset,
): Promise<void> {
  const res = await fetch("/api/data", {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
      "X-Data-Mode": mode,
    },
    body: JSON.stringify(dataset),
  });
  if (!res.ok) {
    throw new Error(`Failed to sync dataset: ${res.status} ${res.statusText}`);
  }
}

/**
 * Reset the database for the given mode.
 * Test mode reseeds from mock data; production mode clears all data.
 */
export async function resetDatabase(mode: DataMode): Promise<void> {
  const res = await fetch("/api/data/reset", {
    method: "POST",
    headers: { "X-Data-Mode": mode },
  });
  if (!res.ok) {
    throw new Error(`Failed to reset database: ${res.status} ${res.statusText}`);
  }
}
