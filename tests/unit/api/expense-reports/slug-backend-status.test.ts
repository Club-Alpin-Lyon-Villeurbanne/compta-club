import { describe, it, expect, vi } from 'vitest';
import { NextRequest } from 'next/server';
import { createFetchMock, createMockCookieStore, parseJsonResponse } from '../../helpers/next-request';

// Unlike slug.test.ts, keep the real fetchServer: this checks that the status it
// attaches to its errors is the one the route reads.
vi.mock('next/headers', () => ({
  cookies: vi.fn(),
}));

import { cookies } from 'next/headers';
import { PATCH } from '@/app/api/expense-reports/[slug]/route';

describe('PATCH /api/expense-reports/[slug] with the real fetchServer', () => {
  it('returns the status the backend refused the update with', async () => {
    vi.mocked(cookies).mockResolvedValue(createMockCookieStore({}) as any);
    createFetchMock().on(
      () => true,
      () => Response.json({ detail: 'Invalid status transition' }, { status: 422 })
    );

    const req = new NextRequest(
      new URL('http://localhost:3000/api/expense-reports/1'),
      { method: 'PATCH', body: JSON.stringify({ status: 'approved' }) }
    );
    const { status } = await parseJsonResponse(
      await PATCH(req, { params: Promise.resolve({ slug: '1' }) })
    );

    expect(status).toBe(422);
  });
});
