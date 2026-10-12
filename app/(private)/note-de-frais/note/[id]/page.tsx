"use client";
import React, { useCallback, useEffect, useRef, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { ExpenseReport, NonEventExpenseReport } from "@/app/interfaces/noteDeFraisInterface";
import { get } from "@/app/lib/fetchClient";
import { useExpenseActions } from "@/app/lib/hooks/useExpenseAction";
import { getActionConfirmation, getDecisionSummary, isEventReport, TreasuryAction } from "@/app/utils/expenseReport";
import { useDocumentTitle } from "@/app/lib/hooks/useDocumentTitle";
import LoadingSpinner from "@/app/components/LoadingSpinner";
import ErrorMessage from "@/app/components/ErrorMessage";
import NoteHorsSortieDetail from "@/app/components/note-de-frais/NoteHorsSortieDetail";
import AdresseIntrouvable from "@/app/components/note-de-frais/AdresseIntrouvable";

type LoadError = "introuvable" | "erreur";

export default function NoteHorsSortiePage() {
  const router = useRouter();
  const params = useParams<{ id: string }>();
  const id = params?.id ?? "";

  const [note, setNote] = useState<NonEventExpenseReport | null>(null);
  const [error, setError] = useState<LoadError | null>(null);
  const [reloadFailed, setReloadFailed] = useState(false);
  const [confirmation, setConfirmation] = useState<string | null>(null);
  const shownId = useRef<string | null>(null);
  const titleRef = useRef<HTMLHeadingElement>(null);

  const fetchNote = useCallback(async (): Promise<NonEventExpenseReport | null> => {
    try {
      const report = await get<ExpenseReport>(`/api/expense-reports/note/${encodeURIComponent(id)}`);
      // Une note de sortie se traite sur la page de sa sortie.
      if (isEventReport(report)) {
        router.replace(`/note-de-frais/${report.sortie.id}`);
        return null;
      }
      shownId.current = id;
      setNote(report);
      setError(null);
      setReloadFailed(false);
      return report;
    } catch (err) {
      // Une note déjà affichée reste à l'écran : seule sa relecture a échoué.
      if (shownId.current === id) {
        setReloadFailed(true);
        return null;
      }
      const status = (err as { status?: number }).status;
      setError(status === 400 || status === 404 ? "introuvable" : "erreur");
      return null;
    }
  }, [id, router]);

  const reloadStatus = useCallback(async () => (await fetchNote())?.status ?? null, [fetchNote]);
  const focusTitle = useCallback(() => titleRef.current?.focus(), []);

  const { handleAction, pendingAction } = useExpenseActions(fetchNote, { reloadStatus, onAlreadyProcessed: focusTitle });

  const onAction = useCallback(
    async (noteId: number, action: TreasuryAction) => {
      if (!note) return;
      setConfirmation(null);
      if (await handleAction(noteId, action, note.status, getDecisionSummary(note))) setConfirmation(getActionConfirmation(action, note));
    },
    [handleAction, note]
  );

  useEffect(() => {
    fetchNote();
  }, [fetchNote]);

  useDocumentTitle(note ? `Note ${note.id} : ${note.objet} · Compta Club` : null);

  if (error === "introuvable") return <AdresseIntrouvable>Cette adresse ne correspond à aucune note de frais.</AdresseIntrouvable>;
  if (error) return <ErrorMessage message="Une erreur est survenue lors du chargement de la note de frais" variant="page" />;
  if (!note) return <LoadingSpinner />;

  return (
    <NoteHorsSortieDetail
      note={note}
      onAction={onAction}
      pendingAction={pendingAction}
      confirmation={confirmation}
      reloadFailed={reloadFailed}
      titleRef={titleRef}
    />
  );
}
