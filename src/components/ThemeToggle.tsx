"use client";

import { Moon, Sun } from "lucide-react";
import { useCallback, useSyncExternalStore } from "react";

type Theme = "light" | "dark" | "system";

function getStoredTheme(): Theme {
  if (typeof window === "undefined") return "system";
  return (localStorage.getItem("theme") as Theme) || "system";
}

function getSystemTheme(): "light" | "dark" {
  if (typeof window === "undefined") return "light";
  return window.matchMedia("(prefers-color-scheme: dark)").matches
    ? "dark"
    : "light";
}

function getAppliedTheme(): "light" | "dark" {
  const theme = getStoredTheme();
  return theme === "system" ? getSystemTheme() : theme;
}

function applyTheme(theme: Theme) {
  const root = document.documentElement;
  const applied = theme === "system" ? getSystemTheme() : theme;
  root.classList.toggle("dark", applied === "dark");
  root.classList.toggle("light", applied === "light");
  localStorage.setItem("theme", theme);
}

// External store for theme
let themeListeners: Array<() => void> = [];

function emitThemeChange() {
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

export function ThemeToggle() {
  const theme = useSyncExternalStore(subscribeTheme, getThemeSnapshot, getThemeServerSnapshot);

  const cycleTheme = useCallback(() => {
    let next: Theme;
    if (theme === "system") next = "light";
    else if (theme === "light") next = "dark";
    else next = "system";

    applyTheme(next);
    emitThemeChange();
  }, [theme]);

  const applied = typeof window !== "undefined" ? getAppliedTheme() : "light";

  return (
    <button
      onClick={cycleTheme}
      className="flex h-8 w-8 items-center justify-center rounded-lg text-muted-foreground hover:text-foreground hover:bg-accent transition-colors"
      aria-label={`Toggle theme, currently ${theme}`}
    >
      {applied === "dark" ? (
        <Moon className="h-4 w-4" aria-hidden="true" strokeWidth={1.5} />
      ) : (
        <Sun className="h-4 w-4" aria-hidden="true" strokeWidth={1.5} />
      )}
    </button>
  );
}
