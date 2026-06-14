"use client";

import { Moon, Sun } from "lucide-react";
import { useCallback } from "react";
import { useAppliedTheme, applyTheme, emitThemeChange } from "@/hooks/use-theme";

const ICON_PROPS = { className: "h-4 w-4", "aria-hidden": true as const, strokeWidth: 1.5 };

/**
 * Two-state theme toggle for the header / login chrome — flips between
 * light and dark only. The "system" pref lives in Settings → 偏好设置
 * (see <ThemeToggle/>); most family users never touch it once set, so
 * the always-visible toggle reads cleaner with just the two outcomes.
 *
 * Reads the *applied* theme rather than the stored preference: a user
 * sitting on "system" → dark sees a moon, and one click flips them to
 * an explicit "light" choice (overriding system follow). This is the
 * pattern most apps converge on after starting with a 3-state toggle.
 */
export function ThemeToggleSimple() {
  const applied = useAppliedTheme();

  const flip = useCallback(() => {
    const next = applied === "dark" ? "light" : "dark";
    applyTheme(next);
    emitThemeChange();
  }, [applied]);

  return (
    <button
      onClick={flip}
      className="flex h-8 w-8 items-center justify-center rounded-lg text-muted-foreground hover:text-foreground hover:bg-accent transition-colors"
      aria-label={`Switch to ${applied === "dark" ? "light" : "dark"} theme`}
    >
      {applied === "dark" ? <Moon {...ICON_PROPS} /> : <Sun {...ICON_PROPS} />}
    </button>
  );
}
