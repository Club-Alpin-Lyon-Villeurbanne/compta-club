import { describe, it, expect } from 'vitest';
import { GET } from '@/app/api/auth/check/route';
import {
  createMockRequest,
  createFetchMock,
  parseJsonResponse,
} from '../../helpers/next-request';
import { mockRefreshResponse } from '@/tests/mocks/fixtures';

const CHECK_URL = 'http://localhost:3000/api/auth/check';

describe('GET /api/auth/check', () => {
  it('returns 401 when no access_token cookie', async () => {
    const req = createMockRequest(CHECK_URL);
    const { status, data } = await parseJsonResponse(await GET(req));

    expect(status).toBe(401);
    expect(data.error).toBe('Non authentifié');
  });

  it('returns 200 when token is valid', async () => {
    createFetchMock().on(
      (url) => url.includes('/admin/notes-de-frais'),
      () => new Response(null, { status: 200 })
    );

    const req = createMockRequest(CHECK_URL, {
      cookies: { access_token: 'valid-token' },
    });
    const { status, data } = await parseJsonResponse(await GET(req));

    expect(status).toBe(200);
    expect(data.authenticated).toBe(true);
  });

  it('returns 403, not 401, when the account lost its management rights', async () => {
    createFetchMock().on(
      (url) => url.includes('/admin/notes-de-frais'),
      () => new Response(null, { status: 403 })
    );

    const req = createMockRequest(CHECK_URL, {
      cookies: { access_token: 'some-token' },
    });
    const { status } = await parseJsonResponse(await GET(req));

    expect(status).toBe(403);
  });

  it.each([429, 502])('returns 502, not 401, when HEAD returns %i', async (apiStatus) => {
    createFetchMock().on(
      (url) => url.includes('/admin/notes-de-frais'),
      () => new Response(null, { status: apiStatus })
    );

    const req = createMockRequest(CHECK_URL, {
      cookies: { access_token: 'some-token' },
    });
    const { status } = await parseJsonResponse(await GET(req));

    expect(status).toBe(502);
  });

  it('returns 502, not 401, when the refresh endpoint is down', async () => {
    createFetchMock()
      .on(
        (url) => url.includes('/admin/notes-de-frais'),
        () => new Response(null, { status: 401 })
      )
      .on(
        (url) => url.includes('/token/refresh'),
        () => new Response(null, { status: 503 })
      );

    const req = createMockRequest(CHECK_URL, {
      cookies: { access_token: 'expired', refresh_token: 'valid-refresh' },
    });
    const { status } = await parseJsonResponse(await GET(req));

    expect(status).toBe(502);
  });

  it('returns 502 but keeps the refreshed tokens when the retried request fails for another reason than 401', async () => {
    createFetchMock()
      .on(
        (url) => url.includes('/admin/notes-de-frais'),
        (_url, init) => new Response(null, { status: init?.method === 'HEAD' ? 401 : 500 })
      )
      .on(
        (url) => url.includes('/token/refresh'),
        () => Response.json(mockRefreshResponse)
      );

    const req = createMockRequest(CHECK_URL, {
      cookies: { access_token: 'expired', refresh_token: 'valid-refresh' },
    });
    const response = await GET(req);

    expect(response.status).toBe(502);
    expect(response.cookies.get('access_token')?.value).toBe(mockRefreshResponse.token);
    expect(response.cookies.get('refresh_token')?.value).toBe(mockRefreshResponse.refresh_token);
  });

  it('returns 401 when token expired and no refresh_token', async () => {
    createFetchMock().on(
      (url) => url.includes('/admin/notes-de-frais'),
      () => new Response(null, { status: 401 })
    );

    const req = createMockRequest(CHECK_URL, {
      cookies: { access_token: 'expired' },
    });
    const { status } = await parseJsonResponse(await GET(req));

    expect(status).toBe(401);
  });

  it('refreshes token and returns 200 with new cookies', async () => {
    let headCallCount = 0;
    createFetchMock()
      .on(
        (url) => url.includes('/admin/notes-de-frais'),
        () => {
          headCallCount++;
          if (headCallCount === 1) {
            return new Response(null, { status: 401 });
          }
          return Response.json({}, { status: 200 });
        }
      )
      .on(
        (url) => url.includes('/token/refresh'),
        () => Response.json(mockRefreshResponse)
      );

    const req = createMockRequest(CHECK_URL, {
      cookies: {
        access_token: 'expired',
        refresh_token: 'valid-refresh',
      },
    });
    const res = await GET(req);
    const { status, data } = await parseJsonResponse(res);

    expect(status).toBe(200);
    expect(data.authenticated).toBe(true);

    // Verify new cookies are set
    const setCookies = res.headers.getSetCookie();
    const accessCookie = setCookies.find((c) => c.startsWith('access_token='));
    const refreshCookie = setCookies.find((c) =>
      c.startsWith('refresh_token=')
    );
    expect(accessCookie).toContain(mockRefreshResponse.token);
    expect(accessCookie).toContain('HttpOnly');
    expect(refreshCookie).toContain(mockRefreshResponse.refresh_token);
    expect(refreshCookie).toContain('HttpOnly');
  });

  it('returns 401 when refresh API fails', async () => {
    createFetchMock()
      .on(
        (url) => url.includes('/admin/notes-de-frais'),
        () => new Response(null, { status: 401 })
      )
      .on(
        (url) => url.includes('/token/refresh'),
        () => Response.json({ error: 'Bad refresh' }, { status: 401 })
      );

    const req = createMockRequest(CHECK_URL, {
      cookies: {
        access_token: 'expired',
        refresh_token: 'bad-refresh',
      },
    });
    const { status } = await parseJsonResponse(await GET(req));

    expect(status).toBe(401);
  });

  it('returns 500 when refresh returns missing tokens', async () => {
    createFetchMock()
      .on(
        (url) => url.includes('/admin/notes-de-frais'),
        () => new Response(null, { status: 401 })
      )
      .on(
        (url) => url.includes('/token/refresh'),
        () => Response.json({ token: 'new', refresh_token: null })
      );

    const req = createMockRequest(CHECK_URL, {
      cookies: {
        access_token: 'expired',
        refresh_token: 'valid-refresh',
      },
    });
    const { status } = await parseJsonResponse(await GET(req));

    expect(status).toBe(500);
  });

  it('returns 401 when retried request still fails after refresh', async () => {
    createFetchMock()
      .on(
        (url) => url.includes('/admin/notes-de-frais'),
        () => new Response(null, { status: 401 })
      )
      .on(
        (url) => url.includes('/token/refresh'),
        () => Response.json(mockRefreshResponse)
      );

    // Both calls to /admin/notes-de-frais return 401 (HEAD then GET retry)
    const req = createMockRequest(CHECK_URL, {
      cookies: {
        access_token: 'expired',
        refresh_token: 'valid-refresh',
      },
    });
    const { status } = await parseJsonResponse(await GET(req));

    expect(status).toBe(401);
  });

  it('sends refresh_token in POST body to refresh endpoint', async () => {
    let capturedBody: string | undefined;
    let headCallCount = 0;

    createFetchMock()
      .on(
        (url) => url.includes('/admin/notes-de-frais'),
        () => {
          headCallCount++;
          if (headCallCount === 1) return new Response(null, { status: 401 });
          return Response.json({}, { status: 200 });
        }
      )
      .on(
        (url) => url.includes('/token/refresh'),
        (_url, init) => {
          capturedBody = init?.body as string;
          return Response.json(mockRefreshResponse);
        }
      );

    const req = createMockRequest(CHECK_URL, {
      cookies: {
        access_token: 'expired',
        refresh_token: 'my-refresh-token',
      },
    });
    await GET(req);

    expect(JSON.parse(capturedBody!)).toEqual({
      refresh_token: 'my-refresh-token',
    });
  });

  it('returns 500 on unexpected error', async () => {
    createFetchMock().on(
      () => true,
      () => {
        throw new Error('Unexpected');
      }
    );

    const req = createMockRequest(CHECK_URL, {
      cookies: { access_token: 'tok' },
    });
    const { status } = await parseJsonResponse(await GET(req));

    expect(status).toBe(500);
  });
});
