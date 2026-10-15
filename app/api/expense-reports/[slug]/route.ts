import { NextRequest, NextResponse } from 'next/server';
import { get, patch } from '@/app/lib/fetchServer';
import { isNoteId } from '@/app/lib/noteId';

// Configure max execution time for this route
export const maxDuration = 10; // 10 seconds (max for Hobby plan)

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ slug: string }> }
) {
  try {
    // Attendre les paramètres avant de les utiliser
    const { slug } = await context.params;
    // Sans identifiant entier, l'API ignore le filtre `event` et renverrait toutes les notes du club.
    if (!isNoteId(slug)) {
      return NextResponse.json({ error: 'Identifiant de sortie invalide' }, { status: 400 });
    }

    // Récupérer les notes de frais depuis l'API Symfony, sans pagination
    const apiResponse = await get(
      `${process.env.NEXT_PUBLIC_API_URL}/admin/notes-de-frais`,
      { params: { event: slug, pagination: 'false' } }
    );
    const expenseReport = apiResponse.data || apiResponse;
    return NextResponse.json(expenseReport);
  } catch (error) {
    return NextResponse.json(
      { error: 'Erreur lors de la récupération de la note de frais' },
      { status: (error as { status?: number }).status ?? 500 }
    );
  }
}

export async function PATCH(
  request: NextRequest,
  context: { params: Promise<{ slug: string }> }
) {
  try {
    // Attendre les paramètres avant de les utiliser
    const { slug } = await context.params;
    if (!isNoteId(slug)) {
      return NextResponse.json({ error: 'Identifiant de note invalide' }, { status: 400 });
    }

    const body = await request.json();
    const { status, commentaireStatut, version } = body;

    // Mettre à jour la note de frais. `version` (note hors sortie) : la plateforme refuse (409) une note
    // modifiée depuis cette version.
    const expenseReport = await patch(`${process.env.NEXT_PUBLIC_API_URL}/notes-de-frais/${slug}`, {
      status,
      commentaireStatut,
      ...(Number.isInteger(version) ? { version } : {}),
    });

    return NextResponse.json(expenseReport);
  } catch (error) {
    // Un refus de l'API (« Cette note a déjà été traitée. ») est montré tel quel à la trésorerie.
    const { status, apiMessage } = error as { status?: number; apiMessage?: string | null };
    return NextResponse.json(
      { error: apiMessage ?? 'Erreur lors de la mise à jour de la note de frais' },
      { status: status ?? 500 }
    );
  }
}
