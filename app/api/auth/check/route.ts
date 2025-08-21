import { NextRequest, NextResponse } from 'next/server';
import { COOKIE_NAMES } from '../../../lib/constants';

export async function GET(request: NextRequest) {
  try {
    
    // Afficher tous les cookies disponibles
    const allCookies = request.cookies.getAll();
    
    const accessToken = request.cookies.get(COOKIE_NAMES.ACCESS_TOKEN)?.value;
    
    if (!accessToken) {
      console.error('API /api/auth/check - Token d\'accès absent');
      return NextResponse.json(
        { error: 'Non authentifié' },
        { status: 401 }
      );
    }
    
    // Vérifier la validité du token en faisant une requête GET vers /expense-reports
    const apiUrl = `${process.env.NEXT_PUBLIC_API_URL}/expense-reports`;
    
    const response = await fetch(apiUrl, {
      method: 'GET', // Utiliser GET au lieu de HEAD car l'API retourne 500 avec HEAD
      headers: {
        'Authorization': `Bearer ${accessToken}`,
      },
    });
    
    // Si le token a expiré (401), tenter un rafraîchissement
    if (response.status === 401) {
      // Récupérer le refresh token
      const refreshToken = request.cookies.get(COOKIE_NAMES.REFRESH_TOKEN)?.value;
      if (!refreshToken) {
        console.error('API /api/auth/check - Refresh token absent');
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
        console.error('API /api/auth/check - Échec du rafraîchissement du token');
        return NextResponse.json(
          { error: 'Token invalide ou expiré' },
          { status: 401 }
        );
      }
      const data = await refreshRes.json();
      const { token: newAccess, refresh_token: newRefresh } = data;
      if (!newAccess || !newRefresh) {
        console.error('API /api/auth/check - Données de rafraîchissement manquantes');
        return NextResponse.json(
          { error: 'Erreur lors du rafraîchissement du token' },
          { status: 500 }
        );
      }
      // Vérifier à nouveau le token rafraîchi
      const retry = await fetch(apiUrl, {
        method: 'HEAD',
        headers: { 'Authorization': `Bearer ${newAccess}` },
      });
      if (!retry.ok) {
        console.error('API /api/auth/check - Le nouveau token est invalide');
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
      console.error('API /api/auth/check - Token invalide ou expiré');
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
    console.error('❌ API /api/auth/check - Erreur:', error);
    return NextResponse.json(
      { error: 'Erreur lors de la vérification de l\'authentification' },
      { status: 500 }
    );
  }
} 