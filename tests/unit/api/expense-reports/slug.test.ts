import { describe, it, expect, vi } from 'vitest';
import { NextRequest } from 'next/server';
import { mockExpenseReports } from '@/tests/mocks/fixtures';
import { parseJsonResponse } from '../../helpers/next-request';

// Mock the fetchServer module used by the slug route
vi.mock('@/app/lib/fetchServer', () => ({
  get: vi.fn(),
  patch: vi.fn(),
}));

import { get, patch } from '@/app/lib/fetchServer';
import { GET, PATCH } from '@/app/api/expense-reports/[slug]/route';

const API = process.env.NEXT_PUBLIC_API_URL!;

function makeContext(slug: string) {
  return { params: Promise.resolve({ slug }) };
}

describe('GET /api/expense-reports/[slug]', () => {
  it('returns expense report for given slug', async () => {
    const report = mockExpenseReports[0];
    vi.mocked(get).mockResolvedValue(report);

    const req = new NextRequest(
      new URL('http://localhost:3000/api/expense-reports/101')
    );
    const { status, data } = await parseJsonResponse(
      await GET(req, makeContext('101'))
    );

    expect(status).toBe(200);
    expect(data).toEqual(report);
  });

  it('unwraps data property from response', async () => {
    const report = mockExpenseReports[0];
    vi.mocked(get).mockResolvedValue({ data: report });

    const req = new NextRequest(
      new URL('http://localhost:3000/api/expense-reports/101')
    );
    const { data } = await parseJsonResponse(
      await GET(req, makeContext('101'))
    );

    expect(data).toEqual(report);
  });

  it('calls fetchServer.get with correct URL and params', async () => {
    vi.mocked(get).mockResolvedValue([]);

    const req = new NextRequest(
      new URL('http://localhost:3000/api/expense-reports/42')
    );
    await GET(req, makeContext('42'));

    expect(get).toHaveBeenCalledWith(
      `${API}/admin/notes-de-frais`,
      { params: { event: '42', pagination: 'false' } }
    );
  });

  it('returns 500 when fetchServer.get throws', async () => {
    vi.mocked(get).mockRejectedValue(new Error('API down'));

    const req = new NextRequest(
      new URL('http://localhost:3000/api/expense-reports/101')
    );
    const { status } = await parseJsonResponse(
      await GET(req, makeContext('101'))
    );

    expect(status).toBe(500);
  });
});

describe('PATCH /api/expense-reports/[slug]', () => {
  it('updates expense report status', async () => {
    const updated = { ...mockExpenseReports[0], status: 'approved' };
    vi.mocked(patch).mockResolvedValue(updated);

    const req = new NextRequest(
      new URL('http://localhost:3000/api/expense-reports/1'),
      {
        method: 'PATCH',
        body: JSON.stringify({ status: 'approved', commentaireStatut: 'OK' }),
        headers: { 'Content-Type': 'application/json' },
      }
    );
    const { status, data } = await parseJsonResponse(
      await PATCH(req, makeContext('1'))
    );

    expect(status).toBe(200);
    expect(data.status).toBe('approved');
  });

  it('calls fetchServer.patch with correct URL and body', async () => {
    vi.mocked(patch).mockResolvedValue({});

    const req = new NextRequest(
      new URL('http://localhost:3000/api/expense-reports/7'),
      {
        method: 'PATCH',
        body: JSON.stringify({
          status: 'rejected',
          commentaireStatut: 'Missing docs',
        }),
        headers: { 'Content-Type': 'application/json' },
      }
    );
    await PATCH(req, makeContext('7'));

    expect(patch).toHaveBeenCalledWith(`${API}/notes-de-frais/7`, {
      status: 'rejected',
      commentaireStatut: 'Missing docs',
    });
  });

  it('returns 500 when fetchServer.patch throws', async () => {
    vi.mocked(patch).mockRejectedValue(new Error('Update failed'));

    const req = new NextRequest(
      new URL('http://localhost:3000/api/expense-reports/1'),
      {
        method: 'PATCH',
        body: JSON.stringify({ status: 'approved', commentaireStatut: '' }),
        headers: { 'Content-Type': 'application/json' },
      }
    );
    const { status } = await parseJsonResponse(
      await PATCH(req, makeContext('1'))
    );

    expect(status).toBe(500);
  });
});
