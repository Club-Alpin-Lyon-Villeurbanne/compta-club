"use client";
import React, { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { FaArrowLeft } from "react-icons/fa";
import { EventExpenseReport, Event } from "@/app/interfaces/noteDeFraisInterface";
import Header from "@/app/components/note-de-frais/header";
import { get } from "@/app/lib/fetchClient";
import LoadingSpinner from "@/app/components/LoadingSpinner";
import ErrorMessage from "@/app/components/ErrorMessage";
import EventInfo from "@/app/components/EventInfo";
import ExpensesList from "@/app/components/note-de-frais/ExpensesTables/ExpensesList";
import { useDocumentTitle } from "@/app/lib/hooks/useDocumentTitle";
import AdresseIntrouvable from "@/app/components/note-de-frais/AdresseIntrouvable";

const RetourALaListe = () => (
  <Link href="/note-de-frais" className="inline-flex items-center mb-5 text-sm text-blue-700 hover:underline">
    <FaArrowLeft className="mr-2" aria-hidden="true" />
    Retour à la liste
  </Link>
);

const ExpenseReportContent = ({
  event,
  expenseReports,
  fetchData,
}: {
  event: Event;
  expenseReports: EventExpenseReport[];
  fetchData: () => Promise<void>;
}) => (
  <div className="container max-w-6xl px-4 mx-auto">
    <RetourALaListe />
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
);

export default function ExpenseReportPage() {
  const params = useParams();
  const slug = params?.slug;

  const [event, setEvent] = useState<Event | null>(null);
  const [expenseReports, setExpenseReports] = useState<EventExpenseReport[] | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [introuvable, setIntrouvable] = useState(false);

  const fetchExpenseReports = useCallback(async () => {
    if (!slug) return;

    try {
      setIsLoading(true);
      setError(null);

      // Récupération des notes de frais avec gestion automatique du token
      const reports = await get<EventExpenseReport[]>(`/api/expense-reports/${slug}`);

      if (!reports || reports.length === 0) {
        setIntrouvable(true);
        return;
      }

      const parsedReports = reports.map((report: EventExpenseReport) => {
        let parsedDetails = report.details;
        if (typeof report.details === "string") {
          try {
            parsedDetails = JSON.parse(report.details);
          } catch {
            parsedDetails = null;
          }
        }
        return { ...report, details: parsedDetails };
      });

      setEvent(parsedReports[0].sortie);
      setExpenseReports(parsedReports);
    } catch (err) {
      const status = (err as { status?: number }).status;
      if (status === 400 || status === 404) {
        setIntrouvable(true);
      } else {
        setError("Une erreur est survenue lors du chargement des données");
      }
    } finally {
      setIsLoading(false);
    }
  }, [slug]);

  useEffect(() => {
    if (slug) {
      fetchExpenseReports();
    }
  }, [slug, fetchExpenseReports]);

  useDocumentTitle(event ? `${event.titre} · Compta Club` : null);

  if (introuvable) {
    return <AdresseIntrouvable>Aucune note de frais à traiter pour cette sortie.</AdresseIntrouvable>;
  }

  if (isLoading) {
    return <LoadingSpinner />;
  }

  if (error) {
    return (
      <div className="container max-w-6xl px-4 mx-auto">
        <RetourALaListe />
        <ErrorMessage message={error} />
      </div>
    );
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
