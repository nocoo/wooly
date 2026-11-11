import { describe, expect, it } from 'vitest';
import { getDisplayName } from './user-display';

describe('getDisplayName', () => {
  it('uses profile name and avatar when present', () => {
    expect(
      getDisplayName({
        email: 'a@example.com',
        name: 'Zheng Li',
        avatar: 'https://cdn.example/a.jpg',
      }),
    ).toEqual({
      name: 'Zheng Li',
      initial: 'Z',
      email: 'a@example.com',
      avatar: 'https://cdn.example/a.jpg',
    });
  });

  it('falls back to email local-part and User label', () => {
    expect(getDisplayName({ email: 'alice@example.com', name: null, avatar: null })).toEqual({
      name: 'alice',
      initial: 'A',
      email: 'alice@example.com',
      avatar: null,
    });
    expect(getDisplayName(null)).toEqual({
      name: 'User',
      initial: 'U',
      email: null,
      avatar: null,
    });
  });
});
