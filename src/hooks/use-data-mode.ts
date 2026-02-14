"use client";

import { useSyncExternalStore } from "react";

export type DataMode = "production" | "test";

const STORAGE_KEY = "wooly-data-mode";
const DEFAULT_MODE: DataMode = "test";

// ---------------------------------------------------------------------------
// Pure getters
// ---------------------------------------------------------------------------

export function getStoredDataMode(): DataMode {
  if (typeof window === "undefined") return DEFAULT_MODE;
  const stored = localStorage.getItem(STORAGE_KEY);
  if (stored === "production" || stored === "test") return stored;
  return DEFAULT_MODE;
}

// ---------------------------------------------------------------------------
// External store (useSyncExternalStore pattern)
// ---------------------------------------------------------------------------

let dataModeListeners: Array<() => void> = [];

export function emitDataModeChange() {
  dataModeListeners.forEach((l) => l());
}

export function setDataMode(mode: DataMode) {
  localStorage.setItem(STORAGE_KEY, mode);
  emitDataModeChange();
}

function subscribe(callback: () => void) {
  dataModeListeners.push(callback);
  return () => {
    dataModeListeners = dataModeListeners.filter((l) => l !== callback);
  };
}

function getSnapshot(): DataMode {
  return getStoredDataMode();
}

function getServerSnapshot(): DataMode {
  return DEFAULT_MODE;
}

/**
 * Returns the current data mode ("production" | "test").
 * Reacts to changes via the external store pattern.
 */
export function useDataMode(): DataMode {
  return useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
}
