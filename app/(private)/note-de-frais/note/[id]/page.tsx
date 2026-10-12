"use client";
import React, { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { ExpenseReport, NonEventExpenseReport } from "@/app/interfaces/noteDeFraisInterface";
import { getExpenseStatusTranslation } from "@/app/enums/ExpenseStatus";
import { get } from "@/app/lib/fetchClient";
import { useExpenseActions } from "@/app/lib/hooks/useExpenseAction";
import { getActionConfirmation, isEventReport, TreasuryAction } from "@/app/utils/expenseReport";
import LoadingSpinner from "@/app/components/LoadingSpinner";
import ErrorMessage from "@/app/components/ErrorMessage";
import NoteHorsSortieDetail from "@/app/components/note-de-frais/NoteHorsSortieDetail";

type LoadError = "introuvable" | "erreur";

const NoteIntrouvable = () => (
  <div className="container px-4 py-8 mx-auto">
    <div className="max-w-lg p-6 mx-auto text-center bg-white rounded-lg shadow-sm">
      <p className="mb-4 text-gray-700">Cette adresse ne correspond à aucune note de frais.</p>
      <Link href="/note-de-frais" className="text-blue-700 hover:underline">
        Retour à la liste des notes
      </Link>
    </div>
  </div>
);

export default function NoteHorsSortiePage() {
  const router = useRouter();
  const params = useParams<{ id: string }>();
  const id = params?.id ?? "";

  const [note, setNote] = useState<NonEventExpenseReport | null>(null);
  const [error, setError] = useState<LoadError | null>(null);
  const [confirmation, setConfirmation] = useState<string | null>(null);

  const fetchNote = useCallback(async (): Promise<NonEventExpenseReport | null> => {
    try {
      const report = await get<ExpenseReport>(`/api/expense-reports/note/${encodeURIComponent(id)}`);
      // Une note de sortie se traite sur la page de sa sortie.
      if (isEventReport(report)) {
        router.replace(`/note-de-frais/${report.sortie.id}`);
        return null;
      }
      setNote(report);
      setError(null);
      return report;
    } catch (err) {
      const status = (err as { status?: number }).status;
      setError(status === 400 || status === 404 ? "introuvable" : "erreur");
      return null;
    }
  }, [id, router]);

  const statusAfterReload = useCallback(async () => {
    const reloaded = await fetchNote();
    return reloaded ? getExpenseStatusTranslation(reloaded.status) : null;
  }, [fetchNote]);

  const { handleAction, pendingAction } = useExpenseActions(fetchNote, { onAlreadyProcessed: statusAfterReload });

  const onAction = useCallback(
    async (noteId: number, action: TreasuryAction) => {
      if (!note) return;
      setConfirmation(null);
      if (await handleAction(noteId, action)) setConfirmation(getActionConfirmation(action, note));
    },
    [handleAction, note]
  );

  useEffect(() => {
    fetchNote();
  }, [fetchNote]);

  // Deux notes ouvertes dans deux onglets se distinguent par leur titre.
  useEffect(() => {
    if (!note) return;
    const previous = document.title;
    document.title = `Note ${note.id} : ${note.objet} · Compta Club`;
    return () => {
      document.title = previous;
    };
  }, [note]);

  if (error === "introuvable") return <NoteIntrouvable />;
  if (error) return <ErrorMessage message="Une erreur est survenue lors du chargement de la note de frais" variant="page" />;
  if (!note) return <LoadingSpinner />;

  return (
    <NoteHorsSortieDetail
      note={note}
      onAction={onAction}
      pendingAction={pendingAction}
      confirmation={confirmation}
    />
  );
}
