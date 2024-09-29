"use client";
import React, { useCallback, useEffect, useReducer } from "react";
import { useSession } from "next-auth/react";
import { redirect, useRouter } from "next/navigation";
import useAxiosAuth from "@/app/lib/hooks/useAxiosAuth";
import { ExpenseReport, Event } from "@/app/interfaces/noteDeFraisInterface";
import { FaCalendarAlt, FaExclamationTriangle, FaMapMarkerAlt, FaSpinner, FaHome } from "react-icons/fa";
import dayjs from "dayjs";
import ExpensesList from "@/app/components/note-de-frais/ExpensesTables/ExpensesList";
import Header from "@/app/components/note-de-frais/header";

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
    case 'RESET':
      return { event: null, ndfs: null, loading: false, error: null };
    default:
      return state;
  }
};

// Components
const LoadingSpinner = () => (
  <div className="flex justify-center items-center h-screen" role="status">
    <FaSpinner className="animate-spin text-blue-500 w-8 h-8" aria-hidden="true" />
    <span className="ml-2 text-lg text-gray-700">Chargement...</span>
  </div>
);

const ErrorMessage = ({ message }: { message: string }) => {
  const router = useRouter();

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="bg-white shadow-md rounded-lg p-6 max-w-lg mx-auto">
        <div className="flex items-center justify-center mb-4">
          <FaExclamationTriangle className="text-red-500 w-12 h-12" aria-hidden="true" />
        </div>
        <h2 className="text-2xl font-bold text-gray-800 text-center mb-4">
          Oups ! Une erreur est survenue
        </h2>
        <p className="text-gray-600 text-center mb-6">{message}</p>
        <div className="flex justify-center">
          <button
            onClick={() => router.push('/')}
            className="bg-blue-500 hover:bg-blue-600 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline flex items-center"
          >
            <FaHome className="mr-2" />
            Retour à l'accueil
          </button>
        </div>
      </div>
    </div>
  );
};

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
    <main>
      <div className="container px-4 mx-auto sm:px-8">
        <Header
          commission={state.event.commission.id}
          titre={state.event.titre}
          id={state.event.id}
        />

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 my-6">
          <div className="bg-white shadow-md rounded-lg p-4 flex items-center">
            <FaCalendarAlt className="text-blue-500 w-5 h-5 mr-3" aria-hidden="true" />
            <div>
              <p className="text-gray-500">Date de début</p>
              <p className="font-semibold">{dayjs(state.event.tsp).format('DD/MM/YYYY à H:mm')}</p>
            </div>
          </div>
          <div className="bg-white shadow-md rounded-lg p-4 flex items-center">
            <FaCalendarAlt className="text-blue-500 w-5 h-5 mr-3" aria-hidden="true" />
            <div>
              <p className="text-gray-500">Date de fin</p>
              <p className="font-semibold">{dayjs(state.event.tspEnd).format('DD/MM/YYYY à H:mm')}</p>
            </div>
          </div>
          <div className="bg-white shadow-md rounded-lg p-4 flex items-center">
            <FaMapMarkerAlt className="text-blue-500 w-5 h-5 mr-3" aria-hidden="true" />
            <div>
              <p className="text-gray-500">Lieu</p>
              <p className="font-semibold">{state.event.rdv}</p>
            </div>
          </div>
        </div>

        <ExpensesList expenseReports={state.ndfs} />
      </div>
    </main>
  );
}