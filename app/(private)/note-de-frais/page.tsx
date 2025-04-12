import ExpenseReportsClient from './ExpenseReportsClient';

// Indiquer à Next.js que cette page doit être rendue dynamiquement
export const dynamic = 'force-dynamic';

// Composant serveur qui vérifie l'authentification
export default async function ExpenseReportsPage() {
  return <ExpenseReportsClient />;
}
