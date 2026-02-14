import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { renderHook, act } from "@testing-library/react";
import {
  useDataMode,
  getStoredDataMode,
  setDataMode,
  emitDataModeChange,
} from "./use-data-mode";
import type { DataMode } from "./use-data-mode";

describe("use-data-mode", () => {
  let originalGetItem: typeof Storage.prototype.getItem;
  let originalSetItem: typeof Storage.prototype.setItem;
  let store: Record<string, string>;

  beforeEach(() => {
    store = {};
    originalGetItem = Storage.prototype.getItem;
    originalSetItem = Storage.prototype.setItem;

    Storage.prototype.getItem = (key: string) => store[key] ?? null;
    Storage.prototype.setItem = (key: string, value: string) => {
      store[key] = value;
    };
  });

  afterEach(() => {
    Storage.prototype.getItem = originalGetItem;
    Storage.prototype.setItem = originalSetItem;
  });

  describe("getStoredDataMode", () => {
    it("returns 'test' when localStorage is empty", () => {
      expect(getStoredDataMode()).toBe("test");
    });

    it("returns 'production' when stored", () => {
      store["wooly-data-mode"] = "production";
      expect(getStoredDataMode()).toBe("production");
    });

    it("returns 'test' when stored", () => {
      store["wooly-data-mode"] = "test";
      expect(getStoredDataMode()).toBe("test");
    });

    it("returns 'test' for invalid stored values", () => {
      store["wooly-data-mode"] = "invalid";
      expect(getStoredDataMode()).toBe("test");
    });
  });

  describe("setDataMode", () => {
    it("persists mode to localStorage", () => {
      setDataMode("production");
      expect(store["wooly-data-mode"]).toBe("production");
    });

    it("persists 'test' to localStorage", () => {
      setDataMode("test");
      expect(store["wooly-data-mode"]).toBe("test");
    });
  });

  describe("useDataMode hook", () => {
    it("returns the default mode when localStorage is empty", () => {
      const { result } = renderHook(() => useDataMode());
      expect(result.current).toBe("test");
    });

    it("returns the stored mode", () => {
      store["wooly-data-mode"] = "production";
      const { result } = renderHook(() => useDataMode());
      expect(result.current).toBe("production");
    });

    it("reacts to setDataMode calls", () => {
      const { result } = renderHook(() => useDataMode());
      expect(result.current).toBe("test");

      act(() => {
        setDataMode("production");
      });

      expect(result.current).toBe("production");
    });

    it("reacts to emitDataModeChange", () => {
      const { result } = renderHook(() => useDataMode());
      expect(result.current).toBe("test");

      act(() => {
        store["wooly-data-mode"] = "production";
        emitDataModeChange();
      });

      expect(result.current).toBe("production");
    });

    it("cleans up listener on unmount", () => {
      const { result, unmount } = renderHook(() => useDataMode());
      expect(result.current).toBe("test");

      unmount();

      // After unmount, setting mode should not cause errors
      setDataMode("production");
    });
  });

  describe("DataMode type", () => {
    it("accepts valid mode values", () => {
      const modes: DataMode[] = ["production", "test"];
      expect(modes).toHaveLength(2);
    });
  });
});
