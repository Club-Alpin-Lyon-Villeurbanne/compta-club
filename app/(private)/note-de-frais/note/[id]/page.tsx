"use client";
import React, { useCallback, useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { ExpenseReport, NonEventExpenseReport } from "@/app/interfaces/noteDeFraisInterface";
import { get } from "@/app/lib/fetchClient";
import { useExpenseActions } from "@/app/lib/hooks/useExpenseAction";
import { isEventReport, TreasuryAction } from "@/app/utils/expenseReport";
import LoadingSpinner from "@/app/components/LoadingSpinner";
import ErrorMessage from "@/app/components/ErrorMessage";
import NoteHorsSortieDetail from "@/app/components/note-de-frais/NoteHorsSortieDetail";

export default function NoteHorsSortiePage() {
  const router = useRouter();
  const params = useParams<{ id: string }>();
  const id = params?.id ?? "";

  const [note, setNote] = useState<NonEventExpenseReport | null>(null);
  const [error, setError] = useState<string | null>(null);

  const fetchNote = useCallback(async () => {
    try {
      const report = await get<ExpenseReport>(`/api/expense-reports/note/${encodeURIComponent(id)}`);
      // Une note de sortie se traite sur la page de sa sortie.
      if (isEventReport(report)) {
        router.replace(`/note-de-frais/${report.sortie.id}`);
        return;
      }
      setNote(report);
      setError(null);
    } catch (err) {
      const status = (err as { status?: number }).status;
      setError(
        status === 400 || status === 404
          ? (err as Error).message
          : "Une erreur est survenue lors du chargement de la note de frais"
      );
    }
  }, [id, router]);

  const { handleAction } = useExpenseActions(fetchNote);

  // Après un refus de la plateforme (« Cette demande a déjà été traitée. »), la page montre où en est la note.
  const onAction = useCallback(
    async (noteId: number, action: TreasuryAction) => {
      if (!(await handleAction(noteId, action))) await fetchNote();
    },
    [handleAction, fetchNote]
  );

  useEffect(() => {
    fetchNote();
  }, [fetchNote]);

  if (error) return <ErrorMessage message={error} variant="page" />;
  if (!note) return <LoadingSpinner />;

  return <NoteHorsSortieDetail note={note} onAction={onAction} />;
}
