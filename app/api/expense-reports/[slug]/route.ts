import { NextRequest, NextResponse } from 'next/server';
import { get, patch } from '@/app/lib/fetchServer';

// Configure max execution time for this route
export const maxDuration = 10; // 10 seconds (max for Hobby plan)

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ slug: string }> }
) {
  try {
    // Attendre les paramètres avant de les utiliser
    const { slug } = await context.params;
    
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
      { status: 500 }
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
    
    const body = await request.json();
    const { status, commentaireStatut } = body;

    // Mettre à jour la note de frais
    const expenseReport = await patch(`${process.env.NEXT_PUBLIC_API_URL}/notes-de-frais/${slug}`, {
      status,
      commentaireStatut,
    });

    return NextResponse.json(expenseReport);
  } catch (error) {
    return NextResponse.json(
      { error: 'Erreur lors de la mise à jour de la note de frais' },
      { status: 500 }
    );
  }
} 
