"use client";
import { useCallback, useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { redirect } from "next/navigation";
import useAxiosAuth from "@/app/lib/hooks/useAxiosAuth";
import { ExpenseReport } from "@/app/interfaces/noteDeFraisInterface";
import Header from "@/app/components/note-de-frais/header";
import { sweetModalComment } from "@/app/components/sweetModalComment";
import {
  ExpenseStatus,
  getExpenseStatusTranslation,
} from "@/app/enums/ExpenseStatus";
import ExpensesTable from "@/app/components/note-de-frais/ExpensesTables/ExpensesTable";
import {
  FaCalendarAlt,
  FaExclamationTriangle,
  FaInfoCircle,
  FaMapMarkerAlt,
  FaSpinner,
  FaUsers,
} from "react-icons/fa";

export default function Home({ params }: { params: { slug: string } }) {
  const { data: session, status } = useSession();
  const [ndf, setNdf] = useState<ExpenseReport | null>(null);
  const [comment, setComment] = useState<string>("");
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const axiosAuth = useAxiosAuth();

  const fetchData = useCallback(async () => {
    try {
      const response = await axiosAuth("/expense-report/" + params.slug);
      setNdf(response.data.expenseReport);
    } catch (err) {
      setError("Failed to fetch data");
    } finally {
      setLoading(false);
    }
  }, [axiosAuth, params.slug]);

  const patch = async (state: { status: ExpenseStatus; comment: string }) => {
    try {
      const response = await axiosAuth(
        `/expense-report/${params.slug}/status`,
        {
          method: "patch",
          data: {
            status: state.status,
            statusComment: state.comment,
          },
        }
      );
      if (response.status === 200 && session) {
        await fetchData();
      }
    } catch (err) {
      setError("Failed to update status");
    }
  };

  const handleAction = async (
    action: ExpenseStatus.VALIDATE | ExpenseStatus.REJECT
  ) => {
    const inputComment = await sweetModalComment(comment, setComment, action);
    if (inputComment !== null) {
      if (action === ExpenseStatus.VALIDATE) {
        validate(inputComment);
      } else if (action === ExpenseStatus.REJECT) {
        reject(inputComment);
      }
    }
  };

  const validate = (comment: string) => {
    patch({ status: ExpenseStatus.APPROVED, comment });
    setComment("");
  };

  const reject = (comment: string) => {
    patch({ status: ExpenseStatus.REJECT, comment });
    setComment("");
  };

  useEffect(() => {
    if (session) fetchData();
  }, [fetchData, session]);

  if (status === "loading") {
    return (
      <div className="flex justify-center items-center h-screen">
        <FaSpinner className="animate-spin text-blue-500 w-8 h-8" />
        <span className="ml-2 text-lg text-gray-700">
          Chargement de la session...
        </span>
      </div>
    );
  }

  if (!session) {
    redirect("/");
  }

  if (loading) {
    return (
      <div className="flex justify-center items-center h-screen">
        <FaSpinner className="animate-spin text-blue-500 w-8 h-8" />
        <span className="ml-2 text-lg text-gray-700">
          Chargement de la note de frais...
        </span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex justify-center items-center h-screen">
        <div className="text-center">
          <FaExclamationTriangle className="text-red-500 w-8 h-8 mb-4" />
          <h2 className="text-2xl font-bold text-gray-700">
            Une erreur est survenue
          </h2>
          <p className="text-gray-500 mt-2">{error}</p>
        </div>
      </div>
    );
  }

  if (!ndf) {
    return (
      <div className="flex justify-center items-center h-screen">
        <div className="text-center">
          <FaExclamationTriangle className="text-orange-500 w-8 h-8 mb-4" />
          <h2 className="text-2xl font-bold text-gray-700">
            Aucun rapport de dépense trouvé
          </h2>
          <p className="text-gray-500 mt-2">
            Vérifiez les informations et réessayez.
          </p>
        </div>
      </div>
    );
  }

  return (
    <main>
      <div className="container px-4 mx-auto sm:px-8">
        <div className="flex">
          <Header
            commission={ndf.event.commission}
            titre={ndf.event.titre}
            id={ndf.id}
          />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 my-6">
          <div className="bg-white shadow-md rounded-lg p-4 flex items-center">
            <FaCalendarAlt className="text-blue-500 w-5 h-5 mr-3" />
            <div>
              <p className="text-gray-500">Date de début</p>
              <p className="font-semibold">
                {new Date(parseInt(ndf.event.tsp) * 1000).toLocaleDateString()}
              </p>
            </div>
          </div>
          <div className="bg-white shadow-md rounded-lg p-4 flex items-center">
            <FaCalendarAlt className="text-blue-500 w-5 h-5 mr-3" />
            <div>
              <p className="text-gray-500">Date de fin</p>
              <p className="font-semibold">
                {new Date(
                  parseInt(ndf.event.tspEnd) * 1000
                ).toLocaleDateString()}
              </p>
            </div>
          </div>
          <div className="bg-white shadow-md rounded-lg p-4 flex items-center">
            <FaInfoCircle className="text-blue-500 w-5 h-5 mr-3" />
            <div>
              <p className="text-gray-500">Statut</p>
              <span
                className={`font-semibold text-sm px-2 py-1 rounded-full ${
                  ndf.status === ExpenseStatus.APPROVED
                    ? "bg-green-100 text-green-700"
                    : ndf.status === ExpenseStatus.REJECT
                    ? "bg-red-100 text-red-700"
                    : "bg-yellow-100 text-yellow-700"
                }`}
              >
                {getExpenseStatusTranslation(ndf.status as ExpenseStatus)}
              </span>
            </div>
          </div>
          <div className="bg-white shadow-md rounded-lg p-4 flex items-center">
            <FaMapMarkerAlt className="text-blue-500 w-5 h-5 mr-3" />
            <div>
              <p className="text-gray-500">Lieu</p>
              <p className="font-semibold">{ndf.event.rdv}</p>
            </div>
          </div>
          <div className="bg-white shadow-md rounded-lg p-4 flex items-center">
            <FaUsers className="text-blue-500 w-5 h-5 mr-3" />
            <div>
              <p className="text-gray-500">Nombre de participants</p>
              <p className="font-semibold">{ndf.participations.length}</p>
            </div>
          </div>
        </div>

        <ExpensesTable
          transport={ndf.expenseGroups.transport}
          hebergement={ndf.expenseGroups.hebergement}
          autres={ndf.expenseGroups.autres}
        />

        <div className="grid grid-cols-1 gap-4 mt-6">
          {ndf.status !== ExpenseStatus.APPROVED &&
            ndf.status !== ExpenseStatus.REJECT && (
              <div className="flex space-x-4">
                <button
                  className="inline-flex items-center px-3 py-2 text-sm font-medium text-center text-white bg-blue-700 rounded-lg hover:bg-blue-800 focus:ring-4 focus:outline-none focus:ring-blue-300 dark:bg-blue-600 dark:hover:bg-blue-700 dark:focus:ring-blue-800"
                  onClick={() => handleAction(ExpenseStatus.VALIDATE)}
                >
                  Valider
                </button>
                <button
                  className="inline-flex items-center px-3 py-2 text-sm font-medium text-center text-white bg-red-700 rounded-lg hover:bg-red-800 focus:ring-4 focus:outline-none focus:ring-red-300 dark:bg-red-600 dark:hover:bg-red-700 dark:focus:ring-red-800"
                  onClick={() => handleAction(ExpenseStatus.REJECT)}
                >
                  Refuser
                </button>
              </div>
            )}

          {ndf.status === ExpenseStatus.APPROVED && (
            <div
              className="bg-green-100 border-l-4 border-green-500 text-green-700 p-4 rounded-lg"
              role="alert"
            >
              <p className="font-bold">Note de frais validée</p>
              <p>Commentaire: {ndf.statusComment}</p>
            </div>
          )}

          {ndf.status === ExpenseStatus.REJECT && (
            <div
              className="bg-orange-100 border-l-4 border-orange-500 text-orange-700 p-4 rounded-lg"
              role="alert"
            >
              <p className="font-bold">Note de frais refusée</p>
              <p>Commentaire: {ndf.statusComment}</p>
            </div>
          )}
        </div>
      </div>
    </main>
  );
}
