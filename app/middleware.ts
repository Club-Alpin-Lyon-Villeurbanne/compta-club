import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { COOKIE_NAMES } from '@/app/lib/auth/types';

// Liste des routes publiques qui ne nécessitent pas d'authentification
const publicRoutes = ['/', '/login', '/api/auth/login', '/api/auth/refresh'];

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  
  // Vérifier si la route est publique
  if (publicRoutes.some(route => pathname === route || pathname.startsWith('/_next') || pathname.startsWith('/static'))) {
    return NextResponse.next();
  }
  
  // Vérifier si l'utilisateur est authentifié
  const accessToken = request.cookies.get(COOKIE_NAMES.ACCESS_TOKEN);
  
  if (!accessToken) {
    // Rediriger vers la page de connexion si l'utilisateur n'est pas authentifié
    const url = new URL('/', request.url);
    return NextResponse.redirect(url);
  }
  
  // Ajouter un en-tête pour indiquer que l'utilisateur est authentifié
  const response = NextResponse.next();
  response.headers.set('x-auth-status', 'authenticated');
  
  return response;
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public folder
     */
    '/((?!_next/static|_next/image|favicon.ico|public).*)',
  ],
}; 