import {
    Commission,
    EventExpenseReport,
    ExpenseReport,
    ExpenseReportType,
} from '@/app/interfaces/noteDeFraisInterface';
import { ExpenseStatus, getExpenseStatusTranslation } from '@/app/enums/ExpenseStatus';
import { calculateTotals, toAmount } from '@/app/utils/helper';

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
    if (filters.searchTerm) {
        params.set('event.titre', filters.searchTerm);
    }
    if (filters.requesterFilter) {
        params.set('user.lastname', filters.requesterFilter);
    }
    if (filters.dateFilter) {
        params.set('event.startDate[after]', `${filters.dateFilter}T00:00:00`);
        params.set('event.startDate[before]', `${filters.dateFilter}T23:59:59`);
    }
    if (filters.typeFilter === 'don') {
        params.set('refundRequired', 'false');
    } else if (filters.typeFilter === 'remboursement') {
        params.set('refundRequired', 'true');
    }
    if (REPORT_TYPE_FILTERS.some(({ value }) => value && value === filters.reportTypeFilter)) {
        params.set('type', filters.reportTypeFilter);
    }
    return params;
}
