"use client";

import React from "react";
import Filters from "@/app/components/note-de-frais/Filters";
import ReportTable from "@/app/components/note-de-frais/ReportTable";
import Pagination from "@/app/components/note-de-frais/Pagination";
import useStore from "@/app/store/useStore";
import ErrorMessage from "@/app/components/ErrorMessage";
import { FaSpinner } from "react-icons/fa";
import { useExpenseReports } from "@/app/hooks/useExpenseReports";

const ExpenseReportsClient = () => {
  const { error } = useExpenseReports();
  const expenseReports = useStore((state) => state.expenseReports);
  const isLoading = useStore((state) => state.isLoading);
  const paginationMeta = useStore((state) => state.paginationMeta);

  const isInitialLoad = isLoading && !paginationMeta;

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
            {isInitialLoad ? (
              <div className="flex items-center justify-center p-8">
                <FaSpinner className="w-8 h-8 text-indigo-600 animate-spin" />
              </div>
            ) : (
              <div className={isLoading ? 'opacity-50 pointer-events-none' : ''}>
                <ReportTable reports={expenseReports} isLoading={isLoading} />
                <Pagination />
              </div>
            )}
          </div>
        </div>
      </div>
    </main>
  );
};

export default ExpenseReportsClient;
