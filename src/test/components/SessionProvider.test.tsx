import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor, act } from "@testing-library/react";
import { SessionProvider, useSession } from "@/components/SessionProvider";

function TestConsumer() {
  const { user, loading, error, logout, reauth } = useSession();
  if (loading) return <div>加载中...</div>;
  if (error) return <div>错误: {error}</div>;
  if (!user) return <div>未登录</div>;
  return (
    <div>
      <div>用户: {user.name} ({user.email})</div>
      <button type="button" onClick={logout}>退出</button>
      <button type="button" onClick={reauth}>重新验证</button>
    </div>
  );
}

describe("SessionProvider", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it("throws when useSession is used outside SessionProvider", () => {
    expect(() => render(<TestConsumer />)).toThrow(
      "useSession must be used within SessionProvider",
    );
  });

  it("loads user successfully on 200 with JSON payload", async () => {
    vi.spyOn(globalThis, "fetch").mockResolvedValueOnce(
      new Response(JSON.stringify({ user: { name: "Alice", email: "alice@example.com" } }), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      }),
    );

    render(
      <SessionProvider>
        <TestConsumer />
      </SessionProvider>,
    );

    expect(screen.getByText("加载中...")).toBeTruthy();

    await waitFor(() => {
      expect(screen.getByText("用户: Alice (alice@example.com)")).toBeTruthy();
    });
  });

  it("handles 401/403 unauthorized gracefully with Chinese error", async () => {
    vi.spyOn(globalThis, "fetch").mockResolvedValueOnce(
      new Response(null, { status: 401 }),
    );

    render(
      <SessionProvider>
        <TestConsumer />
      </SessionProvider>,
    );

    await waitFor(() => {
      expect(screen.getByText("错误: 登录会话已过期，请重新验证")).toBeTruthy();
    });
  });

  it("handles 500 error response with Chinese error", async () => {
    vi.spyOn(globalThis, "fetch").mockResolvedValueOnce(
      new Response(null, { status: 500 }),
    );

    render(
      <SessionProvider>
        <TestConsumer />
      </SessionProvider>,
    );

    await waitFor(() => {
      expect(screen.getByText("错误: 获取会话状态失败")).toBeTruthy();
    });
  });

  it("handles 302 or HTML redirect response (e.g. Access login page)", async () => {
    vi.spyOn(globalThis, "fetch").mockResolvedValueOnce(
      new Response("<!DOCTYPE html><html><body>Sign in</body></html>", {
        status: 200,
        headers: { "Content-Type": "text/html; charset=utf-8" },
      }),
    );

    render(
      <SessionProvider>
        <TestConsumer />
      </SessionProvider>,
    );

    await waitFor(() => {
      expect(screen.getByText("错误: 会话响应格式异常，请重新验证")).toBeTruthy();
    });
  });

  it("handles JSON payload with missing or invalid user object", async () => {
    vi.spyOn(globalThis, "fetch").mockResolvedValueOnce(
      new Response(JSON.stringify({ user: null }), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      }),
    );

    render(
      <SessionProvider>
        <TestConsumer />
      </SessionProvider>,
    );

    await waitFor(() => {
      expect(screen.getByText("错误: 登录会话无效，请重新验证")).toBeTruthy();
    });
  });

  it("handles fetch rejection gracefully with Chinese error", async () => {
    vi.spyOn(globalThis, "fetch").mockRejectedValueOnce(new Error("Network error"));

    render(
      <SessionProvider>
        <TestConsumer />
      </SessionProvider>,
    );

    await waitFor(() => {
      expect(screen.getByText("错误: 网络连接异常，无法获取会话")).toBeTruthy();
    });
  });

  it("logout navigates to /cdn-cgi/access/logout", async () => {
    vi.spyOn(globalThis, "fetch").mockResolvedValueOnce(
      new Response(JSON.stringify({ user: { name: "Alice", email: "alice@example.com" } }), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      }),
    );

    render(
      <SessionProvider>
        <TestConsumer />
      </SessionProvider>,
    );

    await waitFor(() => {
      expect(screen.getByText("用户: Alice (alice@example.com)")).toBeTruthy();
    });

    const assignSpy = vi.fn();
    Object.defineProperty(window, "location", {
      configurable: true,
      value: { href: "", assign: assignSpy },
    });

    const logoutBtn = screen.getByRole("button", { name: "退出" });
    act(() => {
      logoutBtn.click();
    });

    expect(window.location.href).toBe("/cdn-cgi/access/logout");
  });

  it("reauth triggers full window navigation to current URL", async () => {
    vi.spyOn(globalThis, "fetch").mockResolvedValueOnce(
      new Response(JSON.stringify({ user: { name: "Alice", email: "alice@example.com" } }), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      }),
    );

    const assignSpy = vi.fn();
    Object.defineProperty(window, "location", {
      configurable: true,
      value: { href: "https://wooly.test/sources", assign: assignSpy },
    });

    render(
      <SessionProvider>
        <TestConsumer />
      </SessionProvider>,
    );

    await waitFor(() => {
      expect(screen.getByText("用户: Alice (alice@example.com)")).toBeTruthy();
    });

    const reauthBtn = screen.getByRole("button", { name: "重新验证" });
    act(() => {
      reauthBtn.click();
    });

    expect(assignSpy).toHaveBeenCalledWith("https://wooly.test/sources");
  });
});
