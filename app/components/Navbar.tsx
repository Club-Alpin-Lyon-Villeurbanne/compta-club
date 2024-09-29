'use client';

import Image from "next/image";
import Link from "next/link";
import { useSession } from "next-auth/react";
import { useState } from "react";
import { FaQuestionCircle, FaBars, FaTimes, FaSignOutAlt } from 'react-icons/fa';
import { signOut } from 'next-auth/react';

function LogoutButton() {
  const handleLogout = () => {
    signOut({ callbackUrl: '/' });
  };

  return (
    <button
      onClick={handleLogout}
      className="px-4 py-2 ml-3 text-sm font-medium text-white bg-red-600 rounded-lg hover:bg-red-700 focus:ring-4 focus:outline-none focus:ring-red-300 transition duration-300 ease-in-out flex items-center"
    >
      <FaSignOutAlt className="mr-2" />
      Déconnexion
    </button>
  );
}

export default function Navbar() {
    const {data: session} = useSession();
    const [isMenuOpen, setIsMenuOpen] = useState(false);

    return (
        <nav className="fixed top-0 left-0 z-20 w-full bg-white shadow-md">
            <div className="flex flex-wrap items-center justify-between max-w-screen-xl p-4 mx-auto">
                <Link href="/" className="flex items-center">
                    <Image src="https://www.clubalpinlyon.fr/img/logo.png" className="h-10 mr-3" alt="Logo Club Alpin de Lyon" height={59} width={150} />
                </Link>
                <div className="flex items-center md:order-2">
                    <button type="button" className="px-4 py-2 mr-3 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 focus:ring-4 focus:outline-none focus:ring-blue-300 transition duration-300 ease-in-out flex items-center">
                        <FaQuestionCircle className="mr-2" />
                        Aide
                    </button>
                    {session?.user && <LogoutButton />}
                    <button 
                        onClick={() => setIsMenuOpen(!isMenuOpen)}
                        className="inline-flex items-center p-2 ml-1 text-sm text-gray-500 rounded-lg md:hidden hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-gray-200"
                    >
                        {isMenuOpen ? <FaTimes /> : <FaBars />}
                    </button>
                </div>
                <div className={`${isMenuOpen ? 'block' : 'hidden'} w-full md:block md:w-auto md:order-1`}>
                    <ul className="flex flex-col p-4 mt-4 font-medium border border-gray-100 rounded-lg md:flex-row md:space-x-8 md:mt-0 md:border-0 md:bg-white">
                        <li>
                            <Link href="/" className="block py-2 pl-3 pr-4 text-blue-600 rounded md:bg-transparent md:p-0 md:hover:text-blue-700 relative group">
                                Accueil
                                <span className="absolute bottom-0 left-0 w-full h-0.5 bg-blue-600 transform scale-x-0 group-hover:scale-x-100 transition-transform duration-300 ease-in-out"></span>
                            </Link>
                        </li>
                        <li>
                            <Link href="#" className="block py-2 pl-3 pr-4 text-gray-900 rounded md:p-0 md:hover:text-blue-700 relative group">
                                A propos
                                <span className="absolute bottom-0 left-0 w-full h-0.5 bg-blue-600 transform scale-x-0 group-hover:scale-x-100 transition-transform duration-300 ease-in-out"></span>
                            </Link>
                        </li>
                    </ul>
                </div>
            </div>
        </nav>
    )
}