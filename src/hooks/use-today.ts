"use client";

import { useCallback, useSyncExternalStore } from "react";
import { formatDateInTimezone } from "@/models/format";

// ---------------------------------------------------------------------------
// Module-level store: caches the current date string per timezone.
// A single shared interval checks every 30s whether the date has rolled over.
// ---------------------------------------------------------------------------

let listeners: Array<() => void> = [];
const cache = new Map<string, string>();
let intervalId: ReturnType<typeof setInterval> | null = null;

function notify() {
  listeners.forEach((l) => l());
}

function startPolling() {
  if (intervalId !== null) return;
  intervalId = setInterval(() => {
    const now = new Date();
    let changed = false;
    for (const [tz, prev] of cache) {
      const current = formatDateInTimezone(now, tz);
      if (current !== prev) {
        cache.set(tz, current);
        changed = true;
      }
    }
    if (changed) notify();
  }, 30_000); // check every 30 seconds
}

function stopPolling() {
  if (intervalId !== null) {
    clearInterval(intervalId);
    intervalId = null;
  }
}

function subscribe(callback: () => void) {
  listeners.push(callback);
  startPolling();
  return () => {
    listeners = listeners.filter((l) => l !== callback);
    if (listeners.length === 0) stopPolling();
  };
}

function getSnapshot(timezone: string): string {
  const cached = cache.get(timezone);
  if (cached) return cached;
  const today = formatDateInTimezone(new Date(), timezone);
  cache.set(timezone, today);
  return today;
}

function getServerSnapshot(timezone: string): string {
  return formatDateInTimezone(new Date(), timezone);
}

/**
 * Returns today's date as a YYYY-MM-DD string in the given timezone.
 * Automatically updates when the date rolls over at midnight.
 *
 * Uses useSyncExternalStore with a 30-second polling interval to detect
 * date changes, avoiding stale values across midnight boundaries.
 */
export function useToday(timezone: string): string {
  const snap = useCallback(() => getSnapshot(timezone), [timezone]);
  const serverSnap = useCallback(() => getServerSnapshot(timezone), [timezone]);
  return useSyncExternalStore(subscribe, snap, serverSnap);
}
