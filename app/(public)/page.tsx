'use client';

import LoginForm from '../components/LoginForm';

export default function Home() {
  return (
    <div className="flex items-center justify-center min-h-screen px-4 py-12 bg-gray-50 sm:px-6 lg:px-8">
      <div className="w-full max-w-md space-y-8">
        <div>
          <h2 className="mt-6 text-3xl font-extrabold text-center text-gray-900">
            Connexion
          </h2>
        </div>
        <LoginForm />
      </div>
    </div>
  );
}