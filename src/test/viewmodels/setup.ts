// Shared mock setup for all ViewModel tests.
// Mocks useDataset() to return the test dataset synchronously,
// avoiding the need for async fetch + waitFor in every test.

import { vi } from "vitest";
import { getDataset } from "@/data/datasets";
import type { Dataset } from "@/data/datasets";

const noopSync = vi.fn();

/**
 * Returns a fresh mock of useDataset() that provides test data synchronously.
 * Call this in vi.mock() factory or beforeEach to get isolated test data.
 */
export function createMockUseDataset() {
  const dataset = getDataset("test");
  return () => ({
    dataset,
    loading: false,
    error: null,
    scheduleSync: noopSync,
  });
}

/**
 * Standard mock factory for vi.mock("@/hooks/use-dataset").
 * Provides fresh test dataset on each import.
 */
export function mockUseDatasetModule() {
  const dataset = getDataset("test");
  return {
    useDataset: () => ({
      dataset,
      loading: false,
      error: null,
      scheduleSync: noopSync,
    }),
  };
}

/**
 * Get a fresh test dataset for direct assertions in tests.
 */
export function getTestDataset(): Dataset {
  return getDataset("test");
}
