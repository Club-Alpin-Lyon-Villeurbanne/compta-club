import { describe, it, expect } from 'vitest';
import { NextRequest } from 'next/server';
import { POST } from '@/app/api/auth/logout/route';
import { parseJsonResponse } from '../../helpers/next-request';

describe('POST /api/auth/logout', () => {
  function makeRequest() {
    return new NextRequest(new URL('http://localhost:3000/api/auth/logout'), {
      method: 'POST',
    });
  }

  it('returns 200 with success message', async () => {
    const res = await POST(makeRequest());
    const { status, data } = await parseJsonResponse(res);

    expect(status).toBe(200);
    expect(data.message).toBe('Déconnexion réussie');
  });

  it('deletes access_token cookie', async () => {
    const res = await POST(makeRequest());

    const setCookies = res.headers.getSetCookie();
    const accessCookie = setCookies.find((c) => c.startsWith('access_token='));
    expect(accessCookie).toBeDefined();
    // Deleted cookies expire in the past
    expect(accessCookie).toContain('Expires=Thu, 01 Jan 1970');
  });

  it('deletes refresh_token cookie', async () => {
    const res = await POST(makeRequest());

    const setCookies = res.headers.getSetCookie();
    const refreshCookie = setCookies.find((c) =>
      c.startsWith('refresh_token=')
    );
    expect(refreshCookie).toBeDefined();
    expect(refreshCookie).toContain('Expires=Thu, 01 Jan 1970');
  });
});
