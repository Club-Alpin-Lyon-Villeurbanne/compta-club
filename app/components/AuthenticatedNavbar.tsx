'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { FaSignOutAlt, FaQuestionCircle, FaInfoCircle } from 'react-icons/fa';

export default function AuthenticatedNavbar() {
  const pathname = usePathname();
  const router = useRouter();

  const handleLogout = async () => {
    try {
      const response = await fetch('/api/auth/logout', {
        method: 'POST',
        credentials: 'include',
      });
      
      if (!response.ok) {
        console.error('Erreur lors de la déconnexion:', await response.text());
        return;
      }
      
      // Attendre un peu pour s'assurer que les cookies sont bien supprimés
      await new Promise(resolve => setTimeout(resolve, 100));
      
      // Redirection vers la page d'accueil
      router.push('/');
      router.refresh(); // Forcer le rafraîchissement pour mettre à jour l'état d'authentification
    } catch (err) {
      console.error('Erreur lors de la déconnexion:', err);
    }
  };

  return (
    <nav className="bg-white shadow">
      <div className="px-4 mx-auto max-w-7xl sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          <div className="flex">
            <div className="flex items-center flex-shrink-0">
              <Link href="/note-de-frais" className="text-xl font-bold text-indigo-600">
                Compta Club
              </Link>
            </div>
            <div className="hidden sm:ml-6 sm:flex sm:space-x-8">
              <Link
                href="/note-de-frais"
                className={`inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium ${
                  pathname === '/note-de-frais'
                    ? 'border-indigo-500 text-gray-900'
                    : 'border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700'
                }`}
              >
                Notes de frais
              </Link>

              <Link
                href="/aide"
                className={`inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium ${
                  pathname === '/aide'
                    ? 'border-indigo-500 text-gray-900'
                    : 'border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700'
                }`}
              >
                <FaQuestionCircle className="mr-1" />
                Aide
              </Link>

              <Link
                href="/a-propos"
                className={`inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium ${
                  pathname === '/a-propos'
                    ? 'border-indigo-500 text-gray-900'
                    : 'border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700'
                }`}
              >
                <FaInfoCircle className="mr-1" />
                À propos
              </Link>
            </div>
          </div>
          <div className="hidden sm:ml-6 sm:flex sm:items-center">
            <button
              onClick={handleLogout}
              className="inline-flex items-center px-3 py-2 text-sm font-medium leading-4 text-white bg-indigo-600 border border-transparent rounded-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
            >
              <FaSignOutAlt className="mr-2" />
              Déconnexion
            </button>
          </div>
        </div>
      </div>
    </nav>
  );
} 