import { describe, it, expect, vi } from 'vitest';
import { act, fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import NoteHorsSortieDetail from '@/app/components/note-de-frais/NoteHorsSortieDetail';
import { NonEventExpenseReport } from '@/app/interfaces/noteDeFraisInterface';
import { generateNoteHorsSortiePDF } from '@/app/utils/noteHorsSortiePdf';
import { mockNotesHorsSortie } from '@/tests/mocks/fixtures';

vi.mock('@/app/utils/noteHorsSortiePdf', () => ({ generateNoteHorsSortiePDF: vi.fn() }));

const noteHorsSortie = (id: number, changes: Partial<NonEventExpenseReport> = {}) =>
  ({ ...mockNotesHorsSortie.find((note) => note.id === id), ...changes }) as unknown as NonEventExpenseReport;

// Valeur affichée sous un intitulé de la fiche
const field = (label: string) => screen.getByText(label, { selector: 'dt' }).nextElementSibling as HTMLElement;
const lineOf = (libelle: string) => screen.getByText(libelle, { selector: 'td' }).closest('tr') as HTMLElement;
const summary = () => screen.getByRole('region', { name: 'Synthèse' });
const actionButtons = () =>
  screen.queryAllByRole('button').filter(
    (button) => !button.getAttribute('aria-label')?.startsWith('Copier') && button.textContent !== 'Télécharger en PDF'
  );
const pdfButton = () => screen.queryByRole('button', { name: 'Télécharger en PDF' });

describe('NoteHorsSortieDetail', () => {
  it('shows everything the treasury needs about a formation', () => {
    render(<NoteHorsSortieDetail note={noteHorsSortie(202)} onAction={vi.fn()} />);

    expect(screen.getByRole('heading', { level: 1 }).textContent).toBe('Formation initiateur escalade');
    expect(screen.getByText('Formation · Escalade')).toBeTruthy();
    expect(screen.getByText('Validée par le responsable')).toBeTruthy();
    expect(field('Demandeur').textContent).toBe('Thomas Petit');
    expect(field('Date de la formation').textContent).toBe(new Date(2025, 0, 25).toLocaleDateString());
    expect(field('Mot pour le responsable').textContent).toBe('Stage validé par la commission en décembre.');
    expect(field('Validation du responsable').textContent).toBe('Validée par Hugo BLANC le 27/01/2025');

    const lien = within(field('Lien de la formation')).getByRole('link');
    expect(lien.getAttribute('href')).toBe('https://example.com/formation-initiateur-escalade');
    expect(lien.getAttribute('target')).toBe('_blank');
    expect(lien.getAttribute('rel')).toBe('noopener noreferrer');

    expect(screen.getByText('Le stage dépasse le plafond de la commission : le remboursable est réduit.')).toBeTruthy();
    expect(screen.queryByLabelText('Dernier refus')).toBeNull();
  });

  it('does not repeat the type, the commission and the objet of the header', () => {
    render(<NoteHorsSortieDetail note={noteHorsSortie(202)} onAction={vi.fn()} />);

    for (const label of ['Type', 'Commission', 'Objet']) {
      expect(screen.queryByText(label, { selector: 'dt' })).toBeNull();
    }
  });

  it('sums up what to pay at the top, with the accounting label and the actions', () => {
    render(<NoteHorsSortieDetail note={noteHorsSortie(202)} onAction={vi.fn()} />);

    expect(within(summary()).getByText('À rembourser : 287.40 €')).toBeTruthy();
    expect(within(summary()).getByText('312.40 € déclarés, dont 25.00 € au-delà des plafonds du club')).toBeTruthy();
    expect(within(summary()).getByText('Remboursement demandé')).toBeTruthy();
    expect(within(summary()).getByText('PETIT Thomas NDF 25/01/2025 Formation initiateur escalade')).toBeTruthy();
    expect(within(summary()).getAllByRole('button').map((button) => button.getAttribute('aria-label') ?? button.textContent))
      .toEqual(['Copier le libellé comptable', 'Approuver', 'Rejeter']);
  });

  it('shows each line as the API presents it, with its named receipt', () => {
    render(<NoteHorsSortieDetail note={noteHorsSortie(202)} onAction={vi.fn()} />);

    const stage = lineOf('Stage');
    expect(within(stage).getByText('250.00 €')).toBeTruthy();
    const receipt = within(stage).getByRole('link', { name: 'Justificatif : Stage (ouvre un nouvel onglet)' });
    expect(receipt.getAttribute('href')).toBe('https://example.com/facture-stage.pdf');
    expect(receipt.getAttribute('title')).toBe('Justificatif : Stage (ouvre un nouvel onglet)');

    const voiture = lineOf('Voiture');
    expect(within(voiture).getByText('240 km × 0,26 €')).toBeTruthy();
    expect(within(voiture).getByText('62.40 €')).toBeTruthy();
    expect(within(voiture).queryByRole('link')).toBeNull();
    expect(within(voiture).getByText('—')).toBeTruthy();
    expect(within(voiture).getByText('Aucun justificatif')).toBeTruthy();

    expect(within(screen.getByText('Total déclaré').closest('tr')!).getByText('312.40 €')).toBeTruthy();
    expect(within(screen.getByText('Total remboursable').closest('tr')!).getByText('287.40 €')).toBeTruthy();
  });

  it('shows an achat given as a don, its text as is, and hides an empty Détail column', () => {
    render(<NoteHorsSortieDetail note={noteHorsSortie(203)} onAction={vi.fn()} />);

    expect(screen.getByRole('heading', { level: 1 }).textContent).toBe("Sac <b>30 L</b> & cordelette d'attache");
    expect(document.querySelector('b')).toBeNull();
    expect(field('Date de la dépense')).toBeTruthy();
    expect(within(summary()).getByText('Don : 42.00 €')).toBeTruthy();
    expect(within(summary()).getByText('Don au club')).toBeTruthy();
    expect(screen.queryByRole('columnheader', { name: 'Détail' })).toBeNull();
    expect(screen.queryByText('Lien de la formation')).toBeNull();
    expect(screen.queryByText('Mot pour le responsable')).toBeNull();
  });

  it('says that a note sent without valideur goes straight to the treasury', () => {
    render(<NoteHorsSortieDetail note={noteHorsSortie(201)} onAction={vi.fn()} />);

    expect(field('Validation du responsable').textContent).toBe('Aucune : la note va directement à la trésorerie.');
    expect(screen.queryByLabelText('Avertissements')).toBeNull();
  });

  it('shows the refusal of a refused note, signed by the treasury', () => {
    render(<NoteHorsSortieDetail note={noteHorsSortie(205)} onAction={vi.fn()} />);

    const refusal = screen.getByLabelText('Dernier refus');
    expect(within(refusal).getByText('Refusée par la trésorerie le 29/01/2025')).toBeTruthy();
    expect(within(refusal).getByText('Il manque la facture.')).toBeTruthy();
    expect(refusal.className).toContain('bg-red-50');
  });

  it('recalls, without alarm, the refusal of a note corrected and sent again, and who it waits for', () => {
    render(<NoteHorsSortieDetail note={noteHorsSortie(206)} onAction={vi.fn()} />);

    expect(screen.queryByLabelText('Dernier refus')).toBeNull();
    const previous = screen.getByLabelText('Refus précédent');
    expect(previous.textContent).toBe(
      'Refusée par la trésorerie le 26/01, corrigée et renvoyée le 28/01 : « Il manque le ticket de caisse. »'
    );
    expect(previous.className).not.toContain('red');
    expect(screen.getByText("En attente de Hugo Blanc (responsable d'Escalade). Vous pourrez la valider après lui.")).toBeTruthy();
    expect(actionButtons()).toEqual([]);
  });

  it('says what the treasury decided on an approved note', () => {
    render(<NoteHorsSortieDetail note={noteHorsSortie(204)} onAction={vi.fn()} />);

    expect(field('Décision').textContent).toBe('Approuvée par la trésorerie le 13/01/2025');
  });

  it('says that a draft is not sent yet', () => {
    render(<NoteHorsSortieDetail note={noteHorsSortie(207)} onAction={vi.fn()} />);

    expect(screen.getByText('Brouillon')).toBeTruthy();
    expect(screen.getByText('Pas encore envoyée par le demandeur.')).toBeTruthy();
    expect(actionButtons()).toEqual([]);
  });

  it('does not link a formation link that is not http or https', () => {
    render(<NoteHorsSortieDetail note={noteHorsSortie(202, { lienFormation: 'javascript:alert(1)' })} onAction={vi.fn()} />);

    expect(field('Lien de la formation').textContent).toBe('javascript:alert(1)');
    expect(within(field('Lien de la formation')).queryByRole('link')).toBeNull();
  });

  it('keeps lines without id and repeated warnings apart', () => {
    const errors = vi.spyOn(console, 'error').mockImplementation(() => {});
    render(
      <NoteHorsSortieDetail
        note={noteHorsSortie(202, {
          lignesAffichees: [
            { id: null as unknown as string, nature: null, libelle: 'Corde', detail: null, montant: 10 },
            { id: null as unknown as string, nature: null, libelle: 'Corde', detail: null, montant: 10 },
          ],
          avertissements: ['Même avertissement.', 'Même avertissement.'],
        })}
        onAction={vi.fn()}
      />
    );

    expect(screen.getAllByText('Corde')).toHaveLength(2);
    expect(screen.getAllByText('Même avertissement.')).toHaveLength(2);
    expect(errors.mock.calls.flat().join(' ')).not.toMatch(/key/i);
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

    expect(actionButtons().map((button) => button.textContent)).toEqual(expected);
  });

  it.each([
    [204, true],
    [208, true],
    [202, false],
    [201, false],
    [205, false],
    [206, false],
    [207, false],
  ])('offers the PDF of note %i once the treasury has approved it: %s', (id, offered) => {
    render(<NoteHorsSortieDetail note={noteHorsSortie(id)} onAction={vi.fn()} />);

    expect(pdfButton() !== null).toBe(offered);
  });

  it('puts the PDF after the actions, in the summary, and downloads it', async () => {
    const note = noteHorsSortie(204);
    render(<NoteHorsSortieDetail note={note} onAction={vi.fn()} />);

    expect(within(summary()).getAllByRole('button').map((button) => button.getAttribute('aria-label') ?? button.textContent))
      .toEqual(['Copier le libellé comptable', 'Comptabiliser', 'Télécharger en PDF']);

    fireEvent.click(pdfButton()!);

    await waitFor(() => expect(generateNoteHorsSortiePDF).toHaveBeenCalledWith(note));
  });

  it('turns the PDF off while an action is sent', () => {
    render(<NoteHorsSortieDetail note={noteHorsSortie(204)} onAction={vi.fn()} pendingAction="accounted" />);

    expect((pdfButton() as HTMLButtonElement).disabled).toBe(true);
  });

  it('gives every button of the summary a visible keyboard focus', () => {
    render(<NoteHorsSortieDetail note={noteHorsSortie(204)} onAction={vi.fn()} />);

    for (const button of [screen.getByRole('button', { name: 'Comptabiliser' }), pdfButton()!]) {
      expect(button.className).toContain('focus-visible:ring-2 focus-visible:ring-blue-600 focus-visible:ring-offset-2');
    }
  });

  it('hands the chosen action over', () => {
    const onAction = vi.fn();
    render(<NoteHorsSortieDetail note={noteHorsSortie(202)} onAction={onAction} />);

    fireEvent.click(screen.getByRole('button', { name: 'Rejeter' }));

    expect(onAction).toHaveBeenCalledWith(202, 'rejected');
  });

  it('turns every action off while one is sent, and says which', () => {
    render(<NoteHorsSortieDetail note={noteHorsSortie(202)} onAction={vi.fn()} pendingAction="approved" />);

    expect(actionButtons().map((button) => button.textContent)).toEqual(['Approbation…', 'Rejeter']);
    for (const button of actionButtons()) {
      expect((button as HTMLButtonElement).disabled).toBe(true);
      expect(button.getAttribute('aria-busy')).toBe('true');
    }
  });

  it('announces the confirmation of an action', () => {
    render(
      <NoteHorsSortieDetail
        note={noteHorsSortie(204)}
        onAction={vi.fn()}
        confirmation="Note approuvée. Un mail a été envoyé à Lucie Roux."
      />
    );

    const announcements = screen.getAllByRole('status');
    expect(announcements[0].getAttribute('aria-live')).toBe('polite');
    expect(announcements[0].textContent).toBe('Note approuvée. Un mail a été envoyé à Lucie Roux.');
  });

  it('announces the copy of the accounting label, or that it failed', async () => {
    const writeText = vi.fn().mockResolvedValueOnce(undefined).mockRejectedValueOnce(new Error('denied'));
    Object.defineProperty(navigator, 'clipboard', { value: { writeText }, configurable: true });
    render(<NoteHorsSortieDetail note={noteHorsSortie(202)} onAction={vi.fn()} />);
    const copy = screen.getByRole('button', { name: 'Copier le libellé comptable' });

    await act(async () => fireEvent.click(copy));
    expect(writeText).toHaveBeenCalledWith('PETIT Thomas NDF 25/01/2025 Formation initiateur escalade');
    expect(screen.getByText('Copié')).toBeTruthy();

    await act(async () => fireEvent.click(copy));
    expect(screen.getByText('Copie impossible')).toBeTruthy();
  });

  it('keeps the latest copy feedback for its full time, and forgets it once the page is left', async () => {
    vi.useFakeTimers();
    try {
      const writeText = vi.fn().mockResolvedValueOnce(undefined).mockRejectedValueOnce(new Error('denied'));
      Object.defineProperty(navigator, 'clipboard', { value: { writeText }, configurable: true });
      const errors = vi.spyOn(console, 'error').mockImplementation(() => {});
      const { unmount } = render(<NoteHorsSortieDetail note={noteHorsSortie(202)} onAction={vi.fn()} />);
      const copy = screen.getByRole('button', { name: 'Copier le libellé comptable' });

      await act(async () => fireEvent.click(copy));
      await act(async () => { vi.advanceTimersByTime(1500); });
      await act(async () => fireEvent.click(copy));
      // Le délai du premier clic est passé : le second retour reste.
      await act(async () => { vi.advanceTimersByTime(600); });
      expect(screen.getByText('Copie impossible')).toBeTruthy();

      await act(async () => { vi.advanceTimersByTime(1500); });
      expect(screen.queryByText('Copie impossible')).toBeNull();

      await act(async () => fireEvent.click(copy));
      unmount();
      expect(vi.getTimerCount()).toBe(0);
      expect(errors).not.toHaveBeenCalled();
    } finally {
      vi.useRealTimers();
    }
  });
});
