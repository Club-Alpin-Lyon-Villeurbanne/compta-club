"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Filters from "@/app/components/note-de-frais/Filters";
import ReportTable from "@/app/components/note-de-frais/ReportTable";
import Pagination from "@/app/components/note-de-frais/Pagination";
import useStore from "@/app/store/useStore";
import ErrorMessage from "@/app/components/ErrorMessage";
import { FaSpinner } from "react-icons/fa";
import { get } from "@/app/lib/fetchClient";

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
        
        // Récupérer les notes de frais avec gestion automatique du refresh token
        const data = await get('/api/expense-reports');
        
        // Vérifier que les données sont bien un tableau
        if (Array.isArray(data)) {
          setExpenseReports(data);
        } else {
          setError('Format de données invalide reçu du serveur');
          setExpenseReports([]);
        }
      } catch (error: any) {
        // Si l'erreur est liée à l'authentification après le refresh token
        if (error.message?.includes('Non authentifié')) {
          if (!isRedirecting) {
            setIsRedirecting(true);
            router.push('/');
          }
          return;
        }
        
        setError(error.message || 'Une erreur est survenue lors de la récupération des données.');
        setExpenseReports([]);
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