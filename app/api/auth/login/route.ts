import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { COOKIE_NAMES, COOKIE_OPTIONS, AuthTokens } from '@/app/lib/auth/types';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email, password } = body;

    const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/auth`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ email, password }),
    });

    if (!response.ok) {
      return NextResponse.json(
        { error: 'Identifiants invalides' },
        { status: 401 }
      );
    }

    const data: AuthTokens = await response.json();

    // Configuration des cookies
    const cookieStore = await cookies();

    // Cookie pour le token d'accès
    cookieStore.set(COOKIE_NAMES.ACCESS_TOKEN, data.token, {
      ...COOKIE_OPTIONS,
      maxAge: 3600, // 1 heure
    });

    // Cookie pour le token de rafraîchissement
    cookieStore.set(COOKIE_NAMES.REFRESH_TOKEN, data.refresh_token, {
      ...COOKIE_OPTIONS,
      maxAge: 604800, // 7 jours
    });

    // Retourne les informations de l'utilisateur (sans les tokens)
    return NextResponse.json({ user: data.user });
  } catch (error) {
    console.error('Erreur lors de la connexion:', error);
    return NextResponse.json(
      { error: 'Une erreur est survenue lors de la connexion' },
      { status: 500 }
    );
  }
} 