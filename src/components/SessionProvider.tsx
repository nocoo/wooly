import { createContext, useContext, useEffect, useCallback, useState, type ReactNode } from "react";

export interface SessionUser {
  email: string;
  name: string;
}

export interface SessionState {
  user: SessionUser | null;
  loading: boolean;
  error: string | null;
  reauth: () => void;
  logout: () => void;
}

const SessionContext = createContext<SessionState | null>(null);

export function SessionProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<SessionUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchSession = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/session");
      if (res.status === 401 || res.status === 403) {
        setUser(null);
        setError("登录会话已过期，请重新验证");
        return;
      }
      if (!res.ok) {
        setUser(null);
        setError("获取会话状态失败");
        return;
      }

      const contentType = res.headers.get("content-type") ?? "";
      if (!contentType.includes("application/json")) {
        setUser(null);
        setError("会话响应格式异常，请重新验证");
        return;
      }

      const data = (await res.json()) as { user?: SessionUser } | null;
      if (!data || typeof data !== "object" || !data.user || typeof data.user.email !== "string") {
        setUser(null);
        setError("登录会话无效，请重新验证");
        return;
      }

      setUser(data.user);
    } catch {
      setUser(null);
      setError("网络连接异常，无法获取会话");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchSession();
  }, [fetchSession]);

  const logout = () => {
    window.location.href = "/cdn-cgi/access/logout";
  };

  const reauth = () => {
    window.location.assign(window.location.href);
  };

  return (
    <SessionContext.Provider value={{ user, loading, error, reauth, logout }}>
      {children}
    </SessionContext.Provider>
  );
}

export function useSession(): SessionState {
  const ctx = useContext(SessionContext);
  if (!ctx) {
    throw new Error("useSession must be used within SessionProvider");
  }
  return ctx;
}
