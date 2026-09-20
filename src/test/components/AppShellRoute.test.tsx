import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import { MemoryRouter, Routes, Route } from "react-router";
import { AppShellRoute } from "@/AppShellRoute";

const mockUseSession = vi.fn();
vi.mock("@/components/SessionProvider", () => ({
  useSession: () => mockUseSession(),
}));

// Mock DatasetProvider & DashboardLayout to isolate AppShellRoute routing behavior
vi.mock("@/hooks/use-dataset-context", () => ({
  DatasetProvider: ({ children }: { children: React.ReactNode }) => <div data-testid="dataset-provider">{children}</div>,
}));

vi.mock("@/components/DashboardLayout", () => ({
  DashboardLayout: ({ children }: { children: React.ReactNode }) => <div data-testid="dashboard-layout">{children}</div>,
}));

describe("AppShellRoute", () => {
  it("renders loading screen when session is loading", () => {
    mockUseSession.mockReturnValue({
      user: null,
      loading: true,
      error: null,
      reauth: vi.fn(),
      logout: vi.fn(),
    });

    render(
      <MemoryRouter initialEntries={["/"]}>
        <Routes>
          <Route element={<AppShellRoute />}>
            <Route path="/" element={<div>Dashboard Child</div>} />
          </Route>
        </Routes>
      </MemoryRouter>,
    );

    expect(screen.getByRole("status")).toBeTruthy();
  });

  it("renders unauthenticated/expired gate when user is missing or error present", () => {
    mockUseSession.mockReturnValue({
      user: null,
      loading: false,
      error: "Unauthorized",
      reauth: vi.fn(),
      logout: vi.fn(),
    });

    render(
      <MemoryRouter initialEntries={["/"]}>
        <Routes>
          <Route element={<AppShellRoute />}>
            <Route path="/" element={<div>Dashboard Child</div>} />
          </Route>
        </Routes>
      </MemoryRouter>,
    );

    expect(screen.getByText("未登录或会话已过期")).toBeTruthy();
    expect(screen.getByRole("button", { name: "重新登录" })).toBeTruthy();
    expect(screen.getByRole("button", { name: "重试" })).toBeTruthy();
  });

  it("renders dashboard layout and child outlet when authenticated", () => {
    mockUseSession.mockReturnValue({
      user: { name: "Alice", email: "alice@example.com" },
      loading: false,
      error: null,
      reauth: vi.fn(),
      logout: vi.fn(),
    });

    render(
      <MemoryRouter initialEntries={["/"]}>
        <Routes>
          <Route element={<AppShellRoute />}>
            <Route path="/" element={<div>Dashboard Child</div>} />
          </Route>
        </Routes>
      </MemoryRouter>,
    );

    expect(screen.getByTestId("dataset-provider")).toBeTruthy();
    expect(screen.getByTestId("dashboard-layout")).toBeTruthy();
    expect(screen.getByText("Dashboard Child")).toBeTruthy();
  });
});
