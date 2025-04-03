import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { COOKIE_NAMES } from '@/app/lib/auth/types';
import { axiosAuth } from '@/app/lib/axios';

async function refreshToken() {
  const cookieStore = await cookies();
  const refreshToken = cookieStore.get(COOKIE_NAMES.REFRESH_TOKEN)?.value;

  if (!refreshToken) {
    throw new Error('No refresh token available');
  }

  try {
    console.log('Attempting to refresh token...');
    const response = await axiosAuth.post('/auth/refresh', {
      refresh_token: refreshToken
    });

    const data = response.data;
    console.log('Token refresh successful');
    
    cookieStore.set(COOKIE_NAMES.ACCESS_TOKEN, data.access_token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: 3600,
    });

    cookieStore.set(COOKIE_NAMES.REFRESH_TOKEN, data.refresh_token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: 604800,
    });

    return data.access_token;
  } catch (error) {
    console.error('Token refresh failed:', error);
    throw new Error('Failed to refresh token');
  }
}

export async function GET(
  request: NextRequest,
  { params }: { params: { slug: string } }
) {
  try {
    const { slug } = await params;
    console.log('Fetching expense report for slug:', slug);
    
    // Récupérer le token d'accès depuis les cookies de la requête
    const accessToken = request.cookies.get(COOKIE_NAMES.ACCESS_TOKEN)?.value;
    console.log('Access token present:', !!accessToken);

    if (!accessToken) {
      return NextResponse.json(
        { error: 'Non authentifié' },
        { status: 401 }
      );
    }
    
    // Configurer axios avec le token d'accès
    axiosAuth.defaults.headers.common['Authorization'] = `Bearer ${accessToken}`;
    console.log('Making API request to:', `/expense-reports?event=${slug}`);
    
    try {
      // Faire la requête avec axios
      const response = await axiosAuth.get(`${process.env.NEXT_PUBLIC_API_URL}/expense-reports?event=${slug}`);
      console.log('API response status:', response.status);
      return NextResponse.json(response.data);
    } catch (error: any) {
      console.error('API request failed:', {
        status: error.response?.status,
        data: error.response?.data,
        message: error.message
      });

      // Si l'erreur est 401, essayer de rafraîchir le token
      if (error.response?.status === 401) {
        try {
          const newAccessToken = await refreshToken();
          
          // Réessayer avec le nouveau token
          axiosAuth.defaults.headers.common['Authorization'] = `Bearer ${newAccessToken}`;
          console.log('Retrying request with new token');
          const response = await axiosAuth.get(`${process.env.NEXT_PUBLIC_API_URL}/expense-reports?event=${slug}`);
          return NextResponse.json(response.data);
        } catch (refreshError) {
          console.error('Error refreshing token:', refreshError);
          return NextResponse.json(
            { error: 'Session expirée, veuillez vous reconnecter' },
            { status: 401 }
          );
        }
      }
      
      // Pour les autres erreurs
      return NextResponse.json(
        { 
          error: 'Erreur lors de la récupération de la note de frais',
          details: error.response?.data || error.message
        },
        { status: error.response?.status || 500 }
      );
    }
  } catch (error: any) {
    console.error('Unexpected error:', {
      message: error.message,
      stack: error.stack,
      response: error.response?.data
    });
    return NextResponse.json(
      { 
        error: 'Une erreur est survenue',
        details: error.message
      },
      { status: 500 }
    );
  }
} 