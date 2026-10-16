import { describe, it, expect, vi } from 'vitest';
import { NextRequest } from 'next/server';
import { mockNotesHorsSortie } from '@/tests/mocks/fixtures';
import { parseJsonResponse } from '../../helpers/next-request';

vi.mock('@/app/lib/fetchServer', () => ({
  get: vi.fn(),
}));

import { get } from '@/app/lib/fetchServer';
import { GET } from '@/app/api/expense-reports/note/[id]/route';

const API = process.env.NEXT_PUBLIC_API_URL!;

async function call(id: string) {
  const req = new NextRequest(new URL(`http://localhost:3000/api/expense-reports/note/${encodeURIComponent(id)}`));
  return parseJsonResponse(await GET(req, { params: Promise.resolve({ id }) }));
}

describe('GET /api/expense-reports/note/[id]', () => {
  it('reads the note from the API by its id', async () => {
    const note = mockNotesHorsSortie[1];
    vi.mocked(get).mockResolvedValue(note);

    const { status, data } = await call('202');

    expect(status).toBe(200);
    expect(data).toEqual(note);
    expect(get).toHaveBeenCalledWith(`${API}/notes-de-frais/202`);
  });

  it.each(['abc', '0', '-1', '1.5', '12abc', '../admin/notes-de-frais', '1/clone', '9007199254740993'])(
    'refuses the id "%s" without calling the API',
    async (id) => {
      const { status, data } = await call(id);

      expect(status).toBe(400);
      expect(data.error).toBe('Identifiant de note invalide');
      expect(get).not.toHaveBeenCalled();
    }
  );

  it('says when the note does not exist', async () => {
    vi.mocked(get).mockRejectedValue(Object.assign(new Error('Erreur 404'), { status: 404, apiMessage: 'Not Found' }));

    const { status, data } = await call('999');

    expect(status).toBe(404);
    expect(data.error).toBe('Note de frais introuvable');
  });

  it('propagates 401 so the client can refresh the session', async () => {
    vi.mocked(get).mockRejectedValue(Object.assign(new Error('Erreur 401'), { status: 401 }));

    const { status } = await call('202');

    expect(status).toBe(401);
  });

  it('returns a generic error when the API fails', async () => {
    vi.mocked(get).mockRejectedValue(new Error('API down'));

    const { status, data } = await call('202');

    expect(status).toBe(500);
    expect(data.error).toBe('Erreur lors de la récupération de la note de frais');
  });
});
