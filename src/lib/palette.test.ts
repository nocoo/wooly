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
});
