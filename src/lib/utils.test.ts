import { describe, it, expect } from "vitest";
import { cn, stripUndefined } from "./utils";

describe("cn (class name merger)", () => {
  it("merges multiple class strings", () => {
    expect(cn("foo", "bar")).toBe("foo bar");
  });

  it("handles conditional classes via clsx", () => {
    expect(cn("base", false && "hidden", "visible")).toBe("base visible");
  });

  it("resolves tailwind conflicts via twMerge", () => {
    // twMerge should keep the last conflicting utility
    expect(cn("p-4", "p-2")).toBe("p-2");
  });

  it("handles undefined and null inputs", () => {
    expect(cn("foo", undefined, null, "bar")).toBe("foo bar");
  });

  it("handles empty string inputs", () => {
    expect(cn("", "foo", "")).toBe("foo");
  });

  it("handles array inputs", () => {
    expect(cn(["foo", "bar"])).toBe("foo bar");
  });

  it("handles object inputs", () => {
    expect(cn({ foo: true, bar: false, baz: true })).toBe("foo baz");
  });

  it("returns empty string for no arguments", () => {
    expect(cn()).toBe("");
  });
});

describe("stripUndefined", () => {
  it("removes undefined values from an object", () => {
    const result = stripUndefined({ a: 1, b: undefined, c: "hello" });
    expect(result).toEqual({ a: 1, c: "hello" });
  });

  it("preserves null values (only strips undefined)", () => {
    const result = stripUndefined({ a: null, b: undefined });
    expect(result).toEqual({ a: null });
  });

  it("returns empty object for all-undefined input", () => {
    const result = stripUndefined({ a: undefined, b: undefined });
    expect(result).toEqual({});
  });

  it("returns all keys when none are undefined", () => {
    const result = stripUndefined({ x: 1, y: 2 });
    expect(result).toEqual({ x: 1, y: 2 });
  });

  it("handles empty object", () => {
    const result = stripUndefined({});
    expect(result).toEqual({});
  });
});
