import { useState, useEffect } from 'react';
import AuthService from '../services/auth';

interface User {
  id: number;
  email: string;
  firstname: string;
  lastname: string;
}

interface AuthState {
  isAuthenticated: boolean;
  isLoading: boolean;
  user: User | null;
}

export const useAuth = () => {
  const [state, setState] = useState<AuthState>({
    isAuthenticated: false,
    isLoading: true,
    user: null,
  });

  useEffect(() => {
    const checkAuth = () => {
      const isAuthenticated = AuthService.isAuthenticated();
      setState({
        isAuthenticated,
        isLoading: false,
        user: null, // On pourrait stocker les infos utilisateur dans le localStorage si nécessaire
      });
    };

    checkAuth();
  }, []);

  const login = async (email: string, password: string) => {
    try {
      setState(prev => ({ ...prev, isLoading: true }));
      const response = await AuthService.login(email, password);
      setState({
        isAuthenticated: true,
        isLoading: false,
        user: response.user,
      });
      return response;
    } catch (error) {
      setState(prev => ({ ...prev, isLoading: false }));
      throw error;
    }
  };

  const logout = () => {
    AuthService.logout();
    setState({
      isAuthenticated: false,
      isLoading: false,
      user: null,
    });
  };

  return {
    ...state,
    login,
    logout,
  };
}; 