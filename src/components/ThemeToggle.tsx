"use client";

import { Moon, Sun } from "lucide-react";
import { useCallback } from "react";
import { useTheme, useAppliedTheme, applyTheme, emitThemeChange } from "@/hooks/use-theme";
import type { Theme } from "@/hooks/use-theme";

export function ThemeToggle() {
  const theme = useTheme();
  const applied = useAppliedTheme();

  const cycleTheme = useCallback(() => {
    let next: Theme;
    if (theme === "system") next = "light";
    else if (theme === "light") next = "dark";
    else next = "system";

    applyTheme(next);
    emitThemeChange();
  }, [theme]);

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
