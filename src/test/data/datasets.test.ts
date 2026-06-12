import { describe, it, expect } from "vitest";
import { getDataset } from "@/data/datasets";

describe("getDataset", () => {
  it("returns normal dataset by default", () => {
    const ds = getDataset();
    expect(ds.members.length).toBeGreaterThan(0);
    expect(ds.sources.length).toBeGreaterThan(0);
    expect(ds.benefits.length).toBeGreaterThan(0);
    expect(ds.defaultSettings.timezone).toBeTruthy();
  });

  it("returns the same shape when state is explicitly normal", () => {
    const def = getDataset();
    const explicit = getDataset("normal");
    expect(explicit.members.length).toBe(def.members.length);
    expect(explicit.sources.length).toBe(def.sources.length);
  });

  it("returns empty arrays but valid settings when state is empty", () => {
    const ds = getDataset("empty");
    expect(ds.members).toEqual([]);
    expect(ds.sources).toEqual([]);
    expect(ds.benefits).toEqual([]);
    expect(ds.redemptions).toEqual([]);
    expect(ds.pointsSources).toEqual([]);
    expect(ds.redeemables).toEqual([]);
    expect(ds.defaultSettings.timezone).toBeTruthy();
  });

  it("returns deep-copied arrays so callers can mutate safely", () => {
    const a = getDataset();
    const b = getDataset();
    expect(a.members).not.toBe(b.members);
    a.members.push({ id: "tmp", name: "x", relationship: "self", avatar: "👤", createdAt: "" });
    expect(b.members.find((m) => m.id === "tmp")).toBeUndefined();
  });
});
