import { describe, it, expect, vi } from 'vitest';
import { fireEvent, render, screen, within } from '@testing-library/react';
import NoteHorsSortieDetail from '@/app/components/note-de-frais/NoteHorsSortieDetail';
import { NonEventExpenseReport } from '@/app/interfaces/noteDeFraisInterface';
import { mockNotesHorsSortie } from '@/tests/mocks/fixtures';

const noteHorsSortie = (id: number, changes: Partial<NonEventExpenseReport> = {}) =>
  ({ ...mockNotesHorsSortie.find((note) => note.id === id), ...changes }) as unknown as NonEventExpenseReport;

// Valeur affichée sous un intitulé de la fiche
const field = (label: string) => screen.getByText(label, { selector: 'dt' }).nextElementSibling as HTMLElement;
const lineOf = (libelle: string) => screen.getByText(libelle, { selector: 'td' }).closest('tr') as HTMLElement;
const buttons = () => screen.queryAllByRole('button').map((button) => button.textContent?.trim()).filter(Boolean);

describe('NoteHorsSortieDetail', () => {
  it('shows everything the treasury needs about a formation', () => {
    render(<NoteHorsSortieDetail note={noteHorsSortie(202)} onAction={vi.fn()} />);

    expect(screen.getByRole('heading', { level: 1 }).textContent).toBe('Formation initiateur escalade');
    expect(field('Demandeur').textContent).toBe('Thomas Petit');
    expect(field('Type').textContent).toBe('Formation');
    expect(field('Commission').textContent).toBe('Escalade');
    expect(field('Objet').textContent).toBe('Formation initiateur escalade');
    expect(field('Date de la dépense').textContent).toBe(new Date(2025, 0, 25).toLocaleDateString());
    expect(field('Mot pour le responsable').textContent).toBe('Stage validé par la commission en décembre.');
    expect(field('Validation du responsable').textContent).toBe('Validée par Hugo BLANC le 27/01/2025');
    expect(field('Don ou remboursement').textContent).toBe('Remboursement');
    expect(field('Libellé comptable').textContent).toBe('PETIT Thomas NDF 25/01/2025 Formation initiateur escalade');
    expect(screen.getByText('Validée par le responsable')).toBeTruthy();

    const lien = within(field('Lien de la formation')).getByRole('link');
    expect(lien.getAttribute('href')).toBe('https://example.com/formation-initiateur-escalade');
    expect(lien.getAttribute('target')).toBe('_blank');
    expect(lien.getAttribute('rel')).toBe('noopener noreferrer');

    expect(screen.getByText('Le stage dépasse le plafond de la commission : le remboursable est réduit.')).toBeTruthy();
    expect(screen.queryByLabelText('Dernier refus')).toBeNull();
  });

  it('shows each line as the API presents it, with its receipt', () => {
    render(<NoteHorsSortieDetail note={noteHorsSortie(202)} onAction={vi.fn()} />);

    const stage = lineOf('Stage');
    expect(within(stage).getByText('250.00 €')).toBeTruthy();
    expect(within(stage).getByRole('link').getAttribute('href')).toBe('https://example.com/facture-stage.pdf');

    const voiture = lineOf('Voiture');
    expect(within(voiture).getByText('240 km × 0,26 €')).toBeTruthy();
    expect(within(voiture).getByText('62.40 €')).toBeTruthy();
    expect(within(voiture).queryByRole('link')).toBeNull();

    expect(within(screen.getByText('Total déclaré').closest('tr')!).getByText('312.40 €')).toBeTruthy();
    expect(within(screen.getByText('Total remboursable').closest('tr')!).getByText('287.40 €')).toBeTruthy();
  });

  it('shows an achat given as a don, its text as is, without validation by a responsable', () => {
    render(<NoteHorsSortieDetail note={noteHorsSortie(203)} onAction={vi.fn()} />);

    expect(field('Type').textContent).toBe('Achat');
    expect(field('Objet').textContent).toBe("Sac <b>30 L</b> & cordelette d'attache");
    expect(document.querySelector('b')).toBeNull();
    expect(field('Don ou remboursement').textContent).toBe('Don');
    expect(screen.queryByText('Lien de la formation')).toBeNull();
    expect(screen.queryByText('Mot pour le responsable')).toBeNull();
  });

  it('says nothing of a validation when no responsable had to validate the note', () => {
    render(<NoteHorsSortieDetail note={noteHorsSortie(201)} onAction={vi.fn()} />);

    expect(screen.queryByText('Validation du responsable')).toBeNull();
    expect(screen.queryByLabelText('Avertissements')).toBeNull();
  });

  it('shows the last refusal and its message', () => {
    render(<NoteHorsSortieDetail note={noteHorsSortie(205)} onAction={vi.fn()} />);

    const refusal = screen.getByLabelText('Dernier refus');
    expect(within(refusal).getByText('Refusée par Claire FONTAINE le 29/01/2025')).toBeTruthy();
    expect(within(refusal).getByText('Il manque la facture.')).toBeTruthy();
  });

  it('does not link a formation link that is not http or https', () => {
    render(<NoteHorsSortieDetail note={noteHorsSortie(202, { lienFormation: 'javascript:alert(1)' })} onAction={vi.fn()} />);

    expect(field('Lien de la formation').textContent).toBe('javascript:alert(1)');
    expect(within(field('Lien de la formation')).queryByRole('link')).toBeNull();
  });

  it.each([
    [202, ['Approuver', 'Rejeter']],
    [201, ['Approuver', 'Rejeter']],
    [204, ['Comptabiliser']],
    [205, []],
    [208, []],
    [206, []],
  ])('offers the actions allowed on note %i', (id, expected) => {
    render(<NoteHorsSortieDetail note={noteHorsSortie(id)} onAction={vi.fn()} />);

    expect(buttons()).toEqual(expected);
  });

  it('says that a note still waits for its responsable', () => {
    render(<NoteHorsSortieDetail note={noteHorsSortie(206)} onAction={vi.fn()} />);

    expect(screen.getByText('En attente de la validation du responsable de commission.')).toBeTruthy();
  });

  it('hands the chosen action over', () => {
    const onAction = vi.fn();
    render(<NoteHorsSortieDetail note={noteHorsSortie(202)} onAction={onAction} />);

    fireEvent.click(screen.getByRole('button', { name: 'Rejeter' }));

    expect(onAction).toHaveBeenCalledWith(202, 'rejected');
  });
});
