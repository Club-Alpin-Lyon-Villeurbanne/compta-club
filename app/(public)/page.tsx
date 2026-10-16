import { redirect } from 'next/navigation';
import { isAuthenticated } from '../lib/auth.server';
import { DEFAULT_PAGE, safeReturnPath, SESSION_EXPIRED } from '../lib/loginRedirect';
import LoginForm from '../components/LoginForm';

export const metadata = { title: 'Connexion' };

interface HomeProps {
  searchParams: Promise<{ session?: string | string[]; retour?: string | string[] }>;
}

export default async function Home({ searchParams }: HomeProps) {
  const { session, retour } = await searchParams;
  const returnTo = safeReturnPath(retour) ?? DEFAULT_PAGE;

  if (await isAuthenticated()) {
    redirect(returnTo);
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
        <LoginForm returnTo={returnTo} sessionExpired={session === SESSION_EXPIRED} />
      </div>
    </div>
  );
}