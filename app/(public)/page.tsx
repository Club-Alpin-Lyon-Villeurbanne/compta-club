'use client';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import LoginForm from '../components/LoginForm';
import useAuthStore from '@/app/store/useAuthStore';

export default function HomePage() {
  const router = useRouter();
  const { isAuthenticated } = useAuthStore();

  useEffect(() => {
    if (isAuthenticated) {
      router.push('/note-de-frais');
    }
  }, [isAuthenticated, router]);

  return (
    <div className="flex flex-col items-center justify-center min-h-[calc(100vh-8rem)]">
      <div className="w-full max-w-md">
        <h1 className="text-3xl font-bold text-center text-gray-900 mb-8">
          Bienvenue sur Compta-Club
        </h1>
        <p className="text-center text-gray-600 mb-8">
          La gestion simplifiée des notes de frais pour le Club Alpin de Lyon
        </p>
        <LoginForm />
      </div>
    </div>
  );
}