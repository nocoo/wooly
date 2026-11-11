import { describe, expect, it, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { useMe } from './use-me';

describe('useMe', () => {
  const fetchMock = vi.fn();

  beforeEach(() => {
    fetchMock.mockReset();
    vi.stubGlobal('fetch', fetchMock);
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('loads user info from /api/me', async () => {
    fetchMock.mockResolvedValue(
      new Response(
        JSON.stringify({
          email: 'reader@example.com',
          name: 'Reader',
          avatar: 'https://cdn.example/a.jpg',
          authenticated: true,
        }),
        { status: 200, headers: { 'content-type': 'application/json' } },
      ),
    );

    const { result } = renderHook(() => useMe());

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(fetchMock).toHaveBeenCalledWith('/api/me');
    expect(result.current.data).toEqual({
      email: 'reader@example.com',
      name: 'Reader',
      avatar: 'https://cdn.example/a.jpg',
      authenticated: true,
    });
    expect(result.current.error).toBeNull();
  });

  it('surfaces HTTP errors', async () => {
    fetchMock.mockResolvedValue(new Response('unauthorized', { status: 401 }));

    const { result } = renderHook(() => useMe());

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.data).toBeUndefined();
    expect(result.current.error).toMatch(/401/);
  });

  it('surfaces network failures', async () => {
    fetchMock.mockRejectedValue(new Error('offline'));

    const { result } = renderHook(() => useMe());

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.data).toBeUndefined();
    expect(result.current.error).toMatch(/网络/);
  });
});
