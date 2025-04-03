import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { COOKIE_NAMES } from '@/app/lib/auth/types';
import { get } from '@/app/lib/fetchServer';

async function refreshToken() {
  const cookieStore = await cookies();
  const refreshToken = cookieStore.get(COOKIE_NAMES.REFRESH_TOKEN)?.value;

  if (!refreshToken) {
    throw new Error('No refresh token available');
  }

  const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/auth/refresh`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ refresh_token: refreshToken }),
  });

  if (!response.ok) {
    throw new Error('Failed to refresh token');
  }

  const data = await response.json();
  
  // Mettre à jour les cookies avec les nouveaux tokens
  cookieStore.set(COOKIE_NAMES.ACCESS_TOKEN, data.access_token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: 3600, // 1 heure
  });

  cookieStore.set(COOKIE_NAMES.REFRESH_TOKEN, data.refresh_token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: 604800, // 7 jours
  });

  return data.access_token;
}

export async function GET(request: NextRequest) {
  try {
    // Récupérer les notes de frais depuis l'API Symfony
    const expenseReports = await get(`${process.env.NEXT_PUBLIC_API_URL}/expense-reports`);
    
    return NextResponse.json(expenseReports);
  } catch (error) {
    console.error('Erreur lors de la récupération des notes de frais:', error);
    return NextResponse.json(
      { error: 'Erreur lors de la récupération des notes de frais' },
      { status: 500 }
    );
  }
} 