import { describe, it, expect } from "vitest";
import {
  chart,
  withAlpha,
  CHART_COLORS,
  CHART_TOKENS,
  chartAxis,
  chartPositive,
  chartNegative,
  chartPrimary,
  CHART_COLOR_LABELS,
  COLOR_SCHEME_COUNT,
  getCardGradient,
  getCardProgressFill,
  getCardTextScheme,
  CARD_TEXT_SCHEMES,
} from "./palette";

describe("palette", () => {
  describe("chart color map", () => {
    it("contains all 24 named colors", () => {
      expect(Object.keys(chart)).toHaveLength(24);
    });

    it("wraps CSS variables with hsl(var(--...))", () => {
      expect(chart.primary).toBe("hsl(var(--chart-1))");
      expect(chart.magenta).toBe("hsl(var(--chart-12))");
      expect(chart.gray).toBe("hsl(var(--chart-24))");
    });

    it("each value follows hsl(var(--chart-N)) pattern", () => {
      const pattern = /^hsl\(var\(--chart-\d+\)\)$/;
      for (const value of Object.values(chart)) {
        expect(value).toMatch(pattern);
      }
    });
  });

  describe("withAlpha", () => {
    it("generates correct hsl/alpha string", () => {
      expect(withAlpha("chart-1", 0.12)).toBe("hsl(var(--chart-1) / 0.12)");
    });

    it("handles alpha = 1", () => {
      expect(withAlpha("primary", 1)).toBe("hsl(var(--primary) / 1)");
    });

    it("handles alpha = 0", () => {
      expect(withAlpha("chart-5", 0)).toBe("hsl(var(--chart-5) / 0)");
    });
  });

  describe("CHART_COLORS", () => {
    it("has 24 entries matching chart values", () => {
      expect(CHART_COLORS).toHaveLength(24);
      expect(CHART_COLORS[0]).toBe(chart.primary);
      expect(CHART_COLORS[23]).toBe(chart.gray);
    });
  });

  describe("CHART_TOKENS", () => {
    it("has 24 token names", () => {
      expect(CHART_TOKENS).toHaveLength(24);
    });

    it("generates sequential token names", () => {
      expect(CHART_TOKENS[0]).toBe("chart-1");
      expect(CHART_TOKENS[11]).toBe("chart-12");
      expect(CHART_TOKENS[23]).toBe("chart-24");
    });
  });

  describe("semantic aliases", () => {
    it("chartAxis references chart-axis", () => {
      expect(chartAxis).toBe("hsl(var(--chart-axis))");
    });

    it("chartPositive references green", () => {
      expect(chartPositive).toBe(chart.green);
    });

    it("chartNegative references destructive", () => {
      expect(chartNegative).toBe("hsl(var(--destructive))");
    });

    it("chartPrimary references primary chart color", () => {
      expect(chartPrimary).toBe(chart.primary);
    });
  });

  describe("COLOR_SCHEME_COUNT", () => {
    it("equals 30", () => {
      expect(COLOR_SCHEME_COUNT).toBe(30);
    });
  });

  describe("CHART_COLOR_LABELS", () => {
    it("has 30 labels matching COLOR_SCHEME_COUNT", () => {
      expect(CHART_COLOR_LABELS).toHaveLength(COLOR_SCHEME_COUNT);
    });

    it("includes black card variant labels", () => {
      expect(CHART_COLOR_LABELS[24]).toBe("黑·白");
      expect(CHART_COLOR_LABELS[29]).toBe("黑·翡翠");
    });
  });

  describe("getCardGradient", () => {
    it("returns gradient using chart CSS variable", () => {
      expect(getCardGradient(1)).toContain("--chart-1");
      expect(getCardGradient(30)).toContain("--chart-30");
    });
  });

  describe("getCardProgressFill", () => {
    it("returns alpha-based fill for chromatic cards (1-24)", () => {
      expect(getCardProgressFill(1)).toBe("hsl(var(--chart-1) / 0.5)");
    });

    it("returns accent-based fill for black cards (25-30)", () => {
      const fill = getCardProgressFill(25);
      expect(fill).not.toContain("--chart-25");
      expect(fill).toContain("hsl(");
    });
  });

  describe("getCardTextScheme", () => {
    it("returns null for chromatic cards (1-24)", () => {
      expect(getCardTextScheme(1)).toBeNull();
      expect(getCardTextScheme(24)).toBeNull();
    });

    it("returns a scheme for black cards (25-30)", () => {
      for (let i = 25; i <= 30; i++) {
        const scheme = getCardTextScheme(i);
        expect(scheme).not.toBeNull();
        expect(scheme!.textPrimary).toBeTruthy();
        expect(scheme!.textSecondary).toBeTruthy();
        expect(scheme!.textMuted).toBeTruthy();
        expect(scheme!.progressFill).toBeTruthy();
      }
    });

    it("returns null for out-of-range values", () => {
      expect(getCardTextScheme(0)).toBeNull();
      expect(getCardTextScheme(31)).toBeNull();
    });
  });

  describe("CARD_TEXT_SCHEMES", () => {
    it("has 6 schemes for black card variants", () => {
      expect(CARD_TEXT_SCHEMES).toHaveLength(6);
    });
  });
});
