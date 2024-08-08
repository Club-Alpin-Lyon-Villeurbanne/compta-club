'use client';
import { useSession } from 'next-auth/react';
import LoginForm from './components/LoginForm';
import { redirect } from 'next/navigation';

export default function HomePage() {
  const { data: session, status } = useSession();

  if (status === 'loading') {
    return <div>Loading...</div>;
  }

  if (session) {
    redirect('/note-de-frais');
  }

  return (
      <main>
        <div className="flex min-h-full flex-1 flex-col justify-center px-6 py-12 lg:px-8">
          <div className="sm:mx-auto sm:w-full sm:max-w-sm">
            <h2 className="mt-10 text-center text-2xl font-bold leading-9 tracking-tight text-gray-900">
              Bienvenue sur Compta-Club
            </h2>
          </div>
          <LoginForm/>
        </div>
      </main>
  );
}
