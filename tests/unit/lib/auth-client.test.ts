import { describe, it, expect } from 'vitest';
import { createFetchMock } from '../helpers/next-request';
import { isAuthenticated } from '@/app/lib/auth.client';

describe('auth.client — isAuthenticated()', () => {
  it('returns true when /api/auth/check responds 200', async () => {
    createFetchMock().on(
      (url) => url.includes('/api/auth/check'),
      () => Response.json({ authenticated: true }, { status: 200 })
    );

    expect(await isAuthenticated()).toBe(true);
  });

  it('returns false when /api/auth/check responds 401', async () => {
    createFetchMock().on(
      (url) => url.includes('/api/auth/check'),
      () => Response.json({ error: 'Non authentifié' }, { status: 401 })
    );

    expect(await isAuthenticated()).toBe(false);
  });

  it('returns false when fetch throws a network error', async () => {
    createFetchMock().on(
      (url) => url.includes('/api/auth/check'),
      () => {
        throw new Error('Network error');
      }
    );

    expect(await isAuthenticated()).toBe(false);
  });

  it('calls fetch with credentials: include', async () => {
    const mock = createFetchMock();
    let capturedInit: RequestInit | undefined;

    mock.on(
      (url) => url.includes('/api/auth/check'),
      (_url, init) => {
        capturedInit = init;
        return Response.json({ authenticated: true });
      }
    );

    await isAuthenticated();

    expect(capturedInit?.credentials).toBe('include');
  });
});
