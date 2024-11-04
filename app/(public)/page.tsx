'use client';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import { FaSpinner } from 'react-icons/fa';
import LoginForm from '../components/LoginForm';

export default function HomePage() {
  const { data: session, status } = useSession();
  const router = useRouter();

  useEffect(() => {
    if (session?.accessToken) {
      router.push('/note-de-frais');
    }
  }, [session, router]);

  if (status === 'loading') {
    return (
      <div className="flex justify-center items-center h-[calc(100vh-8rem)]">
        <FaSpinner className="animate-spin text-blue-500 text-4xl" />
      </div>
    );
  }

  if (session) {
    return null; // Render nothing while redirecting
  }

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