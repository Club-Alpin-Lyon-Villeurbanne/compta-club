"use client";
import { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import { useAuth } from "@/app/hooks/useAuth";
import { ExpenseReport, Event } from "@/app/interfaces/noteDeFraisInterface";
import Header from "@/app/components/note-de-frais/header";
import LoadingSpinner from "@/app/components/LoadingSpinner";
import axios from "axios";

export default function ExpenseReportPage() {
  const router = useRouter();
  const params = useParams();
  const { isAuthenticated } = useAuth();
  const [report, setReport] = useState<ExpenseReport | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchReport = async () => {
      if (!isAuthenticated) {
        router.push('/login');
        return;
      }

      try {
        const response = await axios.get(`${process.env.NEXT_PUBLIC_BACKEND_BASE_URL}/expense-reports/${params.slug}`);
        setReport(response.data);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Une erreur est survenue');
      } finally {
        setLoading(false);
      }
    };

    fetchReport();
  }, [params.slug, isAuthenticated, router]);

  if (loading) {
    return <LoadingSpinner />;
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-red-600 mb-4">Erreur</h1>
          <p className="text-gray-600">{error}</p>
        </div>
      </div>
    );
  }

  if (!report) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Note de frais non trouvée</h1>
          <p className="text-gray-600">La note de frais que vous recherchez n&apos;existe pas.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <Header 
          commission={report.event.commission.id}
          titre={report.event.titre}
          id={report.event.id}
        />
      </div>
    </div>
  );
}
