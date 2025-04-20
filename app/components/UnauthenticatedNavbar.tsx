"use client";
import Image from 'next/image';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { FaUser, FaQuestionCircle, FaInfoCircle } from 'react-icons/fa';

export default function UnauthenticatedNavbar() {
  const pathname = usePathname();

  return (
    <nav className="bg-white border-b border-gray-200 sticky top-0 z-10">
      <div className="px-4 mx-auto max-w-7xl sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          <div className="flex">
            <div className="flex items-center flex-shrink-0">
              <Link href="/" className="flex items-center">
                <Image src="/images/logo.png" alt="Club Alpin Français" width={32} height={32} />
                <span className="ml-2 text-xl font-bold text-indigo-600">Compta Club</span>
              </Link>
            </div>
            <div className="hidden sm:ml-6 sm:flex sm:space-x-8">
              <Link
                href="/help"
                className={`inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium ${
                  pathname === '/help'
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
            <Link
              href="/"
              className="inline-flex items-center px-3 py-2 text-sm font-medium leading-4 text-white bg-indigo-600 border border-transparent rounded-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
            >
              <FaUser className="mr-2" />
              Connexion
            </Link>
          </div>
        </div>
      </div>
    </nav>
  );
} 