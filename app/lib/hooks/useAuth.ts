import { useState } from 'react';
import { useRouter } from 'next/navigation';
import useAuthStore from '@/app/store/authStore';

interface LoginCredentials {
  email: string;
  password: string;
}

export const useAuth = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();
  const { setUser, logout, isAuthenticated } = useAuthStore();

  const login = async (credentials: LoginCredentials) => {
    try {
      setIsLoading(true);
      setError(null);
      
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(credentials),
        credentials: 'include',
      });
      
      if (!response.ok) {
        throw new Error('Identifiants invalides');
      }
      
      const data = await response.json();
      setUser(data.user);
      router.push('/note-de-frais');
    } catch (err) {
      setError('Identifiants invalides');
      console.error('Erreur de connexion:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleLogout = async () => {
    try {
      // Appeler l'endpoint de déconnexion pour supprimer les cookies
      await fetch('/api/auth/logout', {
        method: 'POST',
        credentials: 'include',
      });
      
      // Mettre à jour l'état local
      logout();
      
      // Rediriger vers la page d'accueil
      router.push('/');
    } catch (error) {
      console.error('Erreur lors de la déconnexion:', error);
      // Même en cas d'erreur, on met à jour l'état local et on redirige
      logout();
      router.push('/');
    }
  };

  return {
    login,
    logout: handleLogout,
    isLoading,
    error,
    isAuthenticated
  };
}; 