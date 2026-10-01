import { describe, it, expect } from 'vitest';
import { createFetchMock, createMockRequest } from './helpers/next-request';
import { middleware } from '@/middleware';

const API = process.env.NEXT_PUBLIC_API_URL!;

// JWT non signé : le middleware ne lit que la date d'expiration, le backend vérifie la signature.
function jwt(expiresInSeconds: number) {
  const encode = (value: object) => Buffer.from(JSON.stringify(value)).toString('base64url');
  const exp = Math.floor(Date.now() / 1000) + expiresInSeconds;
  return `${encode({ alg: 'RS256', typ: 'JWT' })}.${encode({ username: 'tresorier', exp })}.signature`;
}

function pageRequest(cookies: Record<string, string>) {
  return createMockRequest('/note-de-frais', { cookies });
}

describe('middleware — rafraîchissement de la session', () => {
  it('lets a request with a valid access token through without refreshing', async () => {
    const fetchMock = createFetchMock();

    const response = await middleware(pageRequest({ access_token: jwt(3600), refresh_token: 'refresh-1' }));

    expect(fetchMock.fetchFn).not.toHaveBeenCalled();
    expect(response.cookies.get('access_token')).toBeUndefined();
  });

  it('refreshes an expired access token and passes the new one to the page', async () => {
    const newToken = jwt(3600);
    let sentBody: unknown;
    const fetchMock = createFetchMock().on(
      (url) => url === `${API}/token/refresh`,
      (_url, init) => {
        sentBody = JSON.parse(String(init?.body));
        return Response.json({ token: newToken, refresh_token: 'refresh-2' });
      }
    );

    const response = await middleware(pageRequest({ access_token: jwt(-60), refresh_token: 'refresh-1' }));

    expect(fetchMock.fetchFn).toHaveBeenCalledOnce();
    expect(sentBody).toEqual({ refresh_token: 'refresh-1' });
    // Cookies renvoyés au navigateur
    expect(response.cookies.get('access_token')?.value).toBe(newToken);
    expect(response.cookies.get('refresh_token')?.value).toBe('refresh-2');
    expect(response.cookies.get('access_token')?.httpOnly).toBe(true);
    // Cookies vus par la page rendue dans la même requête (en-tête posé par NextResponse.next({ request }))
    expect(response.headers.get('x-middleware-request-cookie')).toContain(`access_token=${newToken}`);
  });

  it('refreshes when the access cookie is missing but a refresh token remains', async () => {
    const fetchMock = createFetchMock().on(
      (url) => url === `${API}/token/refresh`,
      () => Response.json({ token: jwt(3600), refresh_token: 'refresh-2' })
    );

    const response = await middleware(pageRequest({ refresh_token: 'refresh-1' }));

    expect(fetchMock.fetchFn).toHaveBeenCalledOnce();
    expect(response.cookies.get('refresh_token')?.value).toBe('refresh-2');
  });

  it('refreshes a token about to expire', async () => {
    const fetchMock = createFetchMock().on(
      (url) => url === `${API}/token/refresh`,
      () => Response.json({ token: jwt(3600), refresh_token: 'refresh-2' })
    );

    await middleware(pageRequest({ access_token: jwt(10), refresh_token: 'refresh-1' }));

    expect(fetchMock.fetchFn).toHaveBeenCalledOnce();
  });

  it('does nothing without refresh token', async () => {
    const fetchMock = createFetchMock();

    const response = await middleware(pageRequest({ access_token: jwt(-60) }));

    expect(fetchMock.fetchFn).not.toHaveBeenCalled();
    expect(response.cookies.get('access_token')).toBeUndefined();
  });

  it('leaves the cookies untouched when the backend refuses the refresh', async () => {
    createFetchMock().on(
      (url) => url === `${API}/token/refresh`,
      () => Response.json({ code: 401, message: 'JWT Refresh Token Not Found' }, { status: 401 })
    );

    const response = await middleware(pageRequest({ access_token: jwt(-60), refresh_token: 'refresh-1' }));

    // La page voit toujours le jeton expiré et renvoie vers la connexion
    expect(response.cookies.get('access_token')).toBeUndefined();
    expect(response.headers.get('x-middleware-request-cookie')).toBeNull();
  });

  it('leaves the cookies untouched when the backend is unreachable', async () => {
    const fetchMock = createFetchMock();
    fetchMock.on(() => true, () => { throw new TypeError('fetch failed'); });

    const response = await middleware(pageRequest({ access_token: jwt(-60), refresh_token: 'refresh-1' }));

    expect(response.cookies.get('access_token')).toBeUndefined();
  });
});
