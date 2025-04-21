import { redirect } from 'next/navigation';
import { isAuthenticated } from '../lib/auth.server';
import LoginForm from '../components/LoginForm';

export default async function Home() {
  // Si l'utilisateur est authentifié, rediriger vers /note-de-frais
  if (await isAuthenticated()) {
    redirect('/note-de-frais');
  }

  // Sinon, afficher le formulaire de connexion
  return (
    <div className="flex items-center justify-center h-full">
      <div className="w-full max-w-sm p-8 bg-white shadow-sm rounded-xl">
        <div className="mb-6">
          <h2 className="text-2xl font-bold text-center text-gray-900">
            Connexion
          </h2>
          <p className="mt-2 text-sm text-center text-gray-600">
            Connectez-vous pour accéder à votre espace
          </p>
        </div>
        <LoginForm />
      </div>
    </div>
  );
}