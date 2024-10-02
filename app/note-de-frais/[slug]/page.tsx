"use client";
import React, { useCallback, useEffect, useReducer } from "react";
import { useSession } from "next-auth/react";
import { redirect, useRouter } from "next/navigation";
import useAxiosAuth from "@/app/lib/hooks/useAxiosAuth";
import { ExpenseReport, Event } from "@/app/interfaces/noteDeFraisInterface";
import { FaCalendarAlt, FaExclamationTriangle, FaSpinner, FaHome, FaUsers, FaInfoCircle } from "react-icons/fa";
import dayjs from "dayjs";
import ExpensesList from "@/app/components/note-de-frais/ExpensesTables/ExpensesList";
import Header from "@/app/components/note-de-frais/header";
import LoadingSpinner from "@/app/components/LoadingSpinner";
import ErrorMessage from "@/app/components/ErrorMessage";
import EventInfo from "@/app/components/EventInfo";

// Types
type State = {
  event: Event | null;
  ndfs: ExpenseReport[] | null;
  loading: boolean;
  error: string | null;
};

type Action =
  | { type: 'FETCH_START' }
  | { type: 'FETCH_SUCCESS'; payload: { event: Event; ndfs: ExpenseReport[] } }
  | { type: 'FETCH_ERROR'; payload: string }
  | { type: 'UPDATE_NDF_STATUS'; payload: { id: number; status: number } }
  | { type: 'RESET' };

// Reducer
const reducer = (state: State, action: Action): State => {
  switch (action.type) {
    case 'FETCH_START':
      return { ...state, loading: true, error: null };
    case 'FETCH_SUCCESS':
      return { ...state, loading: false, event: action.payload.event, ndfs: action.payload.ndfs, error: null };
    case 'FETCH_ERROR':
      return { ...state, loading: false, error: action.payload };
    case 'UPDATE_NDF_STATUS':
      return {
        ...state,
        ndfs: state.ndfs?.map(ndf =>
          ndf.id === action.payload.id ? { ...ndf, status: action.payload.status } : ndf
        ) ?? null
      };
    case 'RESET':
      return { event: null, ndfs: null, loading: false, error: null };
    default:
      return state;
  }
};

// Components






// Main component
export default function Home({ params }: { params: { slug: string } }) {
  const { data: session, status } = useSession();
  const axiosAuth = useAxiosAuth();
  const [state, dispatch] = useReducer(reducer, {
    event: null,
    ndfs: null,
    loading: true,
    error: null,
  });

  const fetchData = useCallback(async () => {
    dispatch({ type: 'FETCH_START' });
    try {
      const response = await axiosAuth(`/expense-reports?event=${params.slug}`);
      if (response.data.length === 0) {
        throw new Error("Aucune note de frais trouvée pour cet événement.");
      }
      const data = response.data.map((report: ExpenseReport) => ({
        ...report,
        details: JSON.parse(report.details)
      }));
      dispatch({ type: 'FETCH_SUCCESS', payload: { event: data[0].event, ndfs: data } });
    } catch (err) {
      dispatch({ type: 'FETCH_ERROR', payload: err.message || "Une erreur est survenue" });
    }
  }, [axiosAuth, params.slug]);

  const handleUpdateStatus = useCallback(async (id: number, status: number) => {
    try {
      await axiosAuth.put(`/expense-reports/${id}`, { status });
      dispatch({ type: 'UPDATE_NDF_STATUS', payload: { id, status } });
    } catch (err) {
      console.error("Erreur lors de la mise à jour du statut:", err);
      // Vous pouvez ajouter ici une notification d'erreur pour l'utilisateur
    }
  }, [axiosAuth]);

  useEffect(() => {
    if (session) fetchData();
  }, [fetchData, session]);

  if (status === "loading" || state.loading) {
    return <LoadingSpinner />;
  }

  if (!session) {
    redirect("/");
  }

  if (state.error) {
    return <ErrorMessage message={state.error} />;
  }

  if (!state.ndfs || !state.event) {
    return <ErrorMessage message="Aucun rapport de dépense trouvé" />;
  }

  return (
    <main className="bg-gray-50 min-h-screen">
      <div className="container px-4 py-8 mx-auto max-w-6xl">
        <Header
          commission={state.event.commission.id}
          titre={state.event.titre}
          id={state.event.id}
        />

        <EventInfo event={state.event} />

        <div className="bg-white shadow-sm rounded-lg p-6">
          <h2 className="text-xl font-semibold text-gray-800 mb-4">Notes de frais</h2>
          <ExpensesList expenseReports={state.ndfs} />
        </div>
      </div>
    </main>
  );
}