import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { parseEmailWhitelist, isEmailAllowed } from "./auth";

describe("parseEmailWhitelist", () => {
  it("parses comma-separated emails", () => {
    expect(parseEmailWhitelist("a@b.com, c@d.com")).toEqual([
      "a@b.com",
      "c@d.com",
    ]);
  });

  it("normalizes to lowercase", () => {
    expect(parseEmailWhitelist("Alice@Example.COM")).toEqual([
      "alice@example.com",
    ]);
  });

  it("trims whitespace", () => {
    expect(parseEmailWhitelist("  a@b.com  ,  c@d.com  ")).toEqual([
      "a@b.com",
      "c@d.com",
    ]);
  });

  it("filters empty entries", () => {
    expect(parseEmailWhitelist(",,,")).toEqual([]);
    expect(parseEmailWhitelist("")).toEqual([]);
  });

  it("handles single email", () => {
    expect(parseEmailWhitelist("user@example.com")).toEqual([
      "user@example.com",
    ]);
  });
});

describe("isEmailAllowed", () => {
  const whitelist = ["admin@example.com", "user@test.com"];

  let warnSpy: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    warnSpy = vi.spyOn(console, "warn").mockImplementation(() => {});
  });

  afterEach(() => {
    warnSpy.mockRestore();
  });

  it("allows whitelisted email", () => {
    expect(isEmailAllowed("admin@example.com", whitelist)).toBe(true);
  });

  it("allows whitelisted email case-insensitively", () => {
    expect(isEmailAllowed("ADMIN@EXAMPLE.COM", whitelist)).toBe(true);
  });

  it("denies non-whitelisted email", () => {
    expect(isEmailAllowed("hacker@evil.com", whitelist)).toBe(false);
  });

  it("denies null email", () => {
    expect(isEmailAllowed(null, whitelist)).toBe(false);
  });

  it("denies undefined email", () => {
    expect(isEmailAllowed(undefined, whitelist)).toBe(false);
  });

  it("denies empty string email", () => {
    expect(isEmailAllowed("", whitelist)).toBe(false);
  });

  it("denies any email when whitelist is empty (fail-closed)", () => {
    expect(isEmailAllowed("anyone@anywhere.com", [])).toBe(false);
  });

  it("warns when whitelist is empty so misconfiguration is detectable", () => {
    isEmailAllowed("anyone@anywhere.com", []);
    expect(warnSpy).toHaveBeenCalledWith(
      "AUTH_ALLOWED_EMAILS not configured. Denying all logins for security.",
    );
  });

  it("denies null email even when whitelist is empty", () => {
    expect(isEmailAllowed(null, [])).toBe(false);
  });

  it("does not warn for null email even when whitelist is empty", () => {
    isEmailAllowed(null, []);
    expect(warnSpy).not.toHaveBeenCalled();
  });
});
