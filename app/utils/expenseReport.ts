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

// L'API d'avant les notes hors sortie ne donne pas `type` : une note sans type est une note de sortie.
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

export function formatReportDate(date: string | null, locale?: string): string {
    if (!date) return '';
    // Une date sans heure lue par new Date() tombe à minuit UTC : la veille à l'ouest de Greenwich.
    const day = DATE_ONLY.exec(date);
    const parsed = day ? new Date(Number(day[1]), Number(day[2]) - 1, Number(day[3])) : new Date(date);
    return Number.isNaN(parsed.getTime()) ? '' : parsed.toLocaleDateString(locale);
}

/**
 * Montant d'une note de sortie calculé par compta-club, comme toujours ; celui d'une note hors
 * sortie est le total déclaré, figé à l'envoi par la plateforme.
 */
export function getReportAmount(report: ExpenseReport): number {
    return isEventReport(report) ? calculateTotals(report.details).totalRemboursable : toAmount(report.totalDeclare);
}

/**
 * Sous le total déclaré d'une note hors sortie, quand les plafonds le réduisent : « dont 287.40 € remb. »,
 * ou « dont 287.40 € dans les plafonds » pour un don.
 */
export function getRefundableNote(report: ExpenseReport): string | null {
    if (isEventReport(report)) return null;
    const remboursable = toAmount(report.totalRemboursable);
    if (Math.round(remboursable * 100) >= Math.round(toAmount(report.totalDeclare) * 100)) return null;
    return `dont ${formatEuro(remboursable)} ${report.refundRequired ? 'remb.' : 'dans les plafonds'}`;
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
export const nomComplet = (auteur: Auteur) => [auteur.prenom, auteur.nom].filter(Boolean).join(' ');

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
    const quand = decision.date ? ` le ${formatDate(decision.date)}` : '';
    return `${DECISION_VERBES[decision.statut]}${signataire(decision)}${quand}`;
}

const validationDecision = (validation: ValidationResponsable): Decision =>
    ({ statut: 'preapproved', niveau: 'responsable', ...validation });

/**
 * Venue droit à la trésorerie : envoyée sans valideur, ou décidée par la trésorerie sans validation du
 * responsable (l'API ne la laisse décider d'une note envoyée que si elle n'a pas de valideur). Le
 * demandeur peut être lui-même le seul responsable de sa commission : rien ne dit qu'elle n'en a pas.
 */
export function venueDirectementALaTresorerie(report: NonEventExpenseReport): boolean {
    if (report.validationResponsable) return false;
    switch (report.status) {
        case ExpenseStatus.SUBMITTED:
            return !(report.valideurs ?? []).length;
        case ExpenseStatus.APPROVED:
        case ExpenseStatus.ACCOUNTED:
        case ExpenseStatus.REJECTED:
            return report.derniereDecision?.niveau === 'tresorerie';
        default:
            return false;
    }
}

/**
 * Sous l'objet d'une note hors sortie : « Escalade · Validée par Hugo BLANC le 27/01 », « Randonnée ·
 * Directement à la trésorerie », suivi de « renvoyée après un refus » une fois corrigée ; pour une note
 * refusée, qui l'a refusée : « Escalade · Refusée par la trésorerie le 29/01 ».
 */
export function getNonEventReportDetails(report: ExpenseReport): string | null {
    if (isEventReport(report)) return null;
    const details: (string | null | undefined)[] = [report.commission?.title];
    if (report.status === ExpenseStatus.REJECTED) {
        const decision = report.derniereDecision;
        details.push(decision?.statut === 'rejected' ? decisionPhrase(decision, jourMois) : null);
    } else {
        const validation = report.validationResponsable;
        details.push(validation
            ? decisionPhrase(validationDecision(validation), jourMois)
            : venueDirectementALaTresorerie(report) ? 'Directement à la trésorerie' : null);
        if (getLastRefusal(report)?.enCours === false) details.push('renvoyée après un refus');
    }
    return details.filter(Boolean).join(' · ') || null;
}

/**
 * « Validée par Hugo BLANC le 27/01/2025 », ou « Aucune : la note va (est allée) directement à la
 * trésorerie. » ; rien pour une note encore chez son responsable, ou refusée par lui.
 */
export function getValidationResponsable(report: NonEventExpenseReport): string | null {
    if (report.validationResponsable) return decisionPhrase(validationDecision(report.validationResponsable));
    if (!venueDirectementALaTresorerie(report)) return null;
    return report.status === ExpenseStatus.SUBMITTED
        ? 'Aucune : la note va directement à la trésorerie.'
        : 'Aucune : la note est allée directement à la trésorerie.';
}

/** Le PDF d'une note, de sortie ou non, une fois approuvée par la trésorerie. */
export function canDownloadPdf(report: ExpenseReport): boolean {
    return report.status === ExpenseStatus.APPROVED || report.status === ExpenseStatus.ACCOUNTED;
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
    // Sans date, le refus précède quand même le renvoi : c'est la dernière décision, et la note n'est plus refusée.
    if (decision && report.dateEnvoi && (!decision.date || new Date(report.dateEnvoi) > new Date(decision.date))) {
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

const PAIEMENT_A_FAIRE: ExpenseStatus[] = [ExpenseStatus.SUBMITTED, ExpenseStatus.PREAPPROVED, ExpenseStatus.APPROVED];

function amountLabel(report: NonEventExpenseReport): string {
    if (report.refundRequired === null) return 'Montant';
    if (!report.refundRequired) return 'Don';
    // Le PDF d'une note comptabilisée s'archive : « À rembourser » y ferait croire à une dette.
    return PAIEMENT_A_FAIRE.includes(report.status) ? 'À rembourser' : 'Remboursement';
}

/**
 * En tête de la page et du PDF : « À rembourser : 287.40 € » tant que le paiement reste à faire,
 * « Remboursement : … » ensuite (ou sur une note refusée, en brouillon), « Don : … » pour un don,
 * « Montant : … » pour un brouillon où le demandeur n'a pas encore choisi entre les deux ; et
 * « 312.40 € déclarés, dont 25.00 € au-delà des plafonds du club » quand les plafonds le réduisent.
 */
export function getAmountSummary(report: NonEventExpenseReport): { titre: string; detail: string | null } {
    const remboursable = Math.round(toAmount(report.totalRemboursable) * 100);
    const declare = Math.round(toAmount(report.totalDeclare) * 100);
    return {
        titre: `${amountLabel(report)} : ${formatEuro(remboursable / 100)}`,
        detail: remboursable < declare
            ? `${formatEuro(declare / 100)} déclarés, dont ${formatEuro((declare - remboursable) / 100)} au-delà des plafonds du club`
            : null,
    };
}

export interface TotalLine {
    libelle: string;
    montant: number;
    // La ligne en gras : le montant qui compte.
    principal: boolean;
}

/**
 * Pied du tableau des dépenses, sur la page comme dans le PDF : « Total » quand les plafonds n'ont rien
 * retenu ; sinon « Total déclaré », puis « Total remboursable » (« Total dans les plafonds du club » pour un don).
 */
export function getTotalLines(report: NonEventExpenseReport): TotalLine[] {
    const remboursable = toAmount(report.totalRemboursable);
    const declare = toAmount(report.totalDeclare);
    if (Math.round(remboursable * 100) >= Math.round(declare * 100)) {
        return [{ libelle: 'Total', montant: remboursable, principal: true }];
    }
    return [
        { libelle: 'Total déclaré', montant: declare, principal: false },
        { libelle: report.refundRequired ? 'Total remboursable' : 'Total dans les plafonds du club', montant: remboursable, principal: true },
    ];
}

const deCommission = (title: string) => (/^[aeiouyàâäéèêëîïôöûü]/i.test(title) ? `d'${title}` : `de ${title}`);

/** « En attente de Hugo BLANC (responsable d'Escalade). Vous pourrez l'approuver après lui. » */
export function getWaitingForResponsable(report: NonEventExpenseReport): string | null {
    if (!waitsForResponsable(report)) return null;
    const noms = report.valideurs.map(nomComplet).join(' ou ');
    const plusieurs = report.valideurs.length > 1;
    const commission = report.commission?.title ? deCommission(report.commission.title) : 'de commission';
    return `En attente de ${noms} (${plusieurs ? 'responsables' : 'responsable'} ${commission}). `
        + `Vous pourrez l'approuver après ${plusieurs ? 'eux' : 'lui'}.`;
}

/** Ce que la confirmation d'une décision rappelle de la note. */
export interface DecisionSummary {
    demandeur: string;
    // « À rembourser : 287.40 € » ou « Don : 42.00 € »
    montant: string;
    // Une note validée par son responsable lui revient après un refus : il en lira aussi le message.
    luParLeResponsable: boolean;
}

export function getDecisionSummary(report: ExpenseReport): DecisionSummary {
    const demandeur = nomComplet(report.utilisateur);
    if (isEventReport(report)) {
        const montant = formatEuro(calculateTotals(report.details).totalRemboursable);
        return { demandeur, montant: `${report.refundRequired ? 'À rembourser' : 'Don'} : ${montant}`, luParLeResponsable: false };
    }
    return { demandeur, montant: getAmountSummary(report).titre, luParLeResponsable: Boolean(report.validationResponsable) };
}

const ACTIONS_FAITES: Record<TreasuryAction, string> = {
    approved: 'Note approuvée.',
    rejected: 'Note refusée.',
    accounted: 'Note comptabilisée.',
};

/** Après une action réussie : la plateforme écrit au demandeur à chaque étape. */
export function getActionConfirmation(action: TreasuryAction, report: NonEventExpenseReport): string {
    return `${ACTIONS_FAITES[action]} Un mail a été envoyé à ${nomComplet(report.utilisateur)}.`;
}

const STATUTS_DE_LA_NOTE: Record<string, string> = {
    [ExpenseStatus.DRAFT]: 'en brouillon',
    [ExpenseStatus.SUBMITTED]: 'soumise',
    [ExpenseStatus.PREAPPROVED]: 'validée par le responsable',
    [ExpenseStatus.APPROVED]: 'approuvée',
    [ExpenseStatus.REJECTED]: 'refusée',
    [ExpenseStatus.ACCOUNTED]: 'comptabilisée',
};

/** Le statut dans une phrase, accordé à « la note » : « Elle est maintenant : comptabilisée. » */
export function noteStatusPhrase(status: string): string {
    return STATUTS_DE_LA_NOTE[status] ?? status;
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
