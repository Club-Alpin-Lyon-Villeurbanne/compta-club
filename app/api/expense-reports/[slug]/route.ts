import { NextRequest, NextResponse } from 'next/server';
import { get, patch } from '@/app/lib/fetchServer';
import { parseApiResponse } from '@/app/utils/apiParser';

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ slug: string }> }
) {
  try {
    // Attendre les paramètres avant de les utiliser
    const { slug } = await context.params;
    
    // Récupérer les notes de frais depuis l'API Symfony
    const data = await get(`${process.env.NEXT_PUBLIC_API_URL}/expense-reports?event=${slug}`);
    const expenseReports = parseApiResponse(data);
    
    return NextResponse.json(expenseReports);
  } catch (error: any) {
    console.error('Erreur lors de la récupération de la note de frais:', error);
    const status = error.status || 500;
    return NextResponse.json(
      { 
        error: error.message || 'Erreur lors de la récupération de la note de frais',
        details: error.toString() 
      },
      { status }
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
    const { status, statusComment } = body;
    console.log(body);

    // Mettre à jour la note de frais
    const expenseReport = await patch(`${process.env.NEXT_PUBLIC_API_URL}/expense-reports/${slug}`, {
      status,
      statusComment,
    });
    console.log(expenseReport);

    return NextResponse.json(expenseReport);
  } catch (error: any) {
    console.error('Erreur lors de la mise à jour de la note de frais:', error);
    const status = error.status || 500;
    return NextResponse.json(
      { 
        error: error.message || 'Erreur lors de la mise à jour de la note de frais',
        details: error.toString() 
      },
      { status }
    );
  }
} 