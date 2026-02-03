'use client';

import { usePathname } from 'next/navigation';
import { useState, useEffect } from 'react';
import AuthenticatedNavbar from './AuthenticatedNavbar';
import UnauthenticatedNavbar from './UnauthenticatedNavbar';
import { isAuthenticated } from '../lib/auth.client';

export default function Navbar() {
  const [authStatus, setAuthStatus] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const pathname = usePathname();

  useEffect(() => {
    // Vérifier l'authentification uniquement si on n'est pas déjà sur la page de connexion
    if (pathname !== '/') {
      const checkAuth = async () => {
        try {
          // Utiliser la fonction isAuthenticated
        const authenticated = await isAuthenticated();
          setAuthStatus(authenticated);
        } catch {
          setAuthStatus(false);
        } finally {
          setIsLoading(false);
        }
      };

      checkAuth();
    } else {
      setIsLoading(false);
    }
  }, [pathname]);
  
  if (isLoading) {
    return <div className="h-16 bg-white shadow"></div>;
  }
  
  return authStatus ? <AuthenticatedNavbar /> : <UnauthenticatedNavbar />;
}