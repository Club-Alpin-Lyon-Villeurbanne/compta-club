import { describe, it, expect, vi } from 'vitest';
import { NextRequest } from 'next/server';
import { mockExpenseReports } from '@/tests/mocks/fixtures';
import {
  createFetchMock,
  createMockCookieStore,
  parseJsonResponse,
} from '../../helpers/next-request';

// Mock next/headers (used by the route to read cookies)
vi.mock('next/headers', () => ({
  cookies: vi.fn(),
}));

import { cookies } from 'next/headers';
import { GET } from '@/app/api/expense-reports/route';

const ROUTE_URL = 'http://localhost:3000/api/expense-reports';
const API = process.env.NEXT_PUBLIC_API_URL!;

describe('GET /api/expense-reports', () => {
  function setupCookies(initial: Record<string, string> = {}) {
    const store = createMockCookieStore(initial);
    vi.mocked(cookies).mockResolvedValue(store as any);
    return store;
  }

  function makeRequest() {
    return new NextRequest(new URL(ROUTE_URL));
  }

  it('returns 401 when no access_token cookie', async () => {
    setupCookies({});

    const { status, data } = await parseJsonResponse(await GET(makeRequest()));
    expect(status).toBe(401);
    expect(data.error).toBe('Non authentifié');
  });

  it('returns expense reports from external API', async () => {
    setupCookies({ access_token: 'tok' });
    createFetchMock().on(
      (url) => url.includes('/admin/notes-de-frais'),
      () => Response.json(mockExpenseReports)
    );

    const { status, data } = await parseJsonResponse(await GET(makeRequest()));
    expect(status).toBe(200);
    expect(data).toEqual(mockExpenseReports);
  });

  it('forwards paginated response as-is', async () => {
    setupCookies({ access_token: 'tok' });
    const paginatedResponse = { data: mockExpenseReports, meta: { page: 1, perPage: 10, total: 5, pages: 1 } };
    createFetchMock().on(
      (url) => url.includes('/admin/notes-de-frais'),
      () => Response.json(paginatedResponse)
    );

    const { data } = await parseJsonResponse(await GET(makeRequest()));
    expect(data).toEqual(paginatedResponse);
  });

  it('sends Authorization header with token', async () => {
    setupCookies({ access_token: 'my-secret-tok' });
    let capturedHeaders: Record<string, string> | undefined;

    createFetchMock().on(
      (url) => url.includes('/admin/notes-de-frais'),
      (_url, init) => {
        capturedHeaders = init?.headers as Record<string, string>;
        return Response.json([]);
      }
    );

    await GET(makeRequest());
    expect(capturedHeaders?.Authorization).toBe('Bearer my-secret-tok');
  });

  it('forwards client query params to backend', async () => {
    setupCookies({ access_token: 'tok' });
    let capturedUrl = '';

    createFetchMock().on(
      (url) => url.includes('/admin/notes-de-frais'),
      (url) => {
        capturedUrl = url;
        return Response.json({ data: [], meta: { page: 1, perPage: 10, total: 0, pages: 0 } });
      }
    );

    const reqWithParams = new NextRequest(new URL(`${ROUTE_URL}?status=submitted&page=2`));
    await GET(reqWithParams);
    expect(capturedUrl).toContain('status=submitted');
    expect(capturedUrl).toContain('page=2');
    expect(capturedUrl).not.toContain('pagination=false');
  });

  it('forwards error status from external API', async () => {
    setupCookies({ access_token: 'tok' });
    createFetchMock().on(
      (url) => url.includes('/admin/notes-de-frais'),
      () => Response.json({ error: 'Server Error' }, { status: 503 })
    );

    const { status } = await parseJsonResponse(await GET(makeRequest()));
    expect(status).toBe(503);
  });

  it('returns 500 on unexpected error', async () => {
    setupCookies({ access_token: 'tok' });
    createFetchMock().on(
      () => true,
      () => {
        throw new Error('Network down');
      }
    );

    const { status } = await parseJsonResponse(await GET(makeRequest()));
    expect(status).toBe(500);
  });
});
