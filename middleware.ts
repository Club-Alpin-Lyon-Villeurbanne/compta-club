import { NextRequest, NextResponse } from 'next/server';
import { decodeJwt } from 'jose';
import { COOKIE_NAMES } from './app/lib/constants';

/**
 * Rafraîchit la session avant le rendu des pages privées.
 *
 * Le layout privé vérifie la session côté serveur, mais un composant serveur n'a pas le droit
 * d'écrire de cookies : sans ce middleware, un jeton d'accès expiré (au bout d'1 h) renvoyait
 * vers la connexion alors que le refresh token était encore valide.
 */

// Marge pour ne pas envoyer un jeton qui expirerait pendant le rendu de la page.
const EXPIRY_MARGIN_SECONDS = 30;

const COOKIE_OPTIONS = {
  httpOnly: true,
  secure: process.env.NODE_ENV === 'production',
  sameSite: 'lax' as const,
  path: '/',
};

// Le backend vérifie la signature : ici on ne lit que la date d'expiration.
function isExpired(token: string): boolean {
  try {
    const { exp } = decodeJwt(token);
    return typeof exp === 'number' && exp - EXPIRY_MARGIN_SECONDS <= Date.now() / 1000;
  } catch {
    return true;
  }
}

export async function middleware(request: NextRequest) {
  const accessToken = request.cookies.get(COOKIE_NAMES.ACCESS_TOKEN)?.value;
  const refreshToken = request.cookies.get(COOKIE_NAMES.REFRESH_TOKEN)?.value;

  if (!refreshToken || (accessToken && !isExpired(accessToken))) {
    return NextResponse.next();
  }

  try {
    const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/token/refresh`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ refresh_token: refreshToken }),
    });
    if (!response.ok) {
      return NextResponse.next();
    }
    const { token, refresh_token: newRefreshToken } = await response.json();
    if (!token || !newRefreshToken) {
      return NextResponse.next();
    }

    // La page rendue dans la même requête lit les cookies de la requête : on lui passe les nouveaux jetons.
    request.cookies.set(COOKIE_NAMES.ACCESS_TOKEN, token);
    request.cookies.set(COOKIE_NAMES.REFRESH_TOKEN, newRefreshToken);
    const next = NextResponse.next({ request: { headers: request.headers } });
    next.cookies.set(COOKIE_NAMES.ACCESS_TOKEN, token, COOKIE_OPTIONS);
    next.cookies.set(COOKIE_NAMES.REFRESH_TOKEN, newRefreshToken, COOKIE_OPTIONS);
    return next;
  } catch {
    // Backend injoignable : le layout fera sa propre vérification et renverra vers la connexion.
    return NextResponse.next();
  }
}

export const config = {
  matcher: ['/note-de-frais/:path*'],
  runtime: 'nodejs',
};
