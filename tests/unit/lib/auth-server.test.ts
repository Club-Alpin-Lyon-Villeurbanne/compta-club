import { describe, it, expect, vi } from 'vitest';
import { createFetchMock, createMockCookieStore } from '../helpers/next-request';
import { mockRefreshResponse } from '@/tests/mocks/fixtures';

// Mock next/headers
vi.mock('next/headers', () => ({
  cookies: vi.fn(),
}));

import { cookies } from 'next/headers';
import { isAuthenticated } from '@/app/lib/auth.server';

describe('auth.server — isAuthenticated()', () => {
  function setupCookies(initial: Record<string, string> = {}) {
    const store = createMockCookieStore(initial);
    vi.mocked(cookies).mockResolvedValue(store as any);
    return store;
  }

  it('returns false when no access_token cookie', async () => {
    setupCookies({});
    expect(await isAuthenticated()).toBe(false);
  });

  it('returns true when HEAD request succeeds (200)', async () => {
    setupCookies({ access_token: 'valid-tok' });
    createFetchMock().on(
      (url) => url.includes('/admin/notes-de-frais'),
      () => new Response(null, { status: 200 })
    );

    expect(await isAuthenticated()).toBe(true);
  });

  it('returns false when HEAD fails with non-401 status', async () => {
    setupCookies({ access_token: 'tok' });
    createFetchMock().on(
      (url) => url.includes('/admin/notes-de-frais'),
      () => new Response(null, { status: 403 })
    );

    expect(await isAuthenticated()).toBe(false);
  });

  it('returns false when token expired and no refresh_token', async () => {
    setupCookies({ access_token: 'expired' });
    createFetchMock().on(
      (url) => url.includes('/admin/notes-de-frais'),
      () => new Response(null, { status: 401 })
    );

    expect(await isAuthenticated()).toBe(false);
  });

  it('refreshes token and returns true on successful refresh cycle', async () => {
    const store = setupCookies({
      access_token: 'expired',
      refresh_token: 'valid-refresh',
    });

    let headCallCount = 0;
    createFetchMock()
      .on(
        (url, init) =>
          url.includes('/admin/notes-de-frais') && init?.method === 'HEAD',
        () => {
          headCallCount++;
          if (headCallCount === 1) {
            return new Response(null, { status: 401 });
          }
          return new Response(null, { status: 200 });
        }
      )
      .on(
        (url) => url.includes('/token/refresh'),
        () => Response.json(mockRefreshResponse)
      );

    expect(await isAuthenticated()).toBe(true);
    expect(store.set).toHaveBeenCalledWith(
      'access_token',
      mockRefreshResponse.token,
      expect.any(Object)
    );
    expect(store.set).toHaveBeenCalledWith(
      'refresh_token',
      mockRefreshResponse.refresh_token,
      expect.any(Object)
    );
  });

  it('returns false when refresh API call fails', async () => {
    setupCookies({
      access_token: 'expired',
      refresh_token: 'bad-refresh',
    });

    createFetchMock()
      .on(
        (url) => url.includes('/admin/notes-de-frais'),
        () => new Response(null, { status: 401 })
      )
      .on(
        (url) => url.includes('/token/refresh'),
        () => Response.json({ error: 'Invalid' }, { status: 401 })
      );

    expect(await isAuthenticated()).toBe(false);
  });

  it('returns false when refresh returns empty tokens', async () => {
    setupCookies({
      access_token: 'expired',
      refresh_token: 'valid-refresh',
    });

    createFetchMock()
      .on(
        (url) => url.includes('/admin/notes-de-frais'),
        () => new Response(null, { status: 401 })
      )
      .on(
        (url) => url.includes('/token/refresh'),
        () => Response.json({ token: null, refresh_token: null })
      );

    expect(await isAuthenticated()).toBe(false);
  });

  it('returns false on network error', async () => {
    setupCookies({ access_token: 'tok' });
    createFetchMock().on(
      () => true,
      () => {
        throw new Error('Network error');
      }
    );

    expect(await isAuthenticated()).toBe(false);
  });
});
