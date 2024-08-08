'use client';
import { useCallback, useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import { redirect } from 'next/navigation';
import useAxiosAuth from '@/app/lib/hooks/useAxiosAuth';
import { ExpenseReport } from "@/app/interfaces/noteDeFraisInterface";
import Header from "@/app/components/note-de-frais/header";
import { sweetModalComment } from "@/app/components/sweetModalComment";
import {ExpenseStatus, getExpenseStatusTranslation} from "@/app/enums/ExpenseStatus";

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

  const handleAction = async (action: ExpenseStatus.VALIDATE | ExpenseStatus.REJECT) => {
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
    setComment('');
  }

  const reject = (comment: string) => {
    patch({ status: ExpenseStatus.REJECT, comment });
    setComment('');
  }

  useEffect(() => {
    if (session) fetchData();
  }, [fetchData, session]);

  if (status === "loading") {
    return <div>Loading...</div>;
  }

  if (!session) {
    redirect("/");
  }

  if (loading) {
    return <div>Loading expense report...</div>;
  }

  if (error) {
    console.error(error);
  }

  if (!ndf) {
    return <div>No expense report found.</div>;
  }

  return (
      <main>
        <div className="container px-4 mx-auto sm:px-8">
          <div className="flex">
            <Header commission={ndf.event.commission} titre={ndf.event.titre} id={ndf.id} />
          </div>
          <div className="flex flex-col my-2 sm:flex-row">
            <div className="flex flex-row mb-1 sm:mb-0">
              Date de début: {(new Date(parseInt(ndf.event.tsp) * 1000)).toLocaleDateString()}<br />
              Date de fin: {(new Date(parseInt(ndf.event.tspEnd) * 1000)).toLocaleDateString()}<br />
              Statut: {ndf.status}<br />
              Lieu: {ndf.event.rdv}<br />
              Nombre de participants: {ndf.participations.length}
            </div>
          </div>
          <div className="grid grid-flow-row-dense grid-cols-3">
            {ndf.status !== ExpenseStatus.APPROVED && ndf.status !== ExpenseStatus.REJECT && (
                <>
                  <button
                      className="inline-flex items-center px-3 py-2 text-sm font-medium text-center text-white bg-blue-700 rounded-lg hover:bg-blue-800 focus:ring-4 focus:outline-none focus:ring-blue-300 dark:bg-blue-600 dark:hover:bg-blue-700 dark:focus:ring-blue-800"
                      onClick={() => handleAction(ExpenseStatus.VALIDATE)}
                  >
                    {getExpenseStatusTranslation(ExpenseStatus.VALIDATE)}
                  </button>
                  <button
                      className="inline-flex items-center px-3 py-2 ml-10 text-sm font-medium text-center text-white bg-red-700 rounded-lg hover:bg-red-800 focus:ring-4 focus:outline-none focus:ring-blue-300 dark:bg-blue-600 dark:hover:bg-blue-700 dark:focus:ring-blue-800"
                      onClick={() => handleAction(ExpenseStatus.REJECT)}
                  >
                    {getExpenseStatusTranslation(ExpenseStatus.REJECT)}
                  </button>
                </>
            )}

            {
                ndf.status === ExpenseStatus.APPROVED && (
                    <div className="flex flex-row mb-1 sm:mb-0">
                      <p>Commentaire de validation: {ndf.statusComment}</p>
                    </div>
                )
            }

            {
                ndf.status === ExpenseStatus.REJECT && (
                    <div className="flex flex-row mb-1 sm:mb-0">
                      <p>Commentaire de refus: {ndf.statusComment}</p>
                    </div>
                )
            }
          </div>
        </div>
        <div className="grid grid-flow-row-dense grid-cols-3">
          <button
            className="inline-flex items-center px-3 py-2 text-sm font-medium text-center text-white bg-blue-700 rounded-lg hover:bg-blue-800 focus:ring-4 focus:outline-none focus:ring-blue-300 dark:bg-blue-600 dark:hover:bg-blue-700 dark:focus:ring-blue-800"
            onClick={() => handleAction(SendingChoice.VALIDATE)}
          >
            {getSendingChoiceTranslation(SendingChoice.VALIDATE)}
          </button>
          <button
            className="inline-flex items-center px-3 py-2 ml-10 text-sm font-medium text-center text-white bg-red-700 rounded-lg hover:bg-red-800 focus:ring-4 focus:outline-none focus:ring-blue-300 dark:bg-blue-600 dark:hover:bg-blue-700 dark:focus:ring-blue-800"
            onClick={() => handleAction(SendingChoice.REJECT)}
          >
            {getSendingChoiceTranslation(SendingChoice.REJECT)}
          </button>
        </div>
      </div>
    </main>
  );
}
