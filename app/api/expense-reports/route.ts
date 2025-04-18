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

    const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/expense-reports`, {
      headers: {
        'Authorization': `Bearer ${accessToken}`,
      },
      cache: 'no-store',
    });


    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      console.error('Erreur de l\'API Symfony:', errorData);
      return NextResponse.json(
        { error: errorData.error || `Erreur ${response.status}` },
        { status: response.status }
      );
    }

    const expenseReports = await response.json();
    return NextResponse.json(expenseReports);
  } catch (error) {
    console.error('Erreur lors de la récupération des notes de frais:', error);
    return NextResponse.json(
      { error: 'Erreur lors de la récupération des notes de frais' },
      { status: 500 }
    );
  }
} 