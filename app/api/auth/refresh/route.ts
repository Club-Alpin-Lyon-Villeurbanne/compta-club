import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { COOKIE_NAMES, COOKIE_OPTIONS, AuthTokens } from '@/app/lib/auth/types';

export async function POST(request: NextRequest) {
  try {
    const cookieStore = await cookies();
    const refreshToken = cookieStore.get(COOKIE_NAMES.REFRESH_TOKEN)?.value;

    if (!refreshToken) {
      return NextResponse.json(
        { error: 'Refresh token manquant' },
        { status: 401 }
      );
    }

    // Appel à l'API Symfony pour rafraîchir le token
    const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/auth/refresh`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ refresh_token: refreshToken }),
    });

    if (!response.ok) {
      return NextResponse.json(
        { error: 'Impossible de rafraîchir le token' },
        { status: 401 }
      );
    }

    const data: AuthTokens = await response.json();

    // Mise à jour des cookies
    cookieStore.set(COOKIE_NAMES.ACCESS_TOKEN, data.token, {
      ...COOKIE_OPTIONS,
      maxAge: 3600, // 1 heure
    });

    cookieStore.set(COOKIE_NAMES.REFRESH_TOKEN, data.refresh_token, {
      ...COOKIE_OPTIONS,
      maxAge: 604800, // 7 jours
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Refresh error:', error);
    return NextResponse.json(
      { error: 'Une erreur est survenue' },
      { status: 500 }
    );
  }
} 