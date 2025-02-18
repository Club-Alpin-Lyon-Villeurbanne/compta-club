"use client";
import React, { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { useRouter, useParams } from "next/navigation";
import useAxiosAuth from "@/app/lib/hooks/useAxiosAuth";

import { ExpenseReport, Event } from "@/app/interfaces/noteDeFraisInterface";
import Header from "@/app/components/note-de-frais/header";
import LoadingSpinner from "@/app/components/LoadingSpinner";
import ErrorMessage from "@/app/components/ErrorMessage";
import EventInfo from "@/app/components/EventInfo";
import ExpensesList from "@/app/components/note-de-frais/ExpensesTables/ExpensesList";

const ExpenseReportContent = ({
  event,
  expenseReports,
  session,
  fetchData,
}: {
  event: Event;
  expenseReports: ExpenseReport[];
  session: any;
  fetchData: () => Promise<void>;
}) => (
  <main className="min-h-screen bg-gray-50">
    <div className="container max-w-6xl px-4 py-8 mx-auto">
      <Header commission={event.commission.id} titre={event.titre} id={event.id} />
      <EventInfo event={event} />
      <div className="p-6 bg-white rounded-lg shadow-sm">
        <h2 className="mb-4 text-xl font-semibold text-gray-800">
          Notes de frais
        </h2>
        <ExpensesList
          expenseReports={expenseReports}
          fetchData={fetchData}
          session={session}
          params={{ slug: event.id.toString() }}
        />
      </div>
    </div>
  </main>
);

export default function ExpenseReportPage() {
  // Au lieu d'extraire `{ params: { slug } }` de la signature :
  const { slug } = useParams();  
  const router = useRouter();
  const { data: session, status } = useSession();
  const axiosAuth = useAxiosAuth();

  const [event, setEvent] = useState<Event | null>(null);
  const [expenseReports, setExpenseReports] = useState<ExpenseReport[] | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchExpenseReports = async () => {
    if (!session) return;
    try {
      setIsLoading(true);
      setError(null);

      const response = await axiosAuth(`/expense-reports?event=${slug}`);
      const reports = response.data;

      if (!reports || reports.length === 0) {
        setError("Aucune note de frais trouvée pour cet événement.");
        return;
      }

      const parsedReports = reports.map((report: ExpenseReport) => ({
        ...report,
        details:
          typeof report.details === "string"
            ? JSON.parse(report.details)
            : report.details,
      }));

      setEvent(parsedReports[0].event);
      setExpenseReports(parsedReports);
    } catch (err) {
      setError("Une erreur est survenue lors du chargement des données");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchExpenseReports();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [session, axiosAuth, slug]);

  // Redirection si non authentifié, en client-side :
  if (!session && status !== "loading") {
    router.push("/");
    return null; // ou un loader
  }

  // Rendu conditionnel
  if (status === "loading" || isLoading) {
    return <LoadingSpinner />;
  }

  if (error) {
    return <ErrorMessage message={error} />;
  }

  if (!expenseReports || !event) {
    return <ErrorMessage message="Aucun rapport de dépense trouvé" />;
  }

  return (
    <ExpenseReportContent
      event={event}
      expenseReports={expenseReports}
      session={session}
      fetchData={fetchExpenseReports}
    />
  );
}
