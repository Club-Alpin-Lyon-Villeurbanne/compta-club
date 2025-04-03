"use client";

import React, { useEffect, useState } from "react";
import Filters from "@/app/components/note-de-frais/Filters";
import ReportTable from "@/app/components/note-de-frais/ReportTable";
import Pagination from "@/app/components/note-de-frais/Pagination";
import useStore from "@/app/store/useStore";

const ExpenseReportsClient = () => {
  const setExpenseReports = useStore((state) => state.setExpenseReports);
  const expenseReports = useStore((state) => state.expenseReports);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await fetch('/api/expense-reports');
        if (!response.ok) {
          throw new Error('Erreur lors de la récupération des notes de frais');
        }
        const data = await response.json();
        setExpenseReports(data);
      } catch (error) {
        console.error('Error:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [setExpenseReports]);

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