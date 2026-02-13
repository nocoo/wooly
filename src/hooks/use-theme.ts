"use client";

import { useCallback, useSyncExternalStore } from "react";

export type Theme = "light" | "dark" | "system";

export function getStoredTheme(): Theme {
  if (typeof window === "undefined") return "system";
  return (localStorage.getItem("theme") as Theme) || "system";
}

export function getSystemTheme(): "light" | "dark" {
  if (typeof window === "undefined") return "light";
  return window.matchMedia("(prefers-color-scheme: dark)").matches
    ? "dark"
    : "light";
}

export function getAppliedTheme(): "light" | "dark" {
  const theme = getStoredTheme();
  return theme === "system" ? getSystemTheme() : theme;
}

export function applyTheme(theme: Theme) {
  const root = document.documentElement;
  const applied = theme === "system" ? getSystemTheme() : theme;
  root.classList.toggle("dark", applied === "dark");
  root.classList.toggle("light", applied === "light");
  localStorage.setItem("theme", theme);
}

// External store for theme
let themeListeners: Array<() => void> = [];

export function emitThemeChange() {
  themeListeners.forEach((l) => l());
}

function subscribeTheme(callback: () => void) {
  themeListeners.push(callback);

  // Listen for system preference changes
  const mq = window.matchMedia("(prefers-color-scheme: dark)");
  const handler = () => {
    if (getStoredTheme() === "system") {
      applyTheme("system");
      emitThemeChange();
    }
  };
  mq.addEventListener("change", handler);

  return () => {
    themeListeners = themeListeners.filter((l) => l !== callback);
    mq.removeEventListener("change", handler);
  };
}

function getThemeSnapshot(): Theme {
  return getStoredTheme();
}

function getThemeServerSnapshot(): Theme {
  return "system";
}

function getAppliedSnapshot(): "light" | "dark" {
  return getAppliedTheme();
}

function getAppliedServerSnapshot(): "light" | "dark" {
  return "light";
}

/**
 * Returns the stored theme preference ("light" | "dark" | "system").
 * Reacts to localStorage changes and system preference changes.
 */
export function useTheme(): Theme {
  return useSyncExternalStore(subscribeTheme, getThemeSnapshot, getThemeServerSnapshot);
}

/**
 * Returns the effectively applied theme ("light" | "dark").
 * Resolves "system" to the actual system preference.
 *
 * Uses useSyncExternalStore to avoid hydration mismatch: the server
 * snapshot always returns "light", and the client takes over after
 * hydration completes. This means the first paint may briefly show
 * light-themed assets before switching — the inline <script> in
 * layout.tsx handles the flash by applying the correct class early.
 */
export function useAppliedTheme(): "light" | "dark" {
  return useSyncExternalStore(subscribeTheme, getAppliedSnapshot, getAppliedServerSnapshot);
}

/**
 * Returns true once the client has hydrated and the applied theme
 * reflects the real user preference. Use this to suppress rendering
 * of theme-dependent content during SSR to avoid hydration mismatch.
 */
export function useThemeReady(): boolean {
  const subscribe = useCallback((cb: () => void) => {
    // After hydration the snapshot flips from false → true on mount
    cb();
    return () => {};
  }, []);
  return useSyncExternalStore(
    subscribe,
    () => true,   // client: always ready
    () => false,   // server: not ready
  );
}
