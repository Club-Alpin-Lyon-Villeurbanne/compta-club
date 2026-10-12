import { describe, it, expect } from 'vitest';
import { ExpenseReport, NonEventExpenseReport } from '@/app/interfaces/noteDeFraisInterface';
import { ExpenseStatus, getExpenseStatusColor, getExpenseStatusTranslation } from '@/app/enums/ExpenseStatus';
import {
  buildReportListParams,
  formatReportDate,
  getLastRefusal,
  getNonEventReportDetails,
  getRefundableNote,
  getReportAmount,
  getReportCommission,
  getReportDate,
  getReportHref,
  getReportSubmissionDate,
  getReportTitle,
  getReportType,
  getReportTypeLabel,
  getTreasuryActions,
  getValidationResponsable,
  isEventReport,
  REPORT_TYPE_FILTERS,
  safeExternalUrl,
  sortieFiltersApply,
  STATUS_FILTERS,
  statusesOfFilter,
  waitsForResponsable,
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
    expect(getReportAmount(formation)).toBe(312.4);
    expect(getReportAmount(achat)).toBe(55);
  });
});

describe('getRefundableNote', () => {
  it('gives the refundable amount of a note hors sortie when the caps lower it', () => {
    expect(getRefundableNote(formation)).toBe('dont 287.40 € remb.');
  });

  it('says nothing when everything is refundable, nor for a note de sortie', () => {
    expect(getRefundableNote(achat)).toBeNull();
    expect(getRefundableNote({ ...formation, totalRemboursable: 312.4 } as ExpenseReport)).toBeNull();
    expect(getRefundableNote(noteDeSortie)).toBeNull();
  });
});

describe('getReportSubmissionDate', () => {
  it('takes the last sending of a note hors sortie', () => {
    expect(getReportSubmissionDate(achat)).toBe('2025-01-23T09:05:00+01:00');
  });

  it('falls back on the creation date, and keeps it for a note de sortie', () => {
    expect(getReportSubmissionDate({ ...achat, dateEnvoi: null } as ExpenseReport)).toBe('2025-01-21T09:00:00');
    expect(getReportSubmissionDate(noteDeSortie)).toBe('2025-01-10T10:00:00');
  });
});

describe('getNonEventReportDetails', () => {
  it('names the commission and who validated the note', () => {
    expect(getNonEventReportDetails(formation)).toBe('Escalade · Validée par Hugo BLANC le 27/01');
  });

  it('says that a submitted note has no responsable to validate it', () => {
    expect(getNonEventReportDetails(achat)).toBe('Randonnée · Sans responsable de commission');
  });

  it('only names the commission of a note decided without validation by a responsable', () => {
    const approuvee = mockNotesHorsSortie.find((note) => note.id === 204) as unknown as ExpenseReport;

    expect(getNonEventReportDetails(approuvee)).toBe('Randonnée');
  });

  it('says nothing for a note de sortie', () => {
    expect(getNonEventReportDetails(noteDeSortie)).toBeNull();
  });
});

const noteHorsSortie = (id: number, changes: Partial<NonEventExpenseReport> = {}) =>
  ({ ...mockNotesHorsSortie.find((note) => note.id === id), ...changes }) as unknown as NonEventExpenseReport;

describe('getReportHref', () => {
  it('leads a note de sortie to its sortie, a note hors sortie to its own page', () => {
    expect(getReportHref(noteDeSortie)).toBe('/note-de-frais/101');
    expect(getReportHref(formation)).toBe('/note-de-frais/note/202');
    expect(getReportHref(achat)).toBe('/note-de-frais/note/201');
  });

  it('leads nowhere for a note de sortie without its sortie', () => {
    expect(getReportHref({ ...noteDeSortie, sortie: null } as unknown as ExpenseReport)).toBeNull();
  });
});

describe('getValidationResponsable', () => {
  it('says who validated the note and when', () => {
    expect(getValidationResponsable(noteHorsSortie(202))).toBe('Validée par Hugo BLANC le 27/01/2025');
  });

  it('says nothing when no responsable validated it', () => {
    expect(getValidationResponsable(noteHorsSortie(201))).toBeNull();
  });
});

describe('getLastRefusal', () => {
  it('gives who refused the note, when, and the message', () => {
    expect(getLastRefusal(noteHorsSortie(205))).toEqual({
      intitule: 'Refusée par Claire FONTAINE le 29/01/2025',
      message: 'Il manque la facture.',
    });
  });

  it('falls back on the comment of the status without a decision to read', () => {
    expect(getLastRefusal(noteHorsSortie(205, { derniereDecision: null }))).toEqual({
      intitule: 'Refusée',
      message: 'Il manque la facture.',
    });
  });

  it('gives nothing for a note that is not refused', () => {
    expect(getLastRefusal(noteHorsSortie(202))).toBeNull();
    expect(getLastRefusal(noteHorsSortie(201))).toBeNull();
  });
});

describe('safeExternalUrl', () => {
  it('keeps a link in http or https', () => {
    expect(safeExternalUrl('https://example.com/formation?id=3')).toBe('https://example.com/formation?id=3');
    expect(safeExternalUrl(' http://example.com/stage ')).toBe('http://example.com/stage');
  });

  it.each(['javascript:alert(1)', 'JAVASCRIPT:alert(1)', 'data:text/html,<script>alert(1)</script>', 'file:///etc/passwd', '//example.com', 'example.com', 'pas un lien', ''])(
    'drops "%s"',
    (url) => {
      expect(safeExternalUrl(url)).toBeNull();
    }
  );

  it('drops a missing link', () => {
    expect(safeExternalUrl(null)).toBeNull();
  });
});

describe('treasury actions on a note hors sortie', () => {
  it('approves or rejects a note validated by the responsable', () => {
    expect(getTreasuryActions(noteHorsSortie(202))).toEqual(['approved', 'rejected']);
  });

  it('approves or rejects a submitted note that has no responsable to validate it', () => {
    expect(getTreasuryActions(noteHorsSortie(201))).toEqual(['approved', 'rejected']);
    expect(waitsForResponsable(noteHorsSortie(201))).toBe(false);
  });

  it('leaves a note waiting for its responsable alone', () => {
    expect(getTreasuryActions(noteHorsSortie(206))).toEqual([]);
    expect(waitsForResponsable(noteHorsSortie(206))).toBe(true);
  });

  it('accounts for an approved note', () => {
    expect(getTreasuryActions(noteHorsSortie(204))).toEqual(['accounted']);
  });

  it('offers nothing on a rejected or accounted note', () => {
    expect(getTreasuryActions(noteHorsSortie(205))).toEqual([]);
    expect(getTreasuryActions(noteHorsSortie(208))).toEqual([]);
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

describe('search and date', () => {
  it('apply to the sorties: off for formations and achats', () => {
    expect(sortieFiltersApply('')).toBe(true);
    expect(sortieFiltersApply('sortie')).toBe(true);
    expect(sortieFiltersApply('formation')).toBe(false);
    expect(sortieFiltersApply('autre')).toBe(false);
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

  it('asks for the sorties only while searching or filtering by date', () => {
    const search = buildReportListParams({ ...defaults, searchTerm: 'canyon' });
    expect(search.get('event.titre')).toBe('canyon');
    expect(search.get('type')).toBe('sortie');

    expect(buildReportListParams({ ...defaults, dateFilter: '2025-01-15' }).get('type')).toBe('sortie');
    expect(buildReportListParams({ ...defaults, searchTerm: 'canyon', reportTypeFilter: 'sortie' }).getAll('type')).toEqual(['sortie']);
  });

  it('sends neither search nor date for formations and achats', () => {
    const params = buildReportListParams({ ...defaults, searchTerm: 'canyon', dateFilter: '2025-01-15', reportTypeFilter: 'autre' });

    expect(params.get('type')).toBe('autre');
    expect(params.has('event.titre')).toBe(false);
    expect(params.has('event.startDate[after]')).toBe(false);
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
