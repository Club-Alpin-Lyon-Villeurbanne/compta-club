import { describe, it, expect } from 'vitest';
import { ExpenseReport } from '@/app/interfaces/noteDeFraisInterface';
import { ExpenseStatus, getExpenseStatusColor, getExpenseStatusTranslation } from '@/app/enums/ExpenseStatus';
import {
  buildReportListParams,
  formatReportDate,
  getReportAmount,
  getReportCommission,
  getReportDate,
  getReportTitle,
  getReportType,
  getReportTypeLabel,
  isEventReport,
  REPORT_TYPE_FILTERS,
  STATUS_FILTERS,
  statusesOfFilter,
} from '@/app/utils/expenseReport';
import { mockExpenseReports, mockNotesHorsSortie } from '@/tests/mocks/fixtures';

const noteDeSortie = mockExpenseReports[0] as unknown as ExpenseReport;
const formation = mockNotesHorsSortie.find((note) => note.id === 202) as unknown as ExpenseReport;
const achat = mockNotesHorsSortie.find((note) => note.id === 201) as unknown as ExpenseReport;

describe('note type', () => {
  it('reads the type given by the API', () => {
    expect(getReportType(formation)).toBe('formation');
    expect(getReportType(achat)).toBe('autre');
    expect(getReportType({ ...noteDeSortie, type: 'sortie' } as ExpenseReport)).toBe('sortie');
  });

  it('takes a note without type for a note de sortie (API before the notes hors sortie)', () => {
    expect(getReportType(noteDeSortie)).toBe('sortie');
    expect(isEventReport(noteDeSortie)).toBe(true);
    expect(isEventReport(formation)).toBe(false);
  });

  it('names a note autre an achat', () => {
    expect(getReportTypeLabel(noteDeSortie)).toBe('Sortie');
    expect(getReportTypeLabel(formation)).toBe('Formation');
    expect(getReportTypeLabel(achat)).toBe('Achat');
  });
});

describe('displayed values', () => {
  it('takes the title, commission and date of the sortie for a note de sortie', () => {
    expect(getReportTitle(noteDeSortie)).toBe('Sortie Mont Blanc');
    expect(getReportCommission(noteDeSortie)?.title).toBe('Alpinisme');
    expect(getReportDate(noteDeSortie)).toBe('2025-01-15T08:00:00');
  });

  it('takes the objet, commission and expense date of a note hors sortie', () => {
    expect(getReportTitle(formation)).toBe('Formation initiateur escalade');
    expect(getReportCommission(formation)?.title).toBe('Escalade');
    expect(getReportDate(formation)).toBe('2025-01-25');
  });

  it('does not fail on a note de sortie whose sortie is missing', () => {
    const sansSortie = { ...noteDeSortie, sortie: null } as unknown as ExpenseReport;

    expect(getReportTitle(sansSortie)).toBe('');
    expect(getReportCommission(sansSortie)).toBeNull();
    expect(getReportDate(sansSortie)).toBeNull();
  });
});

describe('getReportAmount', () => {
  it('keeps the refundable amount computed by compta-club for a note de sortie', () => {
    // 150 km × 0,20 + 15 € de péage / 3 + nuitée plafonnée à 60 € + 25 €
    expect(getReportAmount(noteDeSortie)).toBe(120);
  });

  it('ignores the amounts of the platform for a note de sortie', () => {
    const withServerTotals = { ...noteDeSortie, totalDeclare: 999, totalRemboursable: 999 } as unknown as ExpenseReport;

    expect(getReportAmount(withServerTotals)).toBe(120);
  });

  it('takes the declared amount fixed by the platform for a note hors sortie', () => {
    expect(getReportAmount(formation)).toBe(245.6);
    expect(getReportAmount(achat)).toBe(55);
  });
});

describe('formatReportDate', () => {
  it('formats the date of a sortie', () => {
    expect(formatReportDate('2025-01-15T08:00:00+01:00')).toBe(new Date('2025-01-15T08:00:00+01:00').toLocaleDateString());
  });

  it('keeps the day of an expense date west of Greenwich', () => {
    const timeZone = process.env.TZ;
    process.env.TZ = 'America/Los_Angeles';
    try {
      expect(formatReportDate('2025-01-25')).toBe(new Date(2025, 0, 25).toLocaleDateString());
    } finally {
      process.env.TZ = timeZone;
    }
  });

  it('returns nothing for a missing or unreadable date', () => {
    expect(formatReportDate(null)).toBe('');
    expect(formatReportDate('pas une date')).toBe('');
  });
});

describe('status preapproved', () => {
  it('is labelled and coloured', () => {
    expect(getExpenseStatusTranslation(ExpenseStatus.PREAPPROVED)).toBe('Validée par le responsable');
    expect(getExpenseStatusColor(ExpenseStatus.PREAPPROVED)).toBe('teal');
  });
});

describe('status filter', () => {
  it('offers « À valider » by default, for everything that waits for the treasury', () => {
    const aValider = STATUS_FILTERS.find((filter) => filter.label === 'À valider');

    expect(aValider?.value).toBe('submitted');
    expect(statusesOfFilter('submitted')).toEqual([ExpenseStatus.SUBMITTED, ExpenseStatus.PREAPPROVED]);
  });

  it('keeps one status per other choice, and none for « Tous statuts »', () => {
    expect(STATUS_FILTERS.map(({ value, label }) => [value, label])).toEqual([
      ['Toutes', 'Tous statuts'],
      ['submitted', 'À valider'],
      ['preapproved', 'Validée par le responsable'],
      ['rejected', 'Rejeté'],
      ['approved', 'Approuvé'],
      ['accounted', 'Comptabilisé'],
    ]);
    expect(statusesOfFilter('approved')).toEqual([ExpenseStatus.APPROVED]);
    expect(statusesOfFilter('Toutes')).toEqual([]);
  });
});

describe('type filter', () => {
  it('offers all notes, sorties, formations and achats', () => {
    expect(REPORT_TYPE_FILTERS).toEqual([
      { value: '', label: 'Toutes' },
      { value: 'sortie', label: 'Sorties' },
      { value: 'formation', label: 'Formations' },
      { value: 'autre', label: 'Achats' },
    ]);
  });
});

describe('buildReportListParams', () => {
  const defaults = {
    page: 1,
    status: 'submitted',
    searchTerm: '',
    requesterFilter: '',
    dateFilter: '',
    typeFilter: '',
    reportTypeFilter: '',
  };

  it('asks for submitted and preapproved notes by default', () => {
    const params = buildReportListParams(defaults);

    expect(params.toString()).toBe('page=1&itemsPerPage=30&status%5B%5D=submitted&status%5B%5D=preapproved');
  });

  it('sends a single status as before', () => {
    const params = buildReportListParams({ ...defaults, status: 'approved' });

    expect(params.get('status')).toBe('approved');
    expect(params.has('status[]')).toBe(false);
  });

  it('sends no status for « Tous statuts » nor for an unknown choice', () => {
    for (const status of ['Toutes', 'draft', "submitted' OR 1=1"]) {
      const params = buildReportListParams({ ...defaults, status });
      expect(params.has('status')).toBe(false);
      expect(params.has('status[]')).toBe(false);
    }
  });

  it('sends the type of note', () => {
    expect(buildReportListParams({ ...defaults, reportTypeFilter: 'formation' }).get('type')).toBe('formation');
    expect(buildReportListParams({ ...defaults, reportTypeFilter: 'autre' }).get('type')).toBe('autre');
    expect(buildReportListParams({ ...defaults, reportTypeFilter: 'sortie' }).get('type')).toBe('sortie');
    expect(buildReportListParams(defaults).has('type')).toBe(false);
  });

  it('sends no type outside of the offered choices', () => {
    expect(buildReportListParams({ ...defaults, reportTypeFilter: 'draft' }).has('type')).toBe(false);
  });

  it('keeps the other filters unchanged', () => {
    const params = buildReportListParams({
      ...defaults,
      page: 2,
      searchTerm: 'canyon',
      requesterFilter: 'Dupont',
      dateFilter: '2025-01-15',
      typeFilter: 'don',
    });

    expect(params.get('page')).toBe('2');
    expect(params.get('event.titre')).toBe('canyon');
    expect(params.get('user.lastname')).toBe('Dupont');
    expect(params.get('event.startDate[after]')).toBe('2025-01-15T00:00:00');
    expect(params.get('event.startDate[before]')).toBe('2025-01-15T23:59:59');
    expect(params.get('refundRequired')).toBe('false');
    expect(buildReportListParams({ ...defaults, typeFilter: 'remboursement' }).get('refundRequired')).toBe('true');
  });
});
