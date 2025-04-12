"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Filters from "@/app/components/note-de-frais/Filters";
import ReportTable from "@/app/components/note-de-frais/ReportTable";
import Pagination from "@/app/components/note-de-frais/Pagination";
import useStore from "@/app/store/useStore";
import ErrorMessage from "@/app/components/ErrorMessage";

const ExpenseReportsClient = () => {
  const router = useRouter();
  const setExpenseReports = useStore((state) => state.setExpenseReports);
  const expenseReports = useStore((state) => state.expenseReports);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setError(null);
        const response = await fetch('/api/expense-reports', {
          credentials: 'include',
        });
        
        if (response.status === 401) {
          // Si non authentifié, rediriger vers la page de connexion
          router.push('/');
          return;
        }
        
        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}));
          throw new Error(errorData.error || 'Erreur lors de la récupération des notes de frais');
        }
        
        const data = await response.json();
        setExpenseReports(data);
      } catch (error) {
        console.error('Error:', error);
        setError(error instanceof Error ? error.message : 'Erreur lors de la récupération des notes de frais');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [setExpenseReports, router]);

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
            <ReportTable reports={expenseReports} isLoading={loading} />
            <Pagination />
          </div>
        </div>
      </div>
    </main>
  );
};

export default ExpenseReportsClient; 