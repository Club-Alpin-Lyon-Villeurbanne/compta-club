"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Filters from "@/app/components/note-de-frais/Filters";
import ReportTable from "@/app/components/note-de-frais/ReportTable";
import Pagination from "@/app/components/note-de-frais/Pagination";
import useStore from "@/app/store/useStore";
import ErrorMessage from "@/app/components/ErrorMessage";
import { FaSpinner } from "react-icons/fa";

const ExpenseReportsClient = () => {
  const router = useRouter();
  const setExpenseReports = useStore((state) => state.setExpenseReports);
  const expenseReports = useStore((state) => state.expenseReports);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isRedirecting, setIsRedirecting] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setError(null);
        setLoading(true);
        
        // Récupérer les notes de frais
        const response = await fetch('/api/expense-reports', {
          credentials: 'include',
        });
        
        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}));
          
          // Vérifier si l'erreur est liée à l'authentification (401 ou 403)
          if (response.status === 401 || response.status === 403) {
            // Éviter la boucle infinie en vérifiant si nous sommes déjà en train de rediriger
            if (!isRedirecting) {
              setIsRedirecting(true);
              // Rediriger vers la page d'accueil pour se reconnecter
              router.push('/');
            }
            return;
          }
          
          // Pour les autres erreurs, afficher un message d'erreur
          setError(errorData.error || 'Erreur lors de la récupération des notes de frais');
          return;
        }
        
        const data = await response.json();
        setExpenseReports(data);
      } catch (error) {
        console.error('Error:', error);
        setError('Une erreur est survenue lors de la récupération des données. Veuillez réessayer plus tard.');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [setExpenseReports, router, isRedirecting]);

  if (error) {
    return <ErrorMessage message={error} />;
  }

  return (
    <main>
      <div className="container px-4 mx-auto sm:px-8">
        <div className="py-8">
          <div className="flex items-center justify-between mb-8">
            <h2 className="text-2xl font-semibold leading-tight">
              Notes de frais
            </h2>
          </div>
          <Filters />
          <div className="relative">
            {loading ? (
              <div className="flex items-center justify-center p-8">
                <FaSpinner className="w-8 h-8 text-indigo-600 animate-spin" />
              </div>
            ) : (
              <>
                <ReportTable reports={expenseReports} isLoading={loading} />
                <Pagination />
              </>
            )}
          </div>
        </div>
      </div>
    </main>
  );
};

export default ExpenseReportsClient; 