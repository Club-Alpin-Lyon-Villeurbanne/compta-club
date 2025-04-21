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
    <nav className="sticky top-0 z-10 bg-white border-b border-gray-100">
      <div className="px-4 mx-auto max-w-7xl sm:px-6 lg:px-8">
        <div className="flex justify-between h-20">
          <div className="flex items-center">
            <Link href="/note-de-frais" className="flex items-center space-x-4 group">
              <div className="relative flex items-center justify-center overflow-hidden transition-all duration-300 bg-white shadow-sm w-14 h-14 rounded-xl group-hover:shadow-md">
                <Image 
                  src="/images/logo.png" 
                  alt="Logo Club Alpin de Lyon" 
                  width={56} 
                  height={56}
                  className="object-contain p-1"
                />
              </div>
              <div className="flex flex-col">
                <span className="text-xl font-bold tracking-tight text-gray-900">Compta Club</span>
                <span className="text-sm font-medium text-gray-500">Club Alpin de Lyon</span>
              </div>
            </Link>
          </div>

          <div className="hidden sm:flex sm:items-center sm:space-x-1">
            <Link
              href="/note-de-frais"
              className={`inline-flex items-center px-4 py-2 text-sm font-medium rounded-lg transition-colors duration-200 ${
                pathname === '/note-de-frais'
                  ? 'bg-blue-50 text-blue-700'
                  : 'text-gray-600 hover:bg-gray-50'
              }`}
            >
              Notes de frais
            </Link>

            <Link
              href="/aide"
              className={`inline-flex items-center px-4 py-2 text-sm font-medium rounded-lg transition-colors duration-200 ${
                pathname === '/aide'
                  ? 'bg-blue-50 text-blue-700'
                  : 'text-gray-600 hover:bg-gray-50'
              }`}
            >
              <FaQuestionCircle className="mr-2" />
              Aide
            </Link>

            <Link
              href="/a-propos"
              className={`inline-flex items-center px-4 py-2 text-sm font-medium rounded-lg transition-colors duration-200 ${
                pathname === '/a-propos'
                  ? 'bg-blue-50 text-blue-700'
                  : 'text-gray-600 hover:bg-gray-50'
              }`}
            >
              <FaInfoCircle className="mr-2" />
              À propos
            </Link>

            <button
              onClick={handleLogout}
              className="inline-flex items-center px-4 py-2 text-sm font-medium text-white transition-colors duration-200 bg-blue-600 rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
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