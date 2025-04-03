import Footer from '../components/Footer'
import Navbar from '../components/Navbar'
import '../globals.css'
import { checkAuthOrRedirect } from '@/app/lib/fetchServer';

export const metadata = {
  title: 'Gestion des notes de frais du Club Alpin de Lyon',
  description: 'Gestion des notes de frais du Club Alpin de Lyon',
}

interface Props {
  children: React.ReactNode;
}

export default async function PrivateLayout({ children }: Props) {
  // Vérifier si l'utilisateur est authentifié
  await checkAuthOrRedirect();
  
  return (
    <html lang="fr">
      <body className="flex flex-col min-h-screen font-sans antialiased bg-gray-200">
        <Navbar />
        <main className="flex-grow px-4 pt-20 mt-4 sm:px-6 lg:px-8">
          {children}
        </main>
        <Footer />
      </body>
    </html>
  );
}