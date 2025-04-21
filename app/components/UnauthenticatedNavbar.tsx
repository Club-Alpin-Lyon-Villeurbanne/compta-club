"use client";
import Image from 'next/image';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { FaQuestionCircle, FaInfoCircle } from 'react-icons/fa';

export default function UnauthenticatedNavbar() {
  const pathname = usePathname();

  return (
    <nav className="bg-white border-b border-gray-100 sticky top-0 z-10">
      <div className="px-4 mx-auto max-w-7xl sm:px-6 lg:px-8">
        <div className="flex justify-between h-20">
          <div className="flex items-center">
            <Link href="/" className="flex items-center space-x-4 group">
              <div className="relative flex items-center justify-center w-14 h-14 bg-white rounded-xl shadow-sm group-hover:shadow-md transition-all duration-300 overflow-hidden">
                <Image 
                  src="/images/logo.png" 
                  alt="Logo Club Alpin de Lyon" 
                  width={56} 
                  height={56}
                  className="object-contain p-1"
                />
              </div>
              <div className="flex flex-col">
                <span className="text-xl font-bold text-gray-900 tracking-tight">Compta Club</span>
                <span className="text-sm text-gray-500 font-medium">Club Alpin de Lyon</span>
              </div>
            </Link>
          </div>

          <div className="hidden sm:flex sm:items-center sm:space-x-1">
            <Link
              href="/help"
              className={`inline-flex items-center px-4 py-2 text-sm font-medium rounded-lg transition-colors duration-200 ${
                pathname === '/help'
                  ? 'bg-blue-50 text-blue-700'
                  : 'text-gray-600 hover:bg-gray-50'
              }`}
            >
              <FaQuestionCircle className="mr-2" />
              Aide
            </Link>

            <Link
              href="/about"
              className={`inline-flex items-center px-4 py-2 text-sm font-medium rounded-lg transition-colors duration-200 ${
                pathname === '/about'
                  ? 'bg-blue-50 text-blue-700'
                  : 'text-gray-600 hover:bg-gray-50'
              }`}
            >
              <FaInfoCircle className="mr-2" />
              À propos
            </Link>
          </div>
        </div>
      </div>
    </nav>
  );
} 