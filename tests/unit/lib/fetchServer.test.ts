import { describe, it, expect, vi } from 'vitest';
import { createFetchMock, createMockCookieStore } from '../helpers/next-request';

// Mock next/headers before importing fetchServer
vi.mock('next/headers', () => ({
  cookies: vi.fn(),
}));

import { cookies } from 'next/headers';
import { fetchServer, get, post, patch, del } from '@/app/lib/fetchServer';

const API = process.env.NEXT_PUBLIC_API_URL!;

describe('fetchServer', () => {
  function setupCookies(initial: Record<string, string> = {}) {
    const store = createMockCookieStore(initial);
    vi.mocked(cookies).mockResolvedValue(store as any);
    return store;
  }

  it('adds Authorization header when access_token cookie exists', async () => {
    setupCookies({ access_token: 'tok123' });
    let capturedHeaders: HeadersInit | undefined;

    createFetchMock().on(
      () => true,
      (_url, init) => {
        capturedHeaders = init?.headers as Record<string, string>;
        return Response.json({ ok: true });
      }
    );

    await fetchServer(`${API}/data`);
    expect(capturedHeaders).toHaveProperty('Authorization', 'Bearer tok123');
  });

  it('does not add Authorization header when no access_token', async () => {
    setupCookies({});
    let capturedHeaders: Record<string, string> | undefined;

    createFetchMock().on(
      () => true,
      (_url, init) => {
        capturedHeaders = init?.headers as Record<string, string>;
        return Response.json({});
      }
    );

    await fetchServer(`${API}/data`);
    expect(capturedHeaders).not.toHaveProperty('Authorization');
  });

  it('sets cache: no-store', async () => {
    setupCookies({});
    let capturedInit: RequestInit | undefined;

    createFetchMock().on(
      () => true,
      (_url, init) => {
        capturedInit = init;
        return Response.json({});
      }
    );

    await fetchServer(`${API}/data`);
    expect(capturedInit?.cache).toBe('no-store');
  });

  it('appends query params', async () => {
    setupCookies({});
    let capturedUrl = '';

    createFetchMock().on(
      () => true,
      (url) => {
        capturedUrl = url;
        return Response.json({});
      }
    );

    await fetchServer(`${API}/data`, { params: { page: '1' } });
    expect(capturedUrl).toContain('page=1');
  });

  it('returns parsed JSON on success', async () => {
    setupCookies({});
    createFetchMock().on(
      () => true,
      () => Response.json({ items: [1] })
    );

    const result = await fetchServer(`${API}/data`);
    expect(result).toEqual({ items: [1] });
  });

  it('throws on non-ok response', async () => {
    setupCookies({});
    createFetchMock().on(
      () => true,
      () => Response.json({ error: 'Forbidden' }, { status: 403 })
    );

    await expect(fetchServer(`${API}/data`)).rejects.toThrow('Forbidden');
  });

  it('throws on network error', async () => {
    setupCookies({});
    createFetchMock().on(
      () => true,
      () => {
        throw new Error('ECONNREFUSED');
      }
    );

    await expect(fetchServer(`${API}/data`)).rejects.toThrow('ECONNREFUSED');
  });

  it('get() helper uses GET method', async () => {
    setupCookies({});
    let method: string | undefined;

    createFetchMock().on(
      () => true,
      (_url, init) => {
        method = init?.method;
        return Response.json({});
      }
    );

    await get(`${API}/resource`);
    expect(method).toBe('GET');
  });

  it('post() sends JSON body with Content-Type', async () => {
    setupCookies({});
    let capturedHeaders: Record<string, string> | undefined;
    let capturedBody: string | undefined;

    createFetchMock().on(
      () => true,
      (_url, init) => {
        capturedHeaders = init?.headers as Record<string, string>;
        capturedBody = init?.body as string;
        return Response.json({});
      }
    );

    await post(`${API}/resource`, { name: 'test' });
    expect(capturedHeaders).toHaveProperty('Content-Type', 'application/json');
    expect(JSON.parse(capturedBody!)).toEqual({ name: 'test' });
  });

  it('patch() sends JSON body with PATCH method', async () => {
    setupCookies({});
    let capturedInit: RequestInit | undefined;

    createFetchMock().on(
      () => true,
      (_url, init) => {
        capturedInit = init;
        return Response.json({});
      }
    );

    await patch(`${API}/resource/1`, { status: 'approved' });
    expect(capturedInit?.method).toBe('PATCH');
    expect(JSON.parse(capturedInit?.body as string)).toEqual({ status: 'approved' });
  });

  it('del() uses DELETE method', async () => {
    setupCookies({});
    let method: string | undefined;

    createFetchMock().on(
      () => true,
      (_url, init) => {
        method = init?.method;
        return Response.json({});
      }
    );

    await del(`${API}/resource/1`);
    expect(method).toBe('DELETE');
  });
});
