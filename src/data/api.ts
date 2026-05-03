// Client-side data service — wraps fetch calls to /api/data endpoints.
// Used by ViewModels to load/sync data with the Worker/D1 backend.

import type { Dataset } from "@/data/datasets";

/**
 * Fetch the full dataset from the API.
 */
export async function fetchDataset(): Promise<Dataset> {
  const res = await fetch("/api/data");
  if (!res.ok) {
    throw new Error(`Failed to fetch dataset: ${res.status} ${res.statusText}`);
  }
  return res.json();
}

/**
 * Sync the full dataset back to the API (debounce-friendly).
 */
export async function syncDataset(dataset: Dataset): Promise<void> {
  const res = await fetch("/api/data", {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(dataset),
  });
  if (!res.ok) {
    throw new Error(`Failed to sync dataset: ${res.status} ${res.statusText}`);
  }
}

/**
 * Reset the database via the Worker.
 */
export async function resetDatabase(): Promise<void> {
  const res = await fetch("/api/data/reset", {
    method: "POST",
  });
  if (!res.ok) {
    throw new Error(`Failed to reset database: ${res.status} ${res.statusText}`);
  }
}
