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
// Titre de chaque ligne, sans la ligne grise qui le suit
const titles = () => screen.getAllByRole('row').slice(1).map((row) => within(row).getAllByRole('cell')[2].querySelector('p')?.textContent);

describe('ReportTable', () => {
  beforeEach(() => {
    act(() => useStore.getState().resetFilters());
  });

  it('lists notes de sortie and notes hors sortie waiting for the treasury', () => {
    render(<ReportTable reports={reports} isLoading={false} />);

    expect(titles()).toEqual([
      'Sortie Mont Blanc',
      'Canyon Ardeche',
      'Cordelettes pour la SAE',
      'Formation initiateur escalade',
      "Sac <b>30 L</b> & cordelette d'attache",
    ]);
  });

  it('shows the type, expense date and declared amount of a note hors sortie, linked to its page', () => {
    render(<ReportTable reports={reports} isLoading={false} />);

    const formation = rowOf('Formation initiateur escalade');
    expect(within(formation).getByText('Formation')).toBeTruthy();
    expect(within(formation).getByText('312.40 €')).toBeTruthy();
    expect(within(formation).getByText('dont 287.40 € remb.')).toBeTruthy();
    expect(within(formation).getByText('Escalade · Validée par Hugo BLANC le 27/01')).toBeTruthy();
    expect(within(formation).getByText('Validée par le responsable')).toBeTruthy();
    expect(within(formation).getByText(new Date(2025, 0, 25).toLocaleDateString())).toBeTruthy();
    expect(within(formation).getAllByRole('link').map((link) => link.getAttribute('href'))).toEqual([
      '/note-de-frais/note/202',
      '/note-de-frais/note/202',
    ]);

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

  it('keeps the sorties only while searching', () => {
    act(() => useStore.getState().setSearchTerm('mont'));
    render(<ReportTable reports={reports} isLoading={false} />);

    expect(titles()).toEqual(['Sortie Mont Blanc']);
  });

  it('offers the PDF of an approved note, de sortie or not', () => {
    act(() => useStore.getState().setStatus('approved'));
    render(<ReportTable reports={reports} isLoading={false} />);

    expect(within(rowOf('Randonnee Vercors')).queryByTitle('Télécharger en PDF')).not.toBeNull();
    expect(within(rowOf('Recyclage initiateur randonnée')).queryByTitle('Télécharger en PDF')).not.toBeNull();
  });

  it('offers no PDF before the treasury approves a note hors sortie', () => {
    render(<ReportTable reports={reports} isLoading={false} />);

    expect(within(rowOf('Formation initiateur escalade')).queryByTitle('Télécharger en PDF')).toBeNull();
    expect(within(rowOf('Cordelettes pour la SAE')).queryByTitle('Télécharger en PDF')).toBeNull();
  });
});
