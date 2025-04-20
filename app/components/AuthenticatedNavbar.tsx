"use client";
import Image from 'next/image';
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
      
      await new Promise(resolve => setTimeout(resolve, 100));
      router.push('/');
      router.refresh();
    } catch (err) {
      console.error('Erreur lors de la déconnexion:', err);
    }
  };

  return (
    <nav className="sticky top-0 z-10 bg-white border-b border-gray-200">
      <div className="px-4 mx-auto max-w-7xl sm:px-6 lg:px-8">
        <div className="flex justify-between h-20">
          <div className="flex">
            <div className="flex items-center flex-shrink-0">
              <Link href="/note-de-frais" className="flex items-center space-x-3 group">
                <div className="relative flex items-center justify-center w-12 h-12 transition-all duration-300 bg-white rounded-lg shadow-md group-hover:shadow-lg">
                  <Image 
                    src="/images/logo.png" 
                    alt="Logo Club Alpin de Lyon" 
                    width={48} 
                    height={48}
                    className="object-contain"
                  />
                </div>
                <div className="flex flex-col">
                  <span className="text-xl font-bold text-gray-900">Compta Club</span>
                  <span className="text-sm text-gray-500">Club Alpin de Lyon</span>
                </div>
              </Link>
            </div>
            <div className="hidden sm:ml-8 sm:flex sm:space-x-8">
              <Link
                href="/note-de-frais"
                className={`inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium ${
                  pathname === '/note-de-frais'
                    ? 'border-blue-600 text-gray-900'
                    : 'border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700'
                }`}
              >
                Notes de frais
              </Link>

              <Link
                href="/aide"
                className={`inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium ${
                  pathname === '/aide'
                    ? 'border-blue-600 text-gray-900'
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
                    ? 'border-blue-600 text-gray-900'
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
              className="inline-flex items-center px-4 py-2 text-sm font-medium leading-4 text-white transition-colors duration-200 bg-blue-600 border border-transparent rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
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