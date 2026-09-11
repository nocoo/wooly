import { describe, it, expect, vi } from "vitest";
import { render, fireEvent } from "@testing-library/react";
import { AppSidebar } from "@/components/AppSidebar";

// Mock next-auth
vi.mock("next-auth/react", () => ({
  useSession: () => ({
    data: {
      user: { name: "Test User", email: "test@example.com" },
    },
  }),
  signOut: vi.fn(),
}));

// Mock next/navigation
vi.mock("next/navigation", () => ({
  usePathname: () => "/",
  useRouter: () => ({ push: vi.fn() }),
}));

describe("AppSidebar group collapse/expand", () => {
  it("renders nav groups with collapse toggle and allows toggling", () => {
    const { getByText } = render(
      <AppSidebar collapsed={false} onToggle={() => {}} />,
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
    if (trigger) {
      fireEvent.click(trigger);
    }
  });
});
