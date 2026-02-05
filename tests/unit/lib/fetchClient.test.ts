import { describe, it, expect } from 'vitest';
import { createFetchMock } from '../helpers/next-request';
import { fetchClient, get, post, patch, del } from '@/app/lib/fetchClient';

describe('fetchClient', () => {
  it('returns parsed JSON on success', async () => {
    createFetchMock().on(
      (url) => url.includes('/data'),
      () => Response.json({ items: [1, 2, 3] })
    );

    const result = await fetchClient('/data');
    expect(result).toEqual({ items: [1, 2, 3] });
  });

  it('appends query params when options.params is provided', async () => {
    let capturedUrl = '';
    createFetchMock().on(
      (url) => url.includes('/search'),
      (url) => {
        capturedUrl = url;
        return Response.json({ results: [] });
      }
    );

    await fetchClient('/search', { params: { q: 'hello', page: '2' } });

    expect(capturedUrl).toContain('q=hello');
    expect(capturedUrl).toContain('page=2');
  });

  it('includes credentials: include on every request', async () => {
    let capturedInit: RequestInit | undefined;
    createFetchMock().on(
      (url) => url.includes('/test'),
      (_url, init) => {
        capturedInit = init;
        return Response.json({});
      }
    );

    await fetchClient('/test');
    expect(capturedInit?.credentials).toBe('include');
  });

  it('retries after 401 by calling /api/auth/check then repeating request', async () => {
    let callCount = 0;
    createFetchMock()
      .on(
        (url) => url.includes('/api/auth/check'),
        () => Response.json({ authenticated: true })
      )
      .on(
        (url) => url.includes('/data'),
        () => {
          callCount++;
          if (callCount === 1) {
            return Response.json({ error: 'Expired' }, { status: 401 });
          }
          return Response.json({ ok: true });
        }
      );

    const result = await fetchClient('/data');
    expect(result).toEqual({ ok: true });
    expect(callCount).toBe(2);
  });

  it('throws when auth/check also fails (no infinite retry)', async () => {
    createFetchMock()
      .on(
        (url) => url.includes('/api/auth/check'),
        () => Response.json({ error: 'No refresh' }, { status: 401 })
      )
      .on(
        (url) => url.includes('/data'),
        () => Response.json({}, { status: 401 })
      );

    await expect(fetchClient('/data')).rejects.toThrow();
  });

  it('throws on non-401 error responses', async () => {
    createFetchMock().on(
      (url) => url.includes('/data'),
      () => Response.json({ error: 'Not Found' }, { status: 404 })
    );

    await expect(fetchClient('/data')).rejects.toThrow('Not Found');
  });

  it('get() helper uses GET method', async () => {
    let capturedInit: RequestInit | undefined;
    createFetchMock().on(
      () => true,
      (_url, init) => {
        capturedInit = init;
        return Response.json({});
      }
    );

    await get('/resource');
    expect(capturedInit?.method).toBe('GET');
  });

  it('post() helper sends JSON body', async () => {
    let capturedBody: string | undefined;
    createFetchMock().on(
      () => true,
      (_url, init) => {
        capturedBody = init?.body as string;
        return Response.json({});
      }
    );

    await post('/resource', { name: 'test' });
    expect(JSON.parse(capturedBody!)).toEqual({ name: 'test' });
  });

  it('patch() helper sends JSON body with PATCH method', async () => {
    let capturedInit: RequestInit | undefined;
    createFetchMock().on(
      () => true,
      (_url, init) => {
        capturedInit = init;
        return Response.json({});
      }
    );

    await patch('/resource/1', { status: 'approved' });
    expect(capturedInit?.method).toBe('PATCH');
    expect(JSON.parse(capturedInit?.body as string)).toEqual({ status: 'approved' });
  });

  it('del() helper uses DELETE method', async () => {
    let capturedInit: RequestInit | undefined;
    createFetchMock().on(
      () => true,
      (_url, init) => {
        capturedInit = init;
        return Response.json({});
      }
    );

    await del('/resource/1');
    expect(capturedInit?.method).toBe('DELETE');
  });
});
