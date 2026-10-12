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

  it('passes on the message of the refusal, never the trace', async () => {
    vi.mocked(cookies).mockResolvedValue(createMockCookieStore({ access_token: 'jwt' }) as any);
    // Réponse de l'API locale (problem+json, avec la trace en dev) à une décision sur une note déjà traitée
    createFetchMock().on(
      () => true,
      () => Response.json(
        {
          title: 'An error occurred',
          detail: 'status: Cette note a déjà été traitée.',
          violations: [{ propertyPath: 'status', message: 'Cette note a déjà été traitée.', code: null }],
          trace: [{ file: '/var/www/src/Validator/ExpenseReport/StatusTransitionValidator.php', line: 63 }],
        },
        { status: 422, headers: { 'Content-Type': 'application/problem+json' } }
      )
    );

    const req = new NextRequest(
      new URL('http://localhost:3000/api/expense-reports/55'),
      { method: 'PATCH', body: JSON.stringify({ status: 'approved' }) }
    );
    const response = await PATCH(req, { params: Promise.resolve({ slug: '55' }) });
    const body = await response.text();

    expect(response.status).toBe(422);
    expect(JSON.parse(body)).toEqual({ error: 'Cette note a déjà été traitée.' });
    expect(body).not.toContain('Validator');
  });

  it('hides the detail of a server error', async () => {
    vi.mocked(cookies).mockResolvedValue(createMockCookieStore({ access_token: 'jwt' }) as any);
    createFetchMock().on(
      () => true,
      () => Response.json(
        { title: 'An error occurred', detail: 'An exception occurred while executing a query: SQLSTATE[42S22]' },
        { status: 500 }
      )
    );

    const req = new NextRequest(
      new URL('http://localhost:3000/api/expense-reports/55'),
      { method: 'PATCH', body: JSON.stringify({ status: 'approved' }) }
    );
    const { status, data } = await parseJsonResponse(
      await PATCH(req, { params: Promise.resolve({ slug: '55' }) })
    );

    expect(status).toBe(500);
    expect(data).toEqual({ error: 'Erreur lors de la mise à jour de la note de frais' });
  });
});
