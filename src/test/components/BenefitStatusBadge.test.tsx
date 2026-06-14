import { describe, it, expect } from "vitest";
import { render } from "@testing-library/react";
import { BenefitStatusBadge } from "@/components/BenefitStatusBadge";
import type { BenefitCycleStatus } from "@/models/types";

describe("BenefitStatusBadge", () => {
  const cases: Array<{ status: BenefitCycleStatus; expectedClassFragment: string }> = [
    { status: "available", expectedClassFragment: "green" },
    { status: "partially_used", expectedClassFragment: "sky" },
    { status: "expiring_soon", expectedClassFragment: "amber" },
    { status: "exhausted", expectedClassFragment: "muted" },
    { status: "pending", expectedClassFragment: "secondary" },
    { status: "not_applicable", expectedClassFragment: "muted" },
  ];

  cases.forEach(({ status, expectedClassFragment }) => {
    it(`maps ${status} to a Badge with ${expectedClassFragment}-ish styling`, () => {
      const { container } = render(<BenefitStatusBadge status={status} />);
      const badge = container.firstChild as HTMLElement;
      expect(badge.className).toMatch(new RegExp(expectedClassFragment, "i"));
    });
  });

  it("renders default Chinese label per status", () => {
    const { getByText } = render(<BenefitStatusBadge status="available" />);
    expect(getByText("可用")).toBeTruthy();
  });

  it("renders an explicit override label when provided", () => {
    const { getByText, queryByText } = render(
      <BenefitStatusBadge status="available" label="自定义" />,
    );
    expect(getByText("自定义")).toBeTruthy();
    expect(queryByText("可用")).toBeNull();
  });

  it("forwards className to the underlying Badge", () => {
    const { container } = render(
      <BenefitStatusBadge status="available" className="ml-auto" />,
    );
    const badge = container.firstChild as HTMLElement;
    expect(badge.className).toContain("ml-auto");
  });
});
