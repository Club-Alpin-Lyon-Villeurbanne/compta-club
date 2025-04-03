import { NextRequest, NextResponse } from 'next/server';
import { COOKIE_NAMES, COOKIE_OPTIONS, AuthTokens } from '@/app/lib/auth/types';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email, password } = body;
    console.log('Login attempt for:', email);

    const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/auth`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ email, password }),
    });
    console.log('API response status:', response.status);

    if (!response.ok) {
      console.log('Login failed with status:', response.status);
      return NextResponse.json(
        { error: 'Identifiants invalides' },
        { status: 401 }
      );
    }

    const data: AuthTokens = await response.json();
    console.log('Login successful, setting cookies');

    // Création de la réponse
    const res = NextResponse.json({ user: data.user });

    // Définition des cookies dans la réponse
    res.cookies.set(COOKIE_NAMES.ACCESS_TOKEN, data.token, {
      ...COOKIE_OPTIONS,
      maxAge: 3600, // 1 heure
    });
    console.log('Access token cookie set');

    res.cookies.set(COOKIE_NAMES.REFRESH_TOKEN, data.refresh_token, {
      ...COOKIE_OPTIONS,
      maxAge: 604800, // 7 jours
    });
    console.log('Refresh token cookie set');

    return res;
  } catch (error) {
    console.error('Erreur lors de la connexion:', error);
    return NextResponse.json(
      { error: 'Une erreur est survenue lors de la connexion' },
      { status: 500 }
    );
  }
} 