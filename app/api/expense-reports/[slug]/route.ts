import { NextRequest, NextResponse } from 'next/server';
import { get, patch } from '@/app/lib/fetchServer';

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ slug: string }> }
) {
  try {
    // Attendre les paramètres avant de les utiliser
    const { slug } = await context.params;
    
    // Récupérer les notes de frais depuis l'API Symfony
    const expenseReport = await get(`${process.env.NEXT_PUBLIC_API_URL}/expense-reports?event=${slug}`);
    
    return NextResponse.json(expenseReport);
  } catch (error) {
    console.error('Erreur lors de la récupération de la note de frais:', error);
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
    const { status, comment } = body;
    console.log(body);

    // Mettre à jour la note de frais
    const expenseReport = await patch(`${process.env.NEXT_PUBLIC_API_URL}/expense-reports/${slug}`, {
      status,
      statusComment: comment,
    });
    console.log(expenseReport);

    return NextResponse.json(expenseReport);
  } catch (error) {
    console.error('Erreur lors de la mise à jour de la note de frais:', error);
    return NextResponse.json(
      { error: 'Erreur lors de la mise à jour de la note de frais' },
      { status: 500 }
    );
  }
} 