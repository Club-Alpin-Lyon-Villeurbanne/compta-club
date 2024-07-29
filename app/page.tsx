'use client';
import { useSession } from 'next-auth/react';
import LoginForm from './components/LoginForm';
import { redirect } from 'next/navigation';

export default function HomePage() {
  const { data: session, status } = useSession();

  if (status === 'loading') {
    return <div>Loading...</div>;
  }

  // if (session) {
  //   redirect('/note-de-frais');
  //   return null;
  // }

  return (
    <main>
      <div className="container px-4 mx-auto sm:px-8">
        <div className="flex">
          <h1>Bienvenue sur Compta-Club</h1>
          <LoginForm />
        </div>
      </div>
    </main>
  );
}
