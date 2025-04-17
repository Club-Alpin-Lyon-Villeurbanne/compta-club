import { NextRequest, NextResponse } from 'next/server';
import { COOKIE_NAMES } from '../../../lib/constants';

export async function GET(request: NextRequest) {
  try {
    console.log('🔍 API /api/auth/check - Début de la vérification');
    
    // Afficher tous les cookies disponibles
    const allCookies = request.cookies.getAll();
    console.log('- Cookies disponibles:', allCookies.map(c => `${c.name}=${c.value ? 'présent' : 'absent'}`));
    
    const accessToken = request.cookies.get(COOKIE_NAMES.ACCESS_TOKEN)?.value;
    console.log(`- Token d'accès: ${accessToken ? 'présent' : 'absent'}`);
    
    if (!accessToken) {
      console.log('❌ API /api/auth/check - Token d\'accès absent');
      return NextResponse.json(
        { error: 'Non authentifié' },
        { status: 401 }
      );
    }
    
    // Vérifier la validité du token en faisant une requête HEAD vers /expense-reports
    const apiUrl = `${process.env.NEXT_PUBLIC_API_URL}/expense-reports`;
    console.log(`- Vérification du token avec l'API: ${apiUrl}`);
    
    const response = await fetch(apiUrl, {
      method: 'HEAD',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
      },
    });
    
    console.log(`- Réponse de l'API: ${response.status} ${response.statusText}`);
    
    if (!response.ok) {
      // Si le token est expiré, on pourrait essayer de le rafraîchir ici
      // Pour l'instant, on renvoie simplement une erreur 401
      console.log('❌ API /api/auth/check - Token invalide ou expiré');
      return NextResponse.json(
        { error: 'Token invalide ou expiré' },
        { status: 401 }
      );
    }
    
    console.log('✅ API /api/auth/check - Authentification réussie');
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