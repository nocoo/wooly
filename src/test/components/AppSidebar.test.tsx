import { describe, it, expect, vi } from "vitest";
import { render, fireEvent } from "@testing-library/react";
import { MemoryRouter } from "react-router";
import { AppSidebar, PersistedSidebarProvider } from "@/components/AppSidebar";

vi.mock("@/components/SessionProvider", () => ({
  useSession: () => ({
    user: { name: "Test User", email: "test@example.com" },
    loading: false,
    error: null,
    logout: vi.fn(),
    reauth: vi.fn(),
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
});
