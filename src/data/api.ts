// Client-side data service — wraps fetch calls to /api/data endpoints.
// Used by ViewModels to load/sync data with the Worker/D1 backend.

import type { Dataset } from "@/data/datasets";

/**
 * Dev-only: forward the page's ?_visual query param to /api/data so the
 * visual snapshot scaffold can target empty/loading states from the URL.
 * Production: no-op (server's mock branch is unreachable anyway).
 */
function appendVisualState(url: string): string {
  if (typeof window === "undefined") return url;
  const params = new URLSearchParams(window.location.search);
  const state = params.get("_visual");
  if (!state) return url;
  const sep = url.includes("?") ? "&" : "?";
  return `${url}${sep}_visual=${encodeURIComponent(state)}`;
}

/**
 * Fetch the full dataset from the API.
 */
export async function fetchDataset(): Promise<Dataset> {
  const res = await fetch(appendVisualState("/api/data"));
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
