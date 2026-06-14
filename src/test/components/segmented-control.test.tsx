import { describe, it, expect, vi } from "vitest";
import { render, fireEvent } from "@testing-library/react";
import { useState } from "react";
import { SegmentedControl } from "@/components/ui/segmented-control";

const OPTIONS = [
  { value: "month", label: "本月" },
  { value: "quarter", label: "本季" },
  { value: "all", label: "全部" },
] as const;

describe("SegmentedControl", () => {
  it("renders one button per option", () => {
    const { getByText } = render(
      <SegmentedControl
        options={OPTIONS}
        value="month"
        onChange={() => {}}
        ariaLabel="period"
      />,
    );
    expect(getByText("本月")).toBeTruthy();
    expect(getByText("本季")).toBeTruthy();
    expect(getByText("全部")).toBeTruthy();
  });

  it("marks the active option with aria-checked=true", () => {
    const { getByRole } = render(
      <SegmentedControl
        options={OPTIONS}
        value="quarter"
        onChange={() => {}}
        ariaLabel="period"
      />,
    );
    const quarter = getByRole("radio", { name: "本季" });
    expect(quarter.getAttribute("aria-checked")).toBe("true");
    const month = getByRole("radio", { name: "本月" });
    expect(month.getAttribute("aria-checked")).toBe("false");
  });

  it("invokes onChange with the option value when an inactive option is clicked", () => {
    const handle = vi.fn();
    const { getByText } = render(
      <SegmentedControl
        options={OPTIONS}
        value="month"
        onChange={handle}
        ariaLabel="period"
      />,
    );
    fireEvent.click(getByText("全部"));
    expect(handle).toHaveBeenCalledWith("all");
  });

  it("invokes onChange even if the active option is clicked (caller handles no-op)", () => {
    const handle = vi.fn();
    const { getByText } = render(
      <SegmentedControl
        options={OPTIONS}
        value="month"
        onChange={handle}
        ariaLabel="period"
      />,
    );
    fireEvent.click(getByText("本月"));
    expect(handle).toHaveBeenCalledWith("month");
  });

  it("applies active styling token (bg-card + shadow) to the selected button", () => {
    const { getByText } = render(
      <SegmentedControl
        options={OPTIONS}
        value="month"
        onChange={() => {}}
        ariaLabel="period"
      />,
    );
    const month = getByText("本月");
    expect(month.className).toContain("bg-card");
    expect(month.className).toContain("shadow-sm");
    const all = getByText("全部");
    expect(all.className).not.toContain("bg-card");
  });

  it("controlled state: clicking advances selection", () => {
    function Harness() {
      const [v, setV] = useState<"month" | "quarter" | "all">("month");
      return (
        <SegmentedControl
          options={OPTIONS}
          value={v}
          onChange={setV}
          ariaLabel="period"
        />
      );
    }
    const { getByText, getByRole } = render(<Harness />);
    fireEvent.click(getByText("本季"));
    expect(getByRole("radio", { name: "本季" }).getAttribute("aria-checked")).toBe(
      "true",
    );
  });

  it("forwards className to the outer container", () => {
    const { container } = render(
      <SegmentedControl
        options={OPTIONS}
        value="month"
        onChange={() => {}}
        ariaLabel="period"
        className="ml-auto"
      />,
    );
    const root = container.firstChild as HTMLElement;
    expect(root.className).toContain("ml-auto");
  });

  it("exposes ariaLabel on the radiogroup", () => {
    const { getByRole } = render(
      <SegmentedControl
        options={OPTIONS}
        value="month"
        onChange={() => {}}
        ariaLabel="filter period"
      />,
    );
    expect(getByRole("radiogroup").getAttribute("aria-label")).toBe(
      "filter period",
    );
  });

  // ── Keyboard interaction (WAI-ARIA radio group) ────────────────────────

  it("applies roving tabIndex — active option is 0, others -1", () => {
    const { getByRole } = render(
      <SegmentedControl
        options={OPTIONS}
        value="quarter"
        onChange={() => {}}
        ariaLabel="period"
      />,
    );
    expect(getByRole("radio", { name: "本月" }).getAttribute("tabindex")).toBe("-1");
    expect(getByRole("radio", { name: "本季" }).getAttribute("tabindex")).toBe("0");
    expect(getByRole("radio", { name: "全部" }).getAttribute("tabindex")).toBe("-1");
  });

  it("ArrowRight moves selection to the next option", () => {
    const handle = vi.fn();
    const { getByRole } = render(
      <SegmentedControl
        options={OPTIONS}
        value="month"
        onChange={handle}
        ariaLabel="period"
      />,
    );
    fireEvent.keyDown(getByRole("radio", { name: "本月" }), { key: "ArrowRight" });
    expect(handle).toHaveBeenCalledWith("quarter");
  });

  it("ArrowDown also moves to the next option", () => {
    const handle = vi.fn();
    const { getByRole } = render(
      <SegmentedControl
        options={OPTIONS}
        value="month"
        onChange={handle}
        ariaLabel="period"
      />,
    );
    fireEvent.keyDown(getByRole("radio", { name: "本月" }), { key: "ArrowDown" });
    expect(handle).toHaveBeenCalledWith("quarter");
  });

  it("ArrowLeft moves selection to the previous option (with wrap)", () => {
    const handle = vi.fn();
    const { getByRole } = render(
      <SegmentedControl
        options={OPTIONS}
        value="month"
        onChange={handle}
        ariaLabel="period"
      />,
    );
    fireEvent.keyDown(getByRole("radio", { name: "本月" }), { key: "ArrowLeft" });
    expect(handle).toHaveBeenCalledWith("all");
  });

  it("ArrowUp also moves to the previous option", () => {
    const handle = vi.fn();
    const { getByRole } = render(
      <SegmentedControl
        options={OPTIONS}
        value="quarter"
        onChange={handle}
        ariaLabel="period"
      />,
    );
    fireEvent.keyDown(getByRole("radio", { name: "本季" }), { key: "ArrowUp" });
    expect(handle).toHaveBeenCalledWith("month");
  });

  it("ArrowRight from the last option wraps to the first", () => {
    const handle = vi.fn();
    const { getByRole } = render(
      <SegmentedControl
        options={OPTIONS}
        value="all"
        onChange={handle}
        ariaLabel="period"
      />,
    );
    fireEvent.keyDown(getByRole("radio", { name: "全部" }), { key: "ArrowRight" });
    expect(handle).toHaveBeenCalledWith("month");
  });

  it("Home jumps to the first option", () => {
    const handle = vi.fn();
    const { getByRole } = render(
      <SegmentedControl
        options={OPTIONS}
        value="all"
        onChange={handle}
        ariaLabel="period"
      />,
    );
    fireEvent.keyDown(getByRole("radio", { name: "全部" }), { key: "Home" });
    expect(handle).toHaveBeenCalledWith("month");
  });

  it("End jumps to the last option", () => {
    const handle = vi.fn();
    const { getByRole } = render(
      <SegmentedControl
        options={OPTIONS}
        value="month"
        onChange={handle}
        ariaLabel="period"
      />,
    );
    fireEvent.keyDown(getByRole("radio", { name: "本月" }), { key: "End" });
    expect(handle).toHaveBeenCalledWith("all");
  });

  it("ignores unrelated keys", () => {
    const handle = vi.fn();
    const { getByRole } = render(
      <SegmentedControl
        options={OPTIONS}
        value="month"
        onChange={handle}
        ariaLabel="period"
      />,
    );
    fireEvent.keyDown(getByRole("radio", { name: "本月" }), { key: "Tab" });
    fireEvent.keyDown(getByRole("radio", { name: "本月" }), { key: "Enter" });
    fireEvent.keyDown(getByRole("radio", { name: "本月" }), { key: "a" });
    expect(handle).not.toHaveBeenCalled();
  });
});
