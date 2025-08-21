import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { COOKIE_NAMES } from '../../lib/constants';
import { parseApiResponse, extractApiError } from '../../utils/apiParser';

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

    const apiUrl = `${process.env.NEXT_PUBLIC_API_URL}/expense-reports`;
    console.log('Appel API vers:', apiUrl);
    
    const response = await fetch(apiUrl, {
      headers: {
        'Authorization': `Bearer ${accessToken}`,
      },
      cache: 'no-store',
    });


    if (!response.ok) {
      const errorText = await response.text().catch(() => '');
      console.error('Erreur de l\'API Symfony:', errorText);
      
      let errorData;
      try {
        errorData = JSON.parse(errorText);
      } catch {
        errorData = errorText;
      }
      
      return NextResponse.json(
        { 
          error: extractApiError(errorData, response.status),
          details: errorData
        },
        { status: response.status }
      );
    }

    const data = await response.json();
    
    const expenseReports = parseApiResponse(data);
    
    return NextResponse.json(expenseReports);
  } catch (error) {
    console.error('Erreur lors de la récupération des notes de frais:', error);
    return NextResponse.json(
      { error: 'Erreur lors de la récupération des notes de frais' },
      { status: 500 }
    );
  }
} 