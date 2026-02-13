import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { renderHook, act } from "@testing-library/react";
import { useIsMobile } from "./use-mobile";

describe("useIsMobile", () => {
  let listeners: Array<() => void>;
  let mockMatchMedia: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    listeners = [];
    mockMatchMedia = vi.fn().mockImplementation((query: string) => ({
      matches: false,
      media: query,
      addEventListener: (_event: string, handler: () => void) => {
        listeners.push(handler);
      },
      removeEventListener: (_event: string, handler: () => void) => {
        listeners = listeners.filter((l) => l !== handler);
      },
    }));
    Object.defineProperty(window, "matchMedia", {
      writable: true,
      value: mockMatchMedia,
    });
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("returns false on desktop viewport (>= 768px)", () => {
    Object.defineProperty(window, "innerWidth", { writable: true, value: 1024 });

    const { result } = renderHook(() => useIsMobile());
    expect(result.current).toBe(false);
  });

  it("returns true on mobile viewport (< 768px)", () => {
    Object.defineProperty(window, "innerWidth", { writable: true, value: 375 });

    const { result } = renderHook(() => useIsMobile());
    expect(result.current).toBe(true);
  });

  it("updates when viewport changes", () => {
    Object.defineProperty(window, "innerWidth", { writable: true, value: 1024 });

    const { result } = renderHook(() => useIsMobile());
    expect(result.current).toBe(false);

    // Simulate resize to mobile
    act(() => {
      Object.defineProperty(window, "innerWidth", { writable: true, value: 375 });
      listeners.forEach((l) => l());
    });

    expect(result.current).toBe(true);
  });

  it("cleans up event listener on unmount", () => {
    Object.defineProperty(window, "innerWidth", { writable: true, value: 1024 });

    const { unmount } = renderHook(() => useIsMobile());
    expect(listeners).toHaveLength(1);

    unmount();
    expect(listeners).toHaveLength(0);
  });
});
