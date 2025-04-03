import { useState } from 'react';
import { useRouter } from 'next/navigation';
import axios from '../axios';
import useAuthStore from '@/app/store/useAuthStore';

interface LoginCredentials {
  email: string;
  password: string;
}

export const useAuth = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();
  const { setToken, logout, isAuthenticated } = useAuthStore();

  const login = async (credentials: LoginCredentials) => {
    try {
      setIsLoading(true);
      setError(null);
      
      const response = await axios.post('/auth', credentials);
      const { token } = response.data;
      
      setToken(token);
      router.push('/note-de-frais');
    } catch (err) {
      setError('Identifiants invalides');
      console.error('Erreur de connexion:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleLogout = () => {
    logout();
    router.push('/');
  };

  return {
    login,
    logout: handleLogout,
    isLoading,
    error,
    isAuthenticated
  };
}; 