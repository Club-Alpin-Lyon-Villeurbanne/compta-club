import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { get } from '@/app/lib/fetchServer';

export async function GET(request: NextRequest) {
  try {
    const cookieStore = await cookies();
    const accessToken = cookieStore.get('access_token')?.value;
    const refreshToken = cookieStore.get('refresh_token')?.value;

    if (!accessToken && !refreshToken) {
      return NextResponse.json(
        { error: 'Non authentifié' },
        { status: 401 }
      );
    }

    try {
      const user = await get(`${process.env.NEXT_PUBLIC_API_URL}/expense-reports`);
      return NextResponse.json(user);
    } catch (error: any) {
      if (error.response?.status === 401 && refreshToken) {
        try {
          const response = await fetch('/api/auth/refresh', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
          });

          if (response.ok) {
            const newCookieStore = await cookies();
            const newAccessToken = newCookieStore.get('access_token')?.value;
            if (newAccessToken) {
              const user = await get(`${process.env.NEXT_PUBLIC_API_URL}/expense-reports`);
              return NextResponse.json(user);
            }
          }
        } catch (refreshError) {
          console.error('Erreur lors du rafraîchissement du token:', refreshError);
        }
      }

      return NextResponse.json(
        { error: 'Session expirée' },
        { status: 401 }
      );
    }
  } catch (error) {
    console.error('Erreur lors de la vérification de l\'authentification:', error);
    return NextResponse.json(
      { error: 'Une erreur est survenue' },
      { status: 500 }
    );
  }
} 