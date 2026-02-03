import { NextRequest, NextResponse } from 'next/server';
import { COOKIE_NAMES } from '../../../lib/constants';

// Options pour les cookies
const COOKIE_OPTIONS = {
  httpOnly: true,
  secure: process.env.NODE_ENV === 'production',
  sameSite: 'lax' as const,
  path: '/',
};

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email, password } = body;

    if (!email || !password || typeof email !== 'string' || typeof password !== 'string') {
      return NextResponse.json(
        { error: 'Email et mot de passe requis' },
        { status: 400 }
      );
    }

    // Appel à l'API Symfony pour l'authentification
    const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/auth`, {
      method: 'POST',
      body: JSON.stringify({ email, password }),
      headers: {
        'Content-Type': 'application/json',
      },
    });


    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      return NextResponse.json(
        { error: 'Identifiants invalides' },
        { status: 401 }
      );
    }

    const data = await response.json();
    
    const { token, refresh_token } = data;

    if (!token || !refresh_token) {
      return NextResponse.json(
        { error: 'Erreur lors de la connexion: tokens manquants' },
        { status: 500 }
      );
    }

    // Créer la réponse avec les cookies
    const res = NextResponse.json(
      { message: 'Connexion réussie' },
      { status: 200 }
    );

    // Définir les cookies
    res.cookies.set(COOKIE_NAMES.ACCESS_TOKEN, token, COOKIE_OPTIONS);
    res.cookies.set(COOKIE_NAMES.REFRESH_TOKEN, refresh_token, COOKIE_OPTIONS);

    // Retourner la réponse avec les cookies
    return res;
  } catch (error) {
    return NextResponse.json(
      { error: 'Erreur lors de la connexion' },
      { status: 500 }
    );
  }
} 