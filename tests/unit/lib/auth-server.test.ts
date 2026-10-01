import { describe, it, expect, vi } from 'vitest';
import { createFetchMock, createMockCookieStore } from '../helpers/next-request';

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

  // Le rafraîchissement se fait dans middleware.ts : un composant serveur ne peut pas écrire de cookies.
  it('returns false on 401 without trying to refresh the token', async () => {
    const store = setupCookies({ access_token: 'expired', refresh_token: 'valid-refresh' });
    const fetchMock = createFetchMock().on(
      (url) => url.includes('/admin/notes-de-frais'),
      () => new Response(null, { status: 401 })
    );

    expect(await isAuthenticated()).toBe(false);
    expect(fetchMock.fetchFn).toHaveBeenCalledOnce();
    expect(store.set).not.toHaveBeenCalled();
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
