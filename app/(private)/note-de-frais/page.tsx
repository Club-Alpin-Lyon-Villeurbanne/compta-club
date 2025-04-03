import { checkAuthOrRedirect } from '@/app/lib/fetchServer';
import ExpenseReportsClient from './ExpenseReportsClient';

// Composant serveur qui vérifie l'authentification
export default async function ExpenseReportsPage() {
  // Vérifier si l'utilisateur est authentifié
  await checkAuthOrRedirect();
  
  // Si l'utilisateur est authentifié, afficher le composant client
  return <ExpenseReportsClient />;
}
