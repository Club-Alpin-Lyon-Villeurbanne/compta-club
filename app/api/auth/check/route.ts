import { NextRequest, NextResponse } from 'next/server';
import { COOKIE_NAMES } from '../../../lib/constants';

export async function GET(request: NextRequest) {
  try {
    const accessToken = request.cookies.get(COOKIE_NAMES.ACCESS_TOKEN)?.value;
    
    if (!accessToken) {
      return NextResponse.json(
        { error: 'Non authentifié' },
        { status: 401 }
      );
    }
    
    // Vérifier la validité du token en faisant une requête HEAD vers /admin/notes-de-frais
    const apiUrl = `${process.env.NEXT_PUBLIC_API_URL}/admin/notes-de-frais`;
    
    const response = await fetch(apiUrl, {
      method: 'HEAD',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
      },
    });
    
    // Si le token a expiré (401), tenter un rafraîchissement
    if (response.status === 401) {
      // Récupérer le refresh token
      const refreshToken = request.cookies.get(COOKIE_NAMES.REFRESH_TOKEN)?.value;
      if (!refreshToken) {
        return NextResponse.json(
          { error: 'Non authentifié' },
          { status: 401 }
        );
      }
      // Appeler l'API externe pour rafraîchir le token
      const refreshRes = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/token/refresh`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ refresh_token: refreshToken }),
        }
      );
      if (!refreshRes.ok) {
        return NextResponse.json(
          { error: 'Token invalide ou expiré' },
          { status: 401 }
        );
      }
      const data = await refreshRes.json();
      const { token: newAccess, refresh_token: newRefresh } = data;
      if (!newAccess || !newRefresh) {
        return NextResponse.json(
          { error: 'Erreur lors du rafraîchissement du token' },
          { status: 500 }
        );
      }
      // Vérifier à nouveau le token rafraîchi
      const retry = await fetch(apiUrl, {
        method: 'GET',
        headers: { 'Authorization': `Bearer ${newAccess}` },
      });
      if (!retry.ok) {
        return NextResponse.json(
          { error: 'Token invalide après rafraîchissement' },
          { status: 401 }
        );
      }
      // Préparer la réponse avec les cookies mis à jour
      const COOKIE_OPTIONS = {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax' as const,
        path: '/',
      };
      const res = NextResponse.json(
        { authenticated: true },
        { status: 200 }
      );
      res.cookies.set(COOKIE_NAMES.ACCESS_TOKEN, newAccess, COOKIE_OPTIONS);
      res.cookies.set(COOKIE_NAMES.REFRESH_TOKEN, newRefresh, COOKIE_OPTIONS);
      return res;
    }
    // Pour les autres erreurs, renvoyer 401
    if (!response.ok) {
      return NextResponse.json(
        { error: 'Token invalide ou expiré' },
        { status: 401 }
      );
    }
    
    return NextResponse.json(
      { authenticated: true },
      { status: 200 }
    );
  } catch (error) {
    return NextResponse.json(
      { error: 'Erreur lors de la vérification de l\'authentification' },
      { status: 500 }
    );
  }
} 