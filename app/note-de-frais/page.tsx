"use client";
import React, { useEffect } from "react";
import { useSession } from "next-auth/react";
import useAxiosAuth from "../lib/hooks/useAxiosAuth";
import Filters from "@/app/components/note-de-frais/Filters";
import ReportTable from "@/app/components/note-de-frais/ReportTable";
import Pagination from "@/app/components/note-de-frais/Pagination";
import useStore from "@/app/store/useStore";

const Home: React.FC = () => {
  const { data: session } = useSession();
  const axiosAuth = useAxiosAuth();
  const setExpenseReports = useStore((state) => state.setExpenseReports);
  const expenseReports = useStore((state) => state.expenseReports);

  useEffect(() => {
    const fetchData = async () => {
      const response = await axiosAuth("/expense-report");
      setExpenseReports(response.data.expenseReports);
    };

    if (session) fetchData();
  }, [axiosAuth, session, setExpenseReports]);

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
          <div className="px-4 py-4 -mx-4 overflow-x-auto sm:-mx-8 sm:px-8">
            <ReportTable reports={expenseReports} />
            <Pagination />
          </div>
        </div>
      </div>
    </main>
  );
};

export default Home;
