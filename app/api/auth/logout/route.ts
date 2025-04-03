import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { COOKIE_NAMES, COOKIE_OPTIONS } from '@/app/lib/auth/types';

export async function POST() {
  try {
    // Création de la réponse
    const res = NextResponse.json({ success: true });

    // Suppression des cookies
    cookies().delete(COOKIE_NAMES.ACCESS_TOKEN);
    cookies().delete(COOKIE_NAMES.REFRESH_TOKEN);

    return res;
  } catch (error) {
    console.error('Logout error:', error);
    return NextResponse.json(
      { error: 'Une erreur est survenue' },
      { status: 500 }
    );
  }
} 