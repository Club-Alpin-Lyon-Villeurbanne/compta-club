import { NextRequest } from 'next/server';
import { vi } from 'vitest';

/**
 * Create a NextRequest with optional body and cookies.
 */
export function createMockRequest(
  url: string,
  options: {
    method?: string;
    body?: Record<string, unknown>;
    cookies?: Record<string, string>;
  } = {}
): NextRequest {
  const { method = 'GET', body, cookies: cookieMap } = options;

  const init: RequestInit & { headers?: Record<string, string> } = { method };

  if (body) {
    init.body = JSON.stringify(body);
    init.headers = { 'Content-Type': 'application/json' };
  }

  // Build Cookie header from map
  if (cookieMap) {
    const cookieStr = Object.entries(cookieMap)
      .map(([k, v]) => `${k}=${v}`)
      .join('; ');
    init.headers = { ...(init.headers ?? {}), Cookie: cookieStr };
  }

  return new NextRequest(new URL(url, 'http://localhost:3000'), init);
}

/**
 * Parse the JSON body + status from a NextResponse.
 */
export async function parseJsonResponse(res: Response) {
  const data = await res.json();
  return { status: res.status, data };
}

/**
 * Create a mock cookie store compatible with next/headers cookies().
 * Returns an object with get/set/delete that operates on a plain Map.
 */
export function createMockCookieStore(initial: Record<string, string> = {}) {
  const store = new Map<string, string>(Object.entries(initial));

  return {
    get: (name: string) => {
      const value = store.get(name);
      return value !== undefined ? { name, value } : undefined;
    },
    set: vi.fn((name: string, value: string) => {
      store.set(name, value);
    }),
    delete: vi.fn((name: string) => {
      store.delete(name);
    }),
    has: (name: string) => store.has(name),
    getAll: () =>
      Array.from(store.entries()).map(([name, value]) => ({ name, value })),
  };
}

type FetchRoute = {
  match: (url: string, init?: RequestInit) => boolean;
  respond: (url: string, init?: RequestInit) => Response;
};

/**
 * Install a vi.fn() as global.fetch that dispatches to registered routes.
 * Returns a builder so tests can chain `.on(...)` calls.
 *
 * Usage:
 *   const mock = createFetchMock();
 *   mock.on(url => url.includes('/auth'), () => Response.json({ token: '...' }));
 */
export function createFetchMock() {
  const routes: FetchRoute[] = [];

  const fetchFn = vi.fn(async (input: string | URL | Request, init?: RequestInit) => {
    const url = typeof input === 'string' ? input : input instanceof URL ? input.toString() : input.url;
    for (const route of routes) {
      if (route.match(url, init)) {
        return route.respond(url, init);
      }
    }
    return Response.json({ error: 'No mock matched' }, { status: 500 });
  }) as unknown as typeof global.fetch;

  function on(
    matcher: (url: string, init?: RequestInit) => boolean,
    responder: (url: string, init?: RequestInit) => Response
  ) {
    routes.push({ match: matcher, respond: responder });
    return api;
  }

  const api = { fetchFn, on };

  global.fetch = fetchFn as unknown as typeof global.fetch;

  return api;
}
