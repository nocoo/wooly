import { describe, it, expect } from "vitest";
import {
  formatCurrency,
  formatCycleLabel,
  formatDateRange,
  formatDaysUntil,
  formatDateInTimezone,
} from "@/models/format";

// ---------------------------------------------------------------------------
// formatCurrency
// ---------------------------------------------------------------------------

describe("formatCurrency", () => {
  it("formats CNY with ¥ symbol", () => {
    expect(formatCurrency(300, "CNY")).toBe("¥300");
  });

  it("formats USD with $ symbol and 2 decimals", () => {
    expect(formatCurrency(99.5, "USD")).toBe("$99.50");
  });

  it("formats EUR with € symbol and 2 decimals", () => {
    expect(formatCurrency(42, "EUR")).toBe("€42.00");
  });

  it("formats JPY with ¥ symbol and no decimals", () => {
    expect(formatCurrency(1000, "JPY")).toBe("¥1000");
  });

  it("formats GBP with £ symbol and 2 decimals", () => {
    expect(formatCurrency(19.99, "GBP")).toBe("£19.99");
  });

  it("formats unknown currency with code prefix", () => {
    expect(formatCurrency(100, "KRW")).toBe("KRW 100");
  });

  it("handles zero amount", () => {
    expect(formatCurrency(0, "CNY")).toBe("¥0");
  });

  it("handles large amounts with CNY (no decimals)", () => {
    expect(formatCurrency(12345, "CNY")).toBe("¥12345");
  });
});

// ---------------------------------------------------------------------------
// formatCycleLabel
// ---------------------------------------------------------------------------

describe("formatCycleLabel", () => {
  it("formats monthly with day", () => {
    expect(formatCycleLabel({ period: "monthly", anchor: 25 })).toBe("每月25日");
  });

  it("formats monthly with day 1", () => {
    expect(formatCycleLabel({ period: "monthly", anchor: 1 })).toBe("每月1日");
  });

  it("formats yearly with month and day", () => {
    expect(formatCycleLabel({ period: "yearly", anchor: { month: 5, day: 20 } })).toBe("每年5月20日");
  });

  it("formats quarterly with month and day", () => {
    expect(formatCycleLabel({ period: "quarterly", anchor: { month: 1, day: 1 } })).toBe("每季度（1月1日起）");
  });

  it("formats quarterly with non-standard anchor", () => {
    expect(formatCycleLabel({ period: "quarterly", anchor: { month: 3, day: 15 } })).toBe("每季度（3月15日起）");
  });
});

// ---------------------------------------------------------------------------
// formatDateRange
// ---------------------------------------------------------------------------

describe("formatDateRange", () => {
  it("formats a date range", () => {
    expect(formatDateRange("2026-01-25", "2026-02-25")).toBe("01/25 – 02/25");
  });

  it("formats a cross-year date range", () => {
    expect(formatDateRange("2025-12-15", "2026-12-15")).toBe("2025/12/15 – 2026/12/15");
  });

  it("formats a same-year range (non-current year)", () => {
    // When both dates are in the same non-current year, still show the year
    expect(formatDateRange("2025-03-01", "2025-06-01")).toBe("2025/03/01 – 2025/06/01");
  });
});

// ---------------------------------------------------------------------------
// formatDaysUntil
// ---------------------------------------------------------------------------

describe("formatDaysUntil", () => {
  it("returns '今天' for 0 days", () => {
    expect(formatDaysUntil(0)).toBe("今天");
  });

  it("returns 'N天后' for positive days", () => {
    expect(formatDaysUntil(5)).toBe("5天后");
  });

  it("returns '1天后' for 1 day", () => {
    expect(formatDaysUntil(1)).toBe("1天后");
  });

  it("returns '已过期' for negative days", () => {
    expect(formatDaysUntil(-3)).toBe("已过期");
  });
});

// ---------------------------------------------------------------------------
// formatDateInTimezone
// ---------------------------------------------------------------------------

describe("formatDateInTimezone", () => {
  it("formats date in Asia/Shanghai timezone", () => {
    // 2026-02-13T00:00:00Z in Shanghai (UTC+8) is 2026-02-13 08:00
    const date = new Date("2026-02-13T00:00:00Z");
    expect(formatDateInTimezone(date, "Asia/Shanghai")).toBe("2026-02-13");
  });

  it("handles timezone offset that changes the date", () => {
    // 2026-02-12T23:00:00Z in Shanghai (UTC+8) is 2026-02-13 07:00
    const date = new Date("2026-02-12T23:00:00Z");
    expect(formatDateInTimezone(date, "Asia/Shanghai")).toBe("2026-02-13");
  });

  it("formats date in America/New_York timezone", () => {
    // 2026-02-13T04:00:00Z in New York (UTC-5 in Feb) is 2026-02-12 23:00
    const date = new Date("2026-02-13T04:00:00Z");
    expect(formatDateInTimezone(date, "America/New_York")).toBe("2026-02-12");
  });

  it("formats date in UTC", () => {
    const date = new Date("2026-02-13T12:30:00Z");
    expect(formatDateInTimezone(date, "UTC")).toBe("2026-02-13");
  });
});
