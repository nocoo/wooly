"use client";

import { useSyncExternalStore } from "react";

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
 */
export function useAppliedTheme(): "light" | "dark" {
  const theme = useTheme();
  if (typeof window === "undefined") return "light";
  return theme === "system" ? getSystemTheme() : theme;
}
