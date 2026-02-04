import { describe, it, expect } from 'vitest';
import { POST } from '@/app/api/auth/login/route';
import {
  createMockRequest,
  createFetchMock,
  parseJsonResponse,
} from '../../helpers/next-request';
import { mockAuthResponse } from '@/tests/mocks/fixtures';

const LOGIN_URL = 'http://localhost:3000/api/auth/login';
const API_AUTH = `${process.env.NEXT_PUBLIC_API_URL}/auth`;

describe('POST /api/auth/login', () => {
  it('returns 400 when email is missing', async () => {
    const req = createMockRequest(LOGIN_URL, {
      method: 'POST',
      body: { password: 'secret' },
    });
    const { status, data } = await parseJsonResponse(await POST(req));

    expect(status).toBe(400);
    expect(data.error).toBe('Email et mot de passe requis');
  });

  it('returns 400 when password is missing', async () => {
    const req = createMockRequest(LOGIN_URL, {
      method: 'POST',
      body: { email: 'a@b.com' },
    });
    const { status, data } = await parseJsonResponse(await POST(req));

    expect(status).toBe(400);
    expect(data.error).toBe('Email et mot de passe requis');
  });

  it('returns 400 when email is not a string', async () => {
    const req = createMockRequest(LOGIN_URL, {
      method: 'POST',
      body: { email: 123, password: 'secret' },
    });
    const { status } = await parseJsonResponse(await POST(req));

    expect(status).toBe(400);
  });

  it('returns 400 when password is not a string', async () => {
    const req = createMockRequest(LOGIN_URL, {
      method: 'POST',
      body: { email: 'a@b.com', password: true },
    });
    const { status } = await parseJsonResponse(await POST(req));

    expect(status).toBe(400);
  });

  it('returns 401 when external API rejects credentials', async () => {
    createFetchMock().on(
      (url) => url === API_AUTH,
      () => Response.json({ message: 'Invalid' }, { status: 401 })
    );

    const req = createMockRequest(LOGIN_URL, {
      method: 'POST',
      body: { email: 'bad@test.com', password: 'wrong' },
    });
    const { status, data } = await parseJsonResponse(await POST(req));

    expect(status).toBe(401);
    expect(data.error).toBe('Identifiants invalides');
  });

  it('returns 500 when response is missing tokens', async () => {
    createFetchMock().on(
      (url) => url === API_AUTH,
      () => Response.json({ user: mockAuthResponse.user }) // no token/refresh_token
    );

    const req = createMockRequest(LOGIN_URL, {
      method: 'POST',
      body: { email: 'a@b.com', password: 'pass' },
    });
    const { status, data } = await parseJsonResponse(await POST(req));

    expect(status).toBe(500);
    expect(data.error).toContain('tokens manquants');
  });

  it('returns 500 when external API throws a network error', async () => {
    createFetchMock().on(
      (url) => url === API_AUTH,
      () => {
        throw new Error('Network failure');
      }
    );

    const req = createMockRequest(LOGIN_URL, {
      method: 'POST',
      body: { email: 'a@b.com', password: 'pass' },
    });
    const { status } = await parseJsonResponse(await POST(req));

    expect(status).toBe(500);
  });

  it('returns 200 and sets cookies on successful login', async () => {
    createFetchMock().on(
      (url) => url === API_AUTH,
      () => Response.json(mockAuthResponse)
    );

    const req = createMockRequest(LOGIN_URL, {
      method: 'POST',
      body: { email: 'admin@test.com', password: 'correct' },
    });
    const res = await POST(req);
    const { status, data } = await parseJsonResponse(res);

    expect(status).toBe(200);
    expect(data.message).toBe('Connexion réussie');

    const setCookies = res.headers.getSetCookie();
    const accessCookie = setCookies.find((c) => c.startsWith('access_token='));
    const refreshCookie = setCookies.find((c) =>
      c.startsWith('refresh_token=')
    );

    expect(accessCookie).toBeDefined();
    expect(accessCookie).toContain(mockAuthResponse.token);
    expect(accessCookie).toContain('HttpOnly');
    expect(accessCookie).toContain('Path=/');
    expect(refreshCookie).toBeDefined();
    expect(refreshCookie).toContain(mockAuthResponse.refresh_token);
    expect(refreshCookie).toContain('HttpOnly');
  });

  it('forwards email and password to the external API', async () => {
    const mock = createFetchMock();
    let capturedBody: string | undefined;

    mock.on(
      (url) => url === API_AUTH,
      (_url, init) => {
        capturedBody = init?.body as string;
        return Response.json(mockAuthResponse);
      }
    );

    const req = createMockRequest(LOGIN_URL, {
      method: 'POST',
      body: { email: 'user@test.com', password: 'mypass' },
    });
    await POST(req);

    expect(JSON.parse(capturedBody!)).toEqual({
      email: 'user@test.com',
      password: 'mypass',
    });
  });
});
