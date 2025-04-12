import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';

export async function GET(request: NextRequest) {
  try {
    // Récupérer les cookies
    const cookieStore = await cookies();
    const accessToken = cookieStore.get('access_token')?.value;

    console.log('Token d\'accès:', accessToken ? 'présent' : 'absent');

    if (!accessToken) {
      return NextResponse.json(
        { error: 'Non authentifié' },
        { status: 401 }
      );
    }

    // Récupérer les paramètres de requête
    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status');
    const commission = searchParams.get('commission');
    const page = searchParams.get('page') || '1';
    const limit = searchParams.get('limit') || '10';

    // Construire l'URL de l'API avec les paramètres
    let apiUrl = `${process.env.NEXT_PUBLIC_API_URL}/expense-reports?page=${page}&limit=${limit}`;
    
    if (status) {
      apiUrl += `&status=${status}`;
    }
    
    if (commission) {
      apiUrl += `&commission=${commission}`;
    }

    console.log('URL de l\'API:', apiUrl);

    // Récupérer les notes de frais depuis l'API Symfony
    const response = await fetch(apiUrl, {
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'X-Auth-Token': accessToken,
      },
      cache: 'no-store',
    });

    console.log('Réponse de l\'API Symfony:', response.status);

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      console.error('Erreur de l\'API Symfony:', errorData);
      return NextResponse.json(
        { error: errorData.error || `Erreur ${response.status}` },
        { status: response.status }
      );
    }

    const expenseReports = await response.json();
    console.log('Données de l\'API Symfony:', { count: expenseReports.length || 0 });
    return NextResponse.json(expenseReports);
  } catch (error) {
    console.error('Erreur lors de la récupération des notes de frais:', error);
    return NextResponse.json(
      { error: 'Erreur lors de la récupération des notes de frais' },
      { status: 500 }
    );
  }
} 