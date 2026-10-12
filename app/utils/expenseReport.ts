import {
    Auteur,
    Commission,
    DerniereDecision,
    EventExpenseReport,
    ExpenseReport,
    ExpenseReportType,
    NonEventExpenseReport,
    ValidationResponsable,
} from '@/app/interfaces/noteDeFraisInterface';
import { ExpenseStatus, getExpenseStatusTranslation } from '@/app/enums/ExpenseStatus';
import { calculateTotals, formatEuro, toAmount } from '@/app/utils/helper';

export const REPORT_TYPE_LABELS: Record<ExpenseReportType, string> = {
    sortie: 'Sortie',
    formation: 'Formation',
    autre: 'Achat',
};

// L'API ne donne le type qu'avec les notes hors sortie : une note sans type est une note de sortie.
export function getReportType(report: ExpenseReport): ExpenseReportType {
    return report.type ?? 'sortie';
}

export function isEventReport(report: ExpenseReport): report is EventExpenseReport {
    return getReportType(report) === 'sortie';
}

export function getReportTypeLabel(report: ExpenseReport): string {
    const type = getReportType(report);
    return REPORT_TYPE_LABELS[type] ?? type;
}

export function getReportTitle(report: ExpenseReport): string {
    return (isEventReport(report) ? report.sortie?.titre : report.objet) ?? '';
}

export function getReportCommission(report: ExpenseReport): Commission | null {
    return (isEventReport(report) ? report.sortie?.commission : report.commission) ?? null;
}

/** Date et heure de la sortie, ou date de la dépense (AAAA-MM-JJ). */
export function getReportDate(report: ExpenseReport): string | null {
    return (isEventReport(report) ? report.sortie?.heureRendezVous : report.dateDepense) ?? null;
}

const DATE_ONLY = /^(\d{4})-(\d{2})-(\d{2})$/;

export function formatReportDate(date: string | null): string {
    if (!date) return '';
    // Une date sans heure lue par new Date() tombe à minuit UTC : la veille à l'ouest de Greenwich.
    const day = DATE_ONLY.exec(date);
    const parsed = day ? new Date(Number(day[1]), Number(day[2]) - 1, Number(day[3])) : new Date(date);
    return Number.isNaN(parsed.getTime()) ? '' : parsed.toLocaleDateString();
}

/**
 * Montant d'une note de sortie calculé par compta-club, comme toujours ; celui d'une note hors
 * sortie est le total déclaré, figé par la plateforme.
 */
export function getReportAmount(report: ExpenseReport): number {
    return isEventReport(report) ? calculateTotals(report.details).totalRemboursable : toAmount(report.totalDeclare);
}

/** Sous le total déclaré d'une note hors sortie : « dont 287.40 € remb. » quand les plafonds le réduisent. */
export function getRefundableNote(report: ExpenseReport): string | null {
    if (isEventReport(report)) return null;
    const remboursable = toAmount(report.totalRemboursable);
    return Math.round(remboursable * 100) < Math.round(toAmount(report.totalDeclare) * 100)
        ? `dont ${formatEuro(remboursable)} remb.`
        : null;
}

/** Date de création d'une note de sortie ; dernier envoi d'une note hors sortie, qu'on a pu corriger et renvoyer. */
export function getReportSubmissionDate(report: ExpenseReport): string {
    return isEventReport(report) ? report.dateCreation : report.dateEnvoi ?? report.dateCreation;
}

/** Page d'une note : celle de sa sortie, ou la sienne pour une note hors sortie. */
export function getReportHref(report: ExpenseReport): string | null {
    if (!isEventReport(report)) return `/note-de-frais/note/${report.id}`;
    return report.sortie ? `/note-de-frais/${report.sortie.id}` : null;
}

const jourMois = (iso: string) => new Date(iso).toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit' });
const jourMoisAnnee = (iso: string) => new Date(iso).toLocaleDateString('fr-FR');
const nomComplet = (auteur: Auteur) => [auteur.prenom, auteur.nom].filter(Boolean).join(' ');

type Decision = Pick<DerniereDecision, 'statut' | 'niveau' | 'auteur' | 'date'>;

const DECISION_VERBES: Record<Decision['statut'], string> = {
    preapproved: 'Validée',
    approved: 'Approuvée',
    rejected: 'Refusée',
};

// La trésorerie signe « la trésorerie », jamais du nom de son compte ; sans niveau connu, personne.
function signataire({ statut, niveau, auteur }: Decision): string {
    if (niveau === 'tresorerie') return ' par la trésorerie';
    const nom = niveau === 'responsable' ? nomComplet(auteur) : '';
    if (!nom) return '';
    return statut === 'preapproved' ? ` par ${nom}` : ` par ${nom} (responsable de commission)`;
}

/**
 * « Validée par Hugo BLANC le 27/01/2025 », « Approuvée par la trésorerie le … », « Refusée par la
 * trésorerie le … » ou « Refusée par Hugo BLANC (responsable de commission) le … ».
 */
export function decisionPhrase(decision: Decision, formatDate: (iso: string) => string = jourMoisAnnee): string {
    return `${DECISION_VERBES[decision.statut]}${signataire(decision)} le ${formatDate(decision.date)}`;
}

const validationDecision = (validation: ValidationResponsable): Decision =>
    ({ statut: 'preapproved', niveau: 'responsable', ...validation });

/**
 * Sous l'objet d'une note hors sortie : « Escalade · Validée par Hugo BLANC le 27/01 », ou
 * « Randonnée · Sans responsable de commission » quand elle est venue droit à la trésorerie.
 */
export function getNonEventReportDetails(report: ExpenseReport): string | null {
    if (isEventReport(report)) return null;
    const validation = report.validationResponsable;
    const circuit = validation
        ? decisionPhrase(validationDecision(validation), jourMois)
        : report.status === ExpenseStatus.SUBMITTED ? 'Sans responsable de commission' : null;
    return [report.commission?.title, circuit].filter(Boolean).join(' · ') || null;
}

/**
 * « Validée par Hugo BLANC le 27/01/2025 », ou, pour une note envoyée sans valideur, qu'elle n'en a pas ;
 * rien si aucun responsable ne l'a validée depuis son envoi.
 */
export function getValidationResponsable(report: NonEventExpenseReport): string | null {
    if (report.validationResponsable) return decisionPhrase(validationDecision(report.validationResponsable));
    return report.status === ExpenseStatus.SUBMITTED && !(report.valideurs ?? []).length
        ? 'Aucune, la commission n\'a pas de responsable.'
        : null;
}

/** « Approuvée par la trésorerie le … », sur une note approuvée ou comptabilisée. */
export function getApproval(report: NonEventExpenseReport): string | null {
    const decision = report.derniereDecision;
    const approuvee = report.status === ExpenseStatus.APPROVED || report.status === ExpenseStatus.ACCOUNTED;
    return approuvee && decision?.statut === 'approved' ? decisionPhrase(decision) : null;
}

export interface Refusal {
    // Vrai tant que la note est refusée ; faux une fois corrigée et renvoyée.
    enCours: boolean;
    intitule: string;
    message: string;
}

/**
 * Le refus d'une note : en cours si elle est refusée ; sinon, si elle a été renvoyée depuis, le
 * rappel de ce qu'il fallait corriger. Un mot laissé avec une validation n'est jamais un refus.
 */
export function getLastRefusal(report: NonEventExpenseReport): Refusal | null {
    const decision = report.derniereDecision?.statut === 'rejected' ? report.derniereDecision : null;
    if (report.status === ExpenseStatus.REJECTED) {
        return {
            enCours: true,
            intitule: decision ? decisionPhrase(decision) : 'Refusée',
            message: decision?.message ?? report.commentaireStatut ?? '',
        };
    }
    if (decision && report.dateEnvoi && new Date(report.dateEnvoi) > new Date(decision.date)) {
        return {
            enCours: false,
            intitule: `${decisionPhrase(decision, jourMois)}, corrigée et renvoyée le ${jourMois(report.dateEnvoi)}`,
            message: decision.message ?? '',
        };
    }
    return null;
}

/** « Pas encore envoyée par le demandeur. » pour un brouillon, ouvert par son adresse. */
export function getStatusNote(report: NonEventExpenseReport): string | null {
    return report.status === ExpenseStatus.DRAFT ? 'Pas encore envoyée par le demandeur.' : null;
}

export function getExpenseDateLabel(report: NonEventExpenseReport): string {
    return report.type === 'formation' ? 'Date de la formation' : 'Date de la dépense';
}

/**
 * En tête de la page : « À rembourser : 287.40 € » (« Don : … » pour un don), et
 * « 312.40 € déclarés, dont 25.00 € au-delà des plafonds du club » quand les plafonds le réduisent.
 */
export function getAmountSummary(report: NonEventExpenseReport): { titre: string; detail: string | null } {
    const remboursable = Math.round(toAmount(report.totalRemboursable) * 100);
    const declare = Math.round(toAmount(report.totalDeclare) * 100);
    return {
        titre: `${report.refundRequired ? 'À rembourser' : 'Don'} : ${formatEuro(remboursable / 100)}`,
        detail: remboursable < declare
            ? `${formatEuro(declare / 100)} déclarés, dont ${formatEuro((declare - remboursable) / 100)} au-delà des plafonds du club`
            : null,
    };
}

const deCommission = (title: string) => (/^[aeiouyàâäéèêëîïôöûü]/i.test(title) ? `d'${title}` : `de ${title}`);

/** « En attente de Hugo BLANC (responsable d'Escalade). Vous pourrez la valider après lui. » */
export function getWaitingForResponsable(report: NonEventExpenseReport): string | null {
    if (!waitsForResponsable(report)) return null;
    const noms = report.valideurs.map(nomComplet).join(' ou ');
    const role = report.valideurs.length > 1 ? 'responsables' : 'responsable';
    const commission = report.commission?.title ? deCommission(report.commission.title) : 'de commission';
    return `En attente de ${noms} (${role} ${commission}). Vous pourrez la valider après lui.`;
}

const ACTIONS_FAITES: Record<TreasuryAction, string> = {
    approved: 'Note approuvée.',
    rejected: 'Note refusée.',
    accounted: 'Note comptabilisée.',
};

/** Après une action réussie : la plateforme écrit au demandeur à chaque étape. */
export function getActionConfirmation(action: TreasuryAction, report: NonEventExpenseReport): string {
    return `${ACTIONS_FAITES[action]} ${nomComplet(report.utilisateur)} a été prévenu par mail.`;
}

/** Lien saisi par l'adhérent : seulement en http ou https, jamais javascript: ni data:. */
export function safeExternalUrl(url: string | null): string | null {
    if (!url) return null;
    try {
        const parsed = new URL(url.trim());
        return parsed.protocol === 'http:' || parsed.protocol === 'https:' ? parsed.href : null;
    } catch {
        return null;
    }
}

export type TreasuryAction = 'approved' | 'rejected' | 'accounted';

/** Encore chez le responsable de sa commission : la trésorerie n'a rien à décider. */
export function waitsForResponsable(report: NonEventExpenseReport): boolean {
    return report.status === ExpenseStatus.SUBMITTED && (report.valideurs ?? []).length > 0;
}

/** Ce que la trésorerie peut faire d'une note hors sortie, comme l'API le permet à un gestionnaire. */
export function getTreasuryActions(report: NonEventExpenseReport): TreasuryAction[] {
    switch (report.status) {
        case ExpenseStatus.PREAPPROVED:
            return ['approved', 'rejected'];
        case ExpenseStatus.SUBMITTED:
            return waitsForResponsable(report) ? [] : ['approved', 'rejected'];
        case ExpenseStatus.APPROVED:
            return ['accounted'];
        default:
            return [];
    }
}

interface StatusFilter {
    value: string;
    label: string;
    statuses: ExpenseStatus[];
}

const singleStatus = (status: ExpenseStatus): StatusFilter => ({
    value: status,
    label: getExpenseStatusTranslation(status),
    statuses: [status],
});

export const STATUS_FILTERS: StatusFilter[] = [
    { value: 'Toutes', label: 'Tous statuts', statuses: [] },
    // Le filtre par défaut garde sa valeur `submitted` : il regroupe tout ce qui attend la trésorerie.
    { value: ExpenseStatus.SUBMITTED, label: 'À valider', statuses: [ExpenseStatus.SUBMITTED, ExpenseStatus.PREAPPROVED] },
    singleStatus(ExpenseStatus.PREAPPROVED),
    singleStatus(ExpenseStatus.REJECTED),
    singleStatus(ExpenseStatus.APPROVED),
    singleStatus(ExpenseStatus.ACCOUNTED),
];

/** Statuts d'un choix du filtre ; aucun pour « Tous statuts ». */
export function statusesOfFilter(value: string): ExpenseStatus[] {
    return STATUS_FILTERS.find((filter) => filter.value === value)?.statuses ?? [];
}

export const REPORT_TYPE_FILTERS: { value: '' | ExpenseReportType; label: string }[] = [
    { value: '', label: 'Toutes' },
    { value: 'sortie', label: 'Sorties' },
    { value: 'formation', label: 'Formations' },
    { value: 'autre', label: 'Achats' },
];

/** La recherche et la date ne portent que sur les sorties : sans objet pour les formations et les achats. */
export function sortieFiltersApply(reportTypeFilter: string): boolean {
    return reportTypeFilter === '' || reportTypeFilter === 'sortie';
}

export interface ReportListFilters {
    page: number;
    status: string;
    searchTerm: string;
    requesterFilter: string;
    dateFilter: string;
    typeFilter: string;
    reportTypeFilter: string;
}

/** Paramètres de la liste pour l'API : seules les valeurs proposées par les filtres partent. */
export function buildReportListParams(filters: ReportListFilters): URLSearchParams {
    const params = new URLSearchParams();
    params.set('page', String(filters.page));
    // TODO: Envoyer itemsPerPage une fois les ApiFilter déployés sur le backend.
    // En attendant, on demande le max (30) pour que le filtrage client-side ait
    // assez de données pour afficher tous les résultats matchants sur une page.
    params.set('itemsPerPage', '30');

    const statuses = statusesOfFilter(filters.status);
    if (statuses.length === 1) {
        params.set('status', statuses[0]);
    } else {
        statuses.forEach((status) => params.append('status[]', status));
    }
    const reportType = REPORT_TYPE_FILTERS.some(({ value }) => value && value === filters.reportTypeFilter)
        ? filters.reportTypeFilter
        : '';
    const searchTerm = sortieFiltersApply(reportType) ? filters.searchTerm : '';
    const dateFilter = sortieFiltersApply(reportType) ? filters.dateFilter : '';
    if (searchTerm) {
        params.set('event.titre', searchTerm);
    }
    if (filters.requesterFilter) {
        params.set('user.lastname', filters.requesterFilter);
    }
    if (dateFilter) {
        params.set('event.startDate[after]', `${dateFilter}T00:00:00`);
        params.set('event.startDate[before]', `${dateFilter}T23:59:59`);
    }
    if (filters.typeFilter === 'don') {
        params.set('refundRequired', 'false');
    } else if (filters.typeFilter === 'remboursement') {
        params.set('refundRequired', 'true');
    }
    // L'API garde les notes hors sortie quand la recherche ou la date est active : elles
    // rempliraient les pages avant les sorties cherchées.
    const type = reportType || (searchTerm || dateFilter ? 'sortie' : '');
    if (type) {
        params.set('type', type);
    }
    return params;
}
