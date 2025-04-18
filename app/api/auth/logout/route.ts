import { NextRequest, NextResponse } from 'next/server';
import { COOKIE_NAMES } from '../../../lib/constants';

export async function POST(request: NextRequest) {
  try {
    // Créer une réponse de succès
    const response = NextResponse.json(
      { message: 'Déconnexion réussie' },
      { status: 200 }
    );

    // Supprimer les cookies d'authentification
    response.cookies.delete(COOKIE_NAMES.ACCESS_TOKEN);
    response.cookies.delete(COOKIE_NAMES.REFRESH_TOKEN);

    return response;
  } catch (error) {
    console.error('Erreur lors de la déconnexion:', error);
    return NextResponse.json(
      { error: 'Erreur lors de la déconnexion' },
      { status: 500 }
    );
  }
} 