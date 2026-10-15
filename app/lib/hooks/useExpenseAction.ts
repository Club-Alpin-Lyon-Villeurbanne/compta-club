import { useRef, useState } from 'react';
import { patch } from '../fetchClient';
import { DEJA_TRAITEE } from '../apiError';
import { DecisionSummary, noteStatusPhrase, TreasuryAction } from '@/app/utils/expenseReport';

const getSwal = () => import('sweetalert2').then(m => m.default);
type SwalModule = Awaited<ReturnType<typeof getSwal>>;

export const LU_PAR_LE_RESPONSABLE = 'Le responsable de la commission le verra aussi quand la note lui reviendra.';

const CLOSE_APRES_COMPTABILISATION = 'Elle sera close : plus aucune action possible.';

// Un refus de la plateforme (4xx) dit pourquoi : « Cette note a déjà été traitée. », message obligatoire…
function refusalReason(error: unknown): string | null {
  const status = (error as { status?: number } | null)?.status;
  if (!(error instanceof Error) || !status || status < 400 || status >= 500 || status === 401) return null;
  return error.message || null;
}

interface ExpenseActionsOptions {
  // Page d'une sortie : recharge ses notes après l'action.
  fetchData?: () => Promise<unknown>;
  // Relit la note et rend son statut (null si la lecture échoue) : avant l'envoi, pour ne pas agir sur une
  // note déjà traitée ailleurs, et après, pour la montrer à jour. L'action est confirmée par la réponse 2xx
  // de l'API (la `version` envoyée exclut une réponse sans effet), même si la note relue a avancé depuis.
  reloadStatus?: () => Promise<string | null>;
  // Une fois fermée la fenêtre « Note déjà traitée » : le bouton cliqué a pu disparaître, la page place le focus.
  onAlreadyProcessed?: () => void;
}

// La note telle que la page l'affichait au clic. Seule une note hors sortie a une `version`.
interface ShownNote {
  status: string;
  version?: number;
}

export function useExpenseActions(options: ExpenseActionsOptions = {}) {
  const busy = useRef(false);
  // L'action envoyée, de la confirmation à la relecture de la note
  const [pendingAction, setPendingAction] = useState<TreasuryAction | null>(null);

  // `summary` : ce que la confirmation rappelle de la note.
  const handleAction = async (reportId: number, action: TreasuryAction, shown?: ShownNote, summary?: DecisionSummary) => {
    // Une action à la fois : un second clic pendant l'envoi ne repart pas, et ne finit pas en « déjà traitée ».
    if (busy.current) return false;
    busy.current = true;
    try {
      return await runAction(reportId, action, shown, summary);
    } finally {
      busy.current = false;
      setPendingAction(null);
    }
  };

  const alreadyProcessed = (Swal: SwalModule, action: TreasuryAction, status: string | null) => {
    Swal.fire({
      title: 'Note déjà traitée',
      text: [
        'Elle a été traitée entre-temps.',
        status ? `Elle est maintenant : ${noteStatusPhrase(status)}.` : null,
        action === 'rejected' ? 'Votre refus n\'a pas été envoyé.' : 'Votre action n\'a pas été enregistrée.',
      ].filter(Boolean).join(' '),
      icon: 'info',
      didClose: options.onAlreadyProcessed,
    });
  };

  const runAction = async (reportId: number, action: TreasuryAction, shown?: ShownNote, summary?: DecisionSummary) => {
    let Swal: SwalModule;
    try {
      Swal = await getSwal();
    } catch (error) {
      // Par exemple un onglet resté ouvert pendant un déploiement : l'ancien fichier n'existe plus.
      console.error(error);
      window.alert('Une erreur est survenue. Rechargez la page puis réessayez.');
      return false;
    }

    const { fetchData, reloadStatus } = options;
    try {
      let body: { status: TreasuryAction; commentaireStatut?: string; version?: number } = { status: action };

      if (action === 'approved') {
        const result = await Swal.fire({
          // Le nom vient de l'adhérent : en texte, jamais en HTML.
          titleText: summary ? `Approuver la note de ${summary.demandeur} ?` : 'Approuver la note ?',
          text: summary ? `${summary.montant}. ${summary.demandeur} recevra un mail.` : 'Le demandeur recevra un mail.',
          icon: 'question',
          showCancelButton: true,
          confirmButtonText: 'Approuver',
          confirmButtonColor: '#15803d',
          cancelButtonText: 'Annuler',
        });

        if (!result.isConfirmed) {
          return false;
        }
      }

      if (action === 'rejected') {
        const { value: comment } = await Swal.fire({
          title: 'Refuser la note',
          text: summary?.luParLeResponsable ? LU_PAR_LE_RESPONSABLE : undefined,
          input: 'textarea',
          inputLabel: 'Message au demandeur, envoyé par mail',
          inputPlaceholder: 'Ce qu\'il doit corriger ou ajouter…',
          showCancelButton: true,
          confirmButtonText: 'Refuser',
          confirmButtonColor: '#dc2626',
          cancelButtonText: 'Annuler',
          inputValidator: (value: string) => {
            if (!value.trim()) {
              return 'Écrivez le message au demandeur.';
            }
          },
        });

        if (!comment) {
          return false;
        }
        body = { status: 'rejected', commentaireStatut: comment };
      }

      if (action === 'accounted') {
        const result = await Swal.fire({
          titleText: summary ? `Comptabiliser la note de ${summary.demandeur} ?` : 'Comptabiliser la note ?',
          text: summary ? `${summary.montant}. ${CLOSE_APRES_COMPTABILISATION}` : CLOSE_APRES_COMPTABILISATION,
          icon: 'question',
          showCancelButton: true,
          confirmButtonText: 'Comptabiliser',
          confirmButtonColor: '#9333ea',
          cancelButtonText: 'Annuler',
        });

        if (!result.isConfirmed) {
          return false;
        }
      }

      // Modifiée depuis l'affichage, même sans changer de statut (refusée, corrigée puis renvoyée) :
      // la plateforme refuse la décision (409) plutôt que de valider un montant que la page n'a pas montré.
      if (shown?.version !== undefined) body.version = shown.version;

      setPendingAction(action);
      if (reloadStatus && shown) {
        // Traitée ailleurs pendant la confirmation : rien ne part, et la fenêtre dit où en est la note
        // plutôt qu'une erreur.
        const before = await reloadStatus();
        if (before !== null && before !== shown.status) {
          alreadyProcessed(Swal, action, before);
          return false;
        }
      }

      await patch(`/api/expense-reports/${reportId}`, body);
      await (reloadStatus ?? fetchData)?.();
      return true;
    } catch (error) {
      const reason = refusalReason(error);
      // Après tout refus de l'API, la page montre la note telle qu'elle est : jamais de boutons périmés.
      const status = reason && reloadStatus ? await reloadStatus().catch(() => null) : null;
      // Parfois parmi d'autres messages : un second refus d'une note déjà refusée en ajoute un sur le commentaire.
      if (reason?.includes(DEJA_TRAITEE) && reloadStatus) {
        alreadyProcessed(Swal, action, status);
        return false;
      }
      const text = 'Une erreur est survenue lors de l\'action sur la note de frais.';
      Swal.fire({
        title: 'Erreur',
        text: reason ? `${text}\n\n${reason}` : text,
        icon: 'error',
        customClass: { htmlContainer: 'whitespace-pre-line' },
      });
      return false;
    }
  };

  return {
    handleAction,
    pendingAction,
  };
}