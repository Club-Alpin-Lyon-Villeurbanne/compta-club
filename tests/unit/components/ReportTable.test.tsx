import { describe, it, expect, beforeEach } from 'vitest';
import { act, render, screen, within } from '@testing-library/react';
import ReportTable from '@/app/components/note-de-frais/ReportTable';
import useStore from '@/app/store/useStore';
import { ExpenseReport } from '@/app/interfaces/noteDeFraisInterface';
import { mockExpenseReports, mockNotesHorsSortie } from '@/tests/mocks/fixtures';

// Ce que la liste de l'API envoie : ni le brouillon, ni la note encore chez le responsable.
const notesHorsSortie = mockNotesHorsSortie.filter(
  (note) => note.status !== 'draft' && !(note.status === 'submitted' && note.valideurs.length > 0)
);
const reports = [...mockExpenseReports, ...notesHorsSortie] as unknown as ExpenseReport[];

const rowOf = (text: string) => screen.getByText(text).closest('tr') as HTMLElement;

describe('ReportTable', () => {
  beforeEach(() => {
    act(() => useStore.getState().resetFilters());
  });

  it('lists notes de sortie and notes hors sortie waiting for the treasury', () => {
    render(<ReportTable reports={reports} isLoading={false} />);

    const titles = screen.getAllByRole('row').slice(1).map((row) => within(row).getAllByRole('cell')[2].textContent);
    expect(titles).toEqual([
      'Sortie Mont Blanc',
      'Canyon Ardeche',
      'Cordelettes pour la SAE',
      'Formation initiateur escalade',
      "Sac <b>30 L</b> & cordelette d'attache",
    ]);
  });

  it('shows the type, expense date and declared amount of a note hors sortie, without link', () => {
    render(<ReportTable reports={reports} isLoading={false} />);

    const formation = rowOf('Formation initiateur escalade');
    expect(within(formation).getByText('Formation')).toBeTruthy();
    expect(within(formation).getByText('245.60 €')).toBeTruthy();
    expect(within(formation).getByText('Validée par le responsable')).toBeTruthy();
    expect(within(formation).getByText(new Date(2025, 0, 25).toLocaleDateString())).toBeTruthy();
    expect(within(formation).queryByRole('link')).toBeNull();

    const sortie = rowOf('Sortie Mont Blanc');
    expect(within(sortie).getByText('Sortie')).toBeTruthy();
    expect(within(sortie).getByText('120.00 €')).toBeTruthy();
    expect(within(sortie).getAllByRole('link')[0].getAttribute('href')).toBe('/note-de-frais/101');
  });

  it('filters by type of note', () => {
    act(() => useStore.getState().setReportTypeFilter('autre'));
    render(<ReportTable reports={reports} isLoading={false} />);

    expect(screen.queryByText('Sortie Mont Blanc')).toBeNull();
    expect(screen.queryByText('Formation initiateur escalade')).toBeNull();
    expect(rowOf('Cordelettes pour la SAE')).toBeTruthy();
  });

  it('offers the PDF of an approved note de sortie only', () => {
    act(() => useStore.getState().setStatus('approved'));
    render(<ReportTable reports={reports} isLoading={false} />);

    expect(within(rowOf('Randonnee Vercors')).queryByTitle('Télécharger en PDF')).not.toBeNull();
    expect(within(rowOf('Recyclage initiateur randonnée')).queryByTitle('Télécharger en PDF')).toBeNull();
  });
});
