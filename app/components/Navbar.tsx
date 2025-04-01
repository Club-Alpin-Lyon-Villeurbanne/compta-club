'use client';

import Image from "next/image";
import Link from "next/link";
import { useState } from "react";
import { FaQuestionCircle, FaBars, FaTimes, FaSignOutAlt } from 'react-icons/fa';
import { usePathname } from 'next/navigation';
import { useAuth } from '@/app/hooks/useAuth';

function LogoutButton() {
    const { logout } = useAuth();
    
    return (
        <button
            onClick={() => logout()}
            className="flex items-center px-4 py-2 text-sm text-white bg-red-600 rounded-lg hover:bg-red-700"
        >
            <FaSignOutAlt className="mr-2" />
            Déconnexion
        </button>
    );
}

export default function Navbar() {
    const { isAuthenticated } = useAuth();
    const [isMenuOpen, setIsMenuOpen] = useState(false);
    const pathname = usePathname();

    const isActive = (path: string) => pathname === path;

    return (
        <nav className="fixed top-0 left-0 z-20 w-full bg-white shadow">
            <div className="flex flex-wrap items-center justify-between p-4 mx-auto max-w-7xl">
                <Link href="/" className="flex items-center shrink-0">
                    <Image 
                        src="https://www.clubalpinlyon.fr/img/logo.png" 
                        className="w-auto h-10" 
                        alt="Logo Club Alpin de Lyon" 
                        height={59} 
                        width={150}
                        priority 
                    />
                </Link>

                <div className="flex items-center md:hidden">
                    <button
                        onClick={() => setIsMenuOpen(!isMenuOpen)}
                        className="p-2 text-gray-600 rounded-lg hover:bg-gray-100"
                    >
                        {isMenuOpen ? <FaTimes /> : <FaBars />}
                    </button>
                </div>

                <div className={`${isMenuOpen ? 'block' : 'hidden'} w-full md:flex md:w-2/4 md:justify-center`}>
                    <ul className="flex flex-col mt-4 md:flex-row md:items-center md:space-x-8 md:mt-0">
                        <li>
                            <Link 
                                href="/" 
                                className={`block py-2 px-3 ${
                                    isActive('/') 
                                        ? 'text-indigo-600' 
                                        : 'text-gray-600 hover:text-indigo-600'
                                }`}
                            >
                                Accueil
                            </Link>
                        </li>
                        <li>
                            <Link 
                                href="/note-de-frais" 
                                className={`block py-2 px-3 ${
                                    pathname.startsWith('/note-de-frais') 
                                        ? 'text-indigo-600' 
                                        : 'text-gray-600 hover:text-indigo-600'
                                }`}
                            >
                                Notes de frais
                            </Link>
                        </li>
                        <li>
                            <Link 
                                href="/a-propos" 
                                className={`block py-2 px-3 ${
                                    isActive('/a-propos') 
                                        ? 'text-indigo-600' 
                                        : 'text-gray-600 hover:text-indigo-600'
                                }`}
                            >
                                À propos
                            </Link>
                        </li>
                    </ul>
                </div>

                <div className={`${isMenuOpen ? 'block' : 'hidden'} w-full md:flex md:w-1/4 md:justify-end`}>
                    <ul className="flex flex-col mt-4 md:flex-row md:items-center md:space-x-4 md:mt-0">
                        <li>
                            <Link
                                href="/aide"
                                className="flex items-center px-4 py-2 text-sm text-white bg-indigo-600 rounded-lg hover:bg-indigo-700"
                            >
                                <FaQuestionCircle className="mr-2" />
                                Aide
                            </Link>
                        </li>
                        {isAuthenticated && (
                            <li>
                                <LogoutButton />
                            </li>
                        )}
                    </ul>
                </div>
            </div>
        </nav>
    );
}