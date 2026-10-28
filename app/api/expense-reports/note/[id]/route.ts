import { NextRequest, NextResponse } from 'next/server';
import { get } from '@/app/lib/fetchServer';
import { isNoteId } from '@/app/lib/noteId';

export const maxDuration = 10;

/** Une note de frais par son identifiant, pour la page d'une note hors sortie. */
export async function GET(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const { id } = await context.params;
  if (!isNoteId(id)) {
    return NextResponse.json({ error: 'Identifiant de note invalide' }, { status: 400 });
  }

  try {
    const note = await get(`${process.env.NEXT_PUBLIC_API_URL}/notes-de-frais/${id}`);
    return NextResponse.json(note);
  } catch (error) {
    const status = (error as { status?: number }).status ?? 500;
    return NextResponse.json(
      { error: status === 404 ? 'Note de frais introuvable' : 'Erreur lors de la récupération de la note de frais' },
      { status }
    );
  }
}
