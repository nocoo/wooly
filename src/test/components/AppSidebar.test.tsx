import { describe, it, expect, vi } from "vitest";
import { render, fireEvent } from "@testing-library/react";
import { MemoryRouter } from "react-router";
import { AppSidebar } from "@/components/AppSidebar";

// Mock SessionProvider
vi.mock("@/components/SessionProvider", () => ({
  useSession: () => ({
    user: { name: "Test User", email: "test@example.com" },
    loading: false,
    error: null,
    logout: vi.fn(),
    reauth: vi.fn(),
  }),
}));

describe("AppSidebar group collapse/expand", () => {
  it("renders nav groups with collapse toggle and allows toggling", () => {
    const { getByText } = render(
      <MemoryRouter>
        <AppSidebar collapsed={false} onToggle={() => {}} />
      </MemoryRouter>,
    );

    // Group labels are present
    const overviewLabel = getByText("总览");
    expect(overviewLabel).toBeTruthy();

    // In defaultOpen state, items inside the group are visible
    expect(getByText("仪表盘")).toBeTruthy();
    expect(getByText("权益账户")).toBeTruthy();
    expect(getByText("核销台")).toBeTruthy();

    // Clicking group header trigger collapses the group
    const trigger = overviewLabel.closest("button");
    expect(trigger).toBeTruthy();
    expect(trigger?.getAttribute("data-state")).toBe("open");
    expect(trigger?.getAttribute("aria-expanded")).toBe("true");

    if (trigger) {
      fireEvent.click(trigger);
      expect(trigger.getAttribute("data-state")).toBe("closed");
      expect(trigger.getAttribute("aria-expanded")).toBe("false");

      // Re-expanding
      fireEvent.click(trigger);
      expect(trigger.getAttribute("data-state")).toBe("open");
      expect(trigger.getAttribute("aria-expanded")).toBe("true");
    }
  });
});
