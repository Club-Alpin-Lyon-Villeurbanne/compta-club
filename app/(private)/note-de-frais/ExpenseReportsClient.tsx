"use client";

import React from "react";
import Filters from "@/app/components/note-de-frais/Filters";
import ReportTable from "@/app/components/note-de-frais/ReportTable";
import Pagination from "@/app/components/note-de-frais/Pagination";
import useStore from "@/app/store/useStore";
import ErrorMessage from "@/app/components/ErrorMessage";
import { FaSpinner } from "react-icons/fa";
import { useExpenseReports } from "@/app/hooks/useExpenseReports";
import { STATUS_FILTERS } from "@/app/utils/expenseReport";

const ExpenseReportsClient = () => {
  const { error } = useExpenseReports();
  const expenseReports = useStore((state) => state.expenseReports);
  const isLoading = useStore((state) => state.isLoading);
  const paginationMeta = useStore((state) => state.paginationMeta);
  const status = useStore((state) => state.status);

  const isInitialLoad = isLoading && !paginationMeta;
  const statusLabel = STATUS_FILTERS.find((filter) => filter.value === status)?.label;

  if (error) {
    return <ErrorMessage message={error} />;
  }

  return (
    <div className="container px-4 mx-auto sm:px-8">
      <div className="py-2">
        <h1 className="mb-6 text-2xl font-semibold leading-tight">
          Notes de frais
          {/* Le total de l'API, toutes pages comprises ; caché pendant un chargement, où il serait celui d'avant. */}
          {!isLoading && paginationMeta && statusLabel && (
            <span className="font-normal text-gray-600"> · {statusLabel} ({paginationMeta.total})</span>
          )}
        </h1>
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
  );
};

export default ExpenseReportsClient;
