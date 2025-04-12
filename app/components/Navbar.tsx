'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { FaUser, FaSignOutAlt, FaQuestionCircle, FaInfoCircle } from 'react-icons/fa';
import { useState, useEffect } from 'react';

export default function Navbar() {
  const pathname = usePathname();
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  useEffect(() => {
    // Écouter l'événement de changement d'état d'authentification
    const handleAuthStateChange = (event: CustomEvent) => {
      setIsAuthenticated(event.detail.isAuthenticated);
    };

    window.addEventListener('authStateChanged', handleAuthStateChange as EventListener);

    return () => {
      window.removeEventListener('authStateChanged', handleAuthStateChange as EventListener);
    };
  }, []);

  const handleLogout = async () => {
    try {
      await fetch('/api/auth/logout', {
        method: 'POST',
        credentials: 'include',
      });
      
      setIsAuthenticated(false);
      // Redirection vers la page d'accueil
      window.location.href = '/';
    } catch (err) {
      console.error('Erreur lors de la déconnexion:', err);
    }
  };

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-white shadow-sm">
      <div className="px-4 mx-auto max-w-7xl sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          <div className="flex">
            <div className="flex items-center">
              <Link href="/" className="flex items-center">
                <span className="text-xl font-bold text-indigo-600">
                  Club Alpin de Lyon
                </span>
              </Link>
            </div>
            <div className="hidden sm:ml-6 sm:flex sm:space-x-8">
              {isAuthenticated && (
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
              )}
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
                href="/about"
                className={`inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium ${
                  pathname === '/about'
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
            {isAuthenticated ? (
              <button
                onClick={handleLogout}
                className="inline-flex items-center px-3 py-2 text-sm font-medium leading-4 text-white bg-indigo-600 border border-transparent rounded-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
              >
                <FaSignOutAlt className="mr-2" />
                Déconnexion
              </button>
            ) : (
              <Link
                href="/"
                className="inline-flex items-center px-3 py-2 text-sm font-medium leading-4 text-white bg-indigo-600 border border-transparent rounded-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
              >
                <FaUser className="mr-2" />
                Connexion
              </Link>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
}