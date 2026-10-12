import { headers } from 'next/headers';
import { redirect } from 'next/navigation';
import Footer from '../components/Footer'
import Navbar from '../components/Navbar'
import { isAuthenticated as isAuthenticatedServer } from '../lib/auth.server';
import { PATH_HEADER } from '../lib/constants';
import { loginUrl } from '../lib/loginRedirect';
import '../globals.css'

// Indiquer à Next.js que ce layout doit être rendu dynamiquement
export const dynamic = 'force-dynamic';

export const metadata = {
  title: 'Gestion des notes de frais du Club Alpin de Lyon',
  description: 'Gestion des notes de frais du Club Alpin de Lyon',
}

interface Props {
  children: React.ReactNode;
}

export default async function PrivateLayout({ children }: Props) {
  // Vérifier si l'utilisateur est authentifié
  const authenticated = await isAuthenticatedServer();
  
  // Pas connecté : la connexion, puis retour à la page demandée.
  if (!authenticated) {
    redirect(loginUrl({ returnTo: (await headers()).get(PATH_HEADER) }));
  }

  return (
    <div className="flex flex-col min-h-screen font-sans antialiased bg-gray-200">
      <Navbar />
      <main className="flex-grow px-4 pt-20 mt-4 sm:px-6 lg:px-8">
        {children}
      </main>
      <Footer />
    </div>
  );
}