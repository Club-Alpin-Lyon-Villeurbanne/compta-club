"use client";
import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Filters from "@/app/components/note-de-frais/Filters";
import ReportTable from "@/app/components/note-de-frais/ReportTable";
import Pagination from "@/app/components/note-de-frais/Pagination";
import useStore from "@/app/store/useStore";
import axiosInstance from "@/app/lib/axios";
import { useAuth } from "@/app/hooks/useAuth";

const Home: React.FC = () => {
  const router = useRouter();
  const { isAuthenticated, isLoading: isAuthLoading } = useAuth();
  const setExpenseReports = useStore((state) => state.setExpenseReports);
  const expenseReports = useStore((state) => state.expenseReports);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      if (!isAuthenticated) return;
      
      setIsLoading(true);
      try {
        const response = await axiosInstance.get("/expense-reports");
        setExpenseReports(response.data);
      } catch (error) {
        console.error("Erreur lors du chargement des notes de frais:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, [isAuthenticated, setExpenseReports]);

  // Redirection si non authentifié
  if (!isAuthLoading && !isAuthenticated) {
    router.push('/login');
    return null;
  }

  if (isAuthLoading || isLoading) {
    return <div>Chargement...</div>;
  }

  return (
    <main>
      <div className="container px-4 mx-auto sm:px-8">
        <div className="py-8">
          <div>
            <h2 className="text-2xl font-semibold leading-tight">
              Notes de frais
            </h2>
          </div>
          <Filters />
          <div className="relative">
            <ReportTable reports={expenseReports} isLoading={isLoading} />
            <Pagination />
          </div>
        </div>
      </div>
    </main>
  );
};

export default Home;
