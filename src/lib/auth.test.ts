import { describe, it, expect } from "vitest";
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

  it("allows any email when whitelist is empty", () => {
    expect(isEmailAllowed("anyone@anywhere.com", [])).toBe(true);
  });

  it("denies null email even when whitelist is empty", () => {
    expect(isEmailAllowed(null, [])).toBe(false);
  });
});
