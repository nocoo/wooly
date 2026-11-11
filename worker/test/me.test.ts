import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { AUTHOR_PROFILE_URL, hashEmail } from '../src/lib/author-profile.js';
import { handleMe } from '../src/routes/me.js';
import { makeEnv, stubDb } from './env.js';

const fetchMock = vi.fn();

beforeEach(() => {
  fetchMock.mockReset();
  fetchMock.mockResolvedValue(
    new Response(JSON.stringify({ name: null, avatar: null }), { status: 200 }),
  );
  vi.stubGlobal('fetch', fetchMock);
});

afterEach(() => {
  vi.unstubAllGlobals();
});

describe('handleMe', () => {
  it('returns JWT name when author profile misses', async () => {
    const res = await handleMe(
      { email: 'zheng@example.com', name: 'Zheng' },
      makeEnv({ DB: stubDb() }),
    );
    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({
      email: 'zheng@example.com',
      name: 'Zheng',
      avatar: null,
      authenticated: true,
    });
    expect(fetchMock).toHaveBeenCalledOnce();
    const [url] = fetchMock.mock.calls[0] as [string];
    expect(url).toBe(`${AUTHOR_PROFILE_URL}?hash=${await hashEmail('zheng@example.com')}`);
  });

  it('prefers author profile name and avatar on a hit', async () => {
    fetchMock.mockResolvedValue(
      new Response(
        JSON.stringify({
          name: 'Zheng Li',
          avatar: 'https://cdn.example/avatar-80.jpg',
        }),
        { status: 200 },
      ),
    );
    const res = await handleMe(
      { email: 'architie@gmail.com', name: 'architie' },
      makeEnv({ DB: stubDb() }),
    );
    expect(await res.json()).toEqual({
      email: 'architie@gmail.com',
      name: 'Zheng Li',
      avatar: 'https://cdn.example/avatar-80.jpg',
      authenticated: true,
    });
  });

  it('keeps JWT name when author profile returns 429', async () => {
    fetchMock.mockResolvedValue(new Response('rate limited', { status: 429 }));
    const res = await handleMe(
      { email: 'alice@example.com', name: 'Alice' },
      makeEnv({ DB: stubDb() }),
    );
    expect(await res.json()).toEqual({
      email: 'alice@example.com',
      name: 'Alice',
      avatar: null,
      authenticated: true,
    });
  });
});
