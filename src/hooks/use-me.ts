import { useCallback, useEffect, useState } from 'react';

export interface UserInfo {
  email: string | null;
  name: string | null;
  avatar: string | null;
  authenticated: boolean;
}

export interface UseMeResult {
  data: UserInfo | undefined;
  loading: boolean;
  error: string | null;
  refetch: () => void;
}

export function useMe(): UseMeResult {
  const [data, setData] = useState<UserInfo | undefined>();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refetch = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/me');
      if (!res.ok) {
        setData(undefined);
        setError(`获取用户信息失败（${res.status}）`);
        return;
      }
      const json = (await res.json()) as UserInfo;
      setData(json);
    } catch {
      setData(undefined);
      setError('网络连接异常，无法获取用户信息');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void refetch();
  }, [refetch]);

  return { data, loading, error, refetch };
}
