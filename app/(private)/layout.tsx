import { redirect } from 'next/navigation';
import Footer from '../components/Footer'
import Navbar from '../components/Navbar'
import { isAuthenticated as isAuthenticatedServer } from '../lib/auth.server';
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
  
  // Si l'utilisateur n'est pas authentifié, rediriger vers la page d'accueil
  if (!authenticated) {
    redirect('/');
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