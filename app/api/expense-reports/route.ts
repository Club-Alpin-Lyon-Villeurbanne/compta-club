import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { COOKIE_NAMES } from '../../lib/constants';

export async function GET(request: NextRequest) {
  try {
    const cookieStore = await cookies();
    const accessToken = cookieStore.get(COOKIE_NAMES.ACCESS_TOKEN)?.value;

    if (!accessToken) {
      return NextResponse.json(
        { error: 'Non authentifié' },
        { status: 401 }
      );
    }

    // Ajouter le paramètre pour désactiver la pagination
    const url = new URL(`${process.env.NEXT_PUBLIC_API_URL}/admin/notes-de-frais`);
    url.searchParams.append('pagination', 'false');
    
    const response = await fetch(url.toString(), {
      headers: {
        'Authorization': `Bearer ${accessToken}`,
      },
      cache: 'no-store',
    });


    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      return NextResponse.json(
        { error: errorData.error || `Erreur ${response.status}` },
        { status: response.status }
      );
    }

    const apiResponse = await response.json();
    // Extraire les données du nouveau format
    const expenseReports = apiResponse.data || apiResponse;
    return NextResponse.json(expenseReports);
  } catch (error) {
    console.error('Erreur lors de la récupération des notes de frais:', error);
    return NextResponse.json(
      { error: 'Erreur lors de la récupération des notes de frais' },
      { status: 500 }
    );
  }
} 