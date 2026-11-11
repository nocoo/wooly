import { describe, it, expect, vi } from "vitest";
import { render, fireEvent } from "@testing-library/react";
import { MemoryRouter } from "react-router";
import { AppSidebar, PersistedSidebarProvider } from "@/components/AppSidebar";

vi.mock("@/hooks/use-me", () => ({
  useMe: () => ({
    data: {
      email: "test@example.com",
      name: "Test User",
      avatar: null,
      authenticated: true,
    },
    loading: false,
    error: null,
    refetch: vi.fn(),
  }),
}));

function renderSidebar() {
  return render(
    <MemoryRouter>
      <PersistedSidebarProvider>
        <AppSidebar ariaLabel="测试导航" />
      </PersistedSidebarProvider>
    </MemoryRouter>,
  );
}

describe("AppSidebar group collapse/expand", () => {
  it("renders nav groups with collapse toggle and allows toggling", () => {
    const { getByText } = renderSidebar();

    const overviewLabel = getByText("总览");
    expect(overviewLabel).toBeTruthy();

    expect(getByText("仪表盘")).toBeTruthy();
    expect(getByText("权益账户")).toBeTruthy();
    expect(getByText("核销台")).toBeTruthy();

    const trigger = overviewLabel.closest("button");
    expect(trigger).toBeTruthy();
    expect(trigger?.getAttribute("data-state")).toBe("open");
    expect(trigger?.getAttribute("aria-expanded")).toBe("true");

    if (trigger) {
      fireEvent.click(trigger);
      expect(trigger.getAttribute("data-state")).toBe("closed");
      expect(trigger.getAttribute("aria-expanded")).toBe("false");

      fireEvent.click(trigger);
      expect(trigger.getAttribute("data-state")).toBe("open");
      expect(trigger.getAttribute("aria-expanded")).toBe("true");
    }
  });

  it("exposes Cloudflare Access sign-out in the expanded footer", () => {
    const { getByRole } = renderSidebar();
    const signOut = getByRole("link", { name: "退出登录" });
    expect(signOut.getAttribute("href")).toBe("/cdn-cgi/access/logout");
  });

  it("shows user email and display name from useMe in the expanded footer", () => {
    const { getByText } = renderSidebar();
    expect(getByText("Test User")).toBeTruthy();
    expect(getByText("test@example.com")).toBeTruthy();
  });
});
