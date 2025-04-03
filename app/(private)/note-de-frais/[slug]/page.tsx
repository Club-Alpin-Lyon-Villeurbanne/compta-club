"use client";
import React, { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { ExpenseReport, Event } from "@/app/interfaces/noteDeFraisInterface";
import Header from "@/app/components/note-de-frais/header";
import LoadingSpinner from "@/app/components/LoadingSpinner";
import ErrorMessage from "@/app/components/ErrorMessage";
import EventInfo from "@/app/components/EventInfo";
import ExpensesList from "@/app/components/note-de-frais/ExpensesTables/ExpensesList";

const ExpenseReportContent = ({
  event,
  expenseReports,
  fetchData,
}: {
  event: Event;
  expenseReports: ExpenseReport[];
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
          params={{ slug: event.id.toString() }}
        />
      </div>
    </div>
  </main>
);

export default function ExpenseReportPage() {
  const router = useRouter();
  const params = useParams();
  const slug = params?.slug;

  const [event, setEvent] = useState<Event | null>(null);
  const [expenseReports, setExpenseReports] = useState<ExpenseReport[] | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchExpenseReports = async () => {
    if (!slug) return;

    try {
      setIsLoading(true);
      setError(null);

      const response = await fetch(`/api/expense-reports/${slug}`);
      if (!response.ok) {
        throw new Error('Erreur lors de la récupération des notes de frais');
      }
      const reports = await response.json();

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
    if (slug) {
      fetchExpenseReports();
    }
  }, [slug]);

  if (isLoading) {
    return <LoadingSpinner />;
  }

  if (error) {
    return <ErrorMessage message={error} />;
  }

  if (!event || !expenseReports) {
    return <ErrorMessage message="Aucune donnée disponible" />;
  }

  return (
    <ExpenseReportContent
      event={event}
      expenseReports={expenseReports}
      fetchData={fetchExpenseReports}
    />
  );
}
