import { describe, it, expect, beforeEach } from "vitest";
import { render, fireEvent, act } from "@testing-library/react";
import { ThemeToggleSimple } from "@/components/ThemeToggleSimple";
import { applyTheme, emitThemeChange } from "@/hooks/use-theme";

function setSystemDark(dark: boolean) {
  Object.defineProperty(window, "matchMedia", {
    writable: true,
    configurable: true,
    value: (query: string) => ({
      matches: query.includes("dark") && dark,
      media: query,
      addEventListener: () => {},
      removeEventListener: () => {},
      addListener: () => {},
      removeListener: () => {},
      dispatchEvent: () => false,
      onchange: null,
    }),
  });
}

describe("ThemeToggleSimple", () => {
  beforeEach(() => {
    localStorage.clear();
    document.documentElement.classList.remove("dark", "light");
    setSystemDark(false);
  });

  it("renders the sun icon when applied theme is light", () => {
    applyTheme("light");
    const { container } = render(<ThemeToggleSimple />);
    const button = container.querySelector("button");
    expect(button?.getAttribute("aria-label")).toContain("dark");
  });

  it("renders the moon icon when applied theme is dark", () => {
    applyTheme("dark");
    const { container } = render(<ThemeToggleSimple />);
    const button = container.querySelector("button");
    expect(button?.getAttribute("aria-label")).toContain("light");
  });

  it("clicking from light flips to dark", () => {
    applyTheme("light");
    const { container } = render(<ThemeToggleSimple />);
    act(() => {
      fireEvent.click(container.querySelector("button")!);
      emitThemeChange();
    });
    expect(localStorage.getItem("theme")).toBe("dark");
    expect(document.documentElement.classList.contains("dark")).toBe(true);
  });

  it("clicking from dark flips to light", () => {
    applyTheme("dark");
    const { container } = render(<ThemeToggleSimple />);
    act(() => {
      fireEvent.click(container.querySelector("button")!);
      emitThemeChange();
    });
    expect(localStorage.getItem("theme")).toBe("light");
    expect(document.documentElement.classList.contains("light")).toBe(true);
  });

  it("clicking from system-resolving-dark overrides to light", () => {
    setSystemDark(true);
    applyTheme("system");
    const { container } = render(<ThemeToggleSimple />);
    act(() => {
      fireEvent.click(container.querySelector("button")!);
      emitThemeChange();
    });
    // dark applied → click sends us to light (escapes system follow)
    expect(localStorage.getItem("theme")).toBe("light");
  });

  it("aria-label describes the destination, not the current state", () => {
    applyTheme("light");
    const { container } = render(<ThemeToggleSimple />);
    expect(container.querySelector("button")?.getAttribute("aria-label")).toBe(
      "Switch to dark theme",
    );
    act(() => {
      fireEvent.click(container.querySelector("button")!);
      emitThemeChange();
    });
    expect(container.querySelector("button")?.getAttribute("aria-label")).toBe(
      "Switch to light theme",
    );
  });
});
