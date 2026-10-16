import { describe, it, expect } from 'vitest';
import { NonEventExpenseReport } from '@/app/interfaces/noteDeFraisInterface';
import { config } from '@/app/config';
import { buildNoteHorsSortiePdf, getNoteHorsSortiePdfFileName } from '@/app/utils/noteHorsSortiePdf';
import { mockNotesHorsSortie } from '@/tests/mocks/fixtures';
import { pdfTexts, textAfter } from '@/tests/pdf-text';

const noteHorsSortie = (id: number, changes: Partial<NonEventExpenseReport> = {}) =>
  ({ ...mockNotesHorsSortie.find((note) => note.id === id), ...changes }) as unknown as NonEventExpenseReport;

const approuveeParLaTresorerie = {
  status: 'approved',
  derniereDecision: {
    statut: 'approved',
    niveau: 'tresorerie',
    auteur: { prenom: 'Claire', nom: 'FONTAINE' },
    date: '2025-01-30T10:00:00+01:00',
    message: null,
  },
} as Partial<NonEventExpenseReport>;

const textsOf = (note: NonEventExpenseReport) => pdfTexts(buildNoteHorsSortiePdf(note).output());
const after = (texts: string[], label: string, count: number) => texts.slice(texts.indexOf(label) + 1, texts.indexOf(label) + 1 + count);

describe('PDF of a note hors sortie', () => {
  it('gives a formation, with its car line, every part of the model', () => {
    const formation = noteHorsSortie(202, approuveeParLaTresorerie);
    const texts = textsOf(formation);

    expect(getNoteHorsSortiePdfFileName(formation)).toBe('note-de-frais-formation-202-PETIT.pdf');
    expect(texts.slice(0, 9)).toEqual([
      config.CLUB_NAME,
      'NOTE DE FRAIS',
      'STATUT : APPROUVÉE',
      'Note n° 202',
      'À rembourser : 287.40 €',
      '312.40 € déclarés, dont 25.00 € au-delà des plafonds du club',
      'Libellé comptable',
      'PETIT Thomas NDF 25/01/2025 Formation initiateur escalade',
      'INFORMATIONS GÉNÉRALES',
    ]);
    expect(textAfter(texts, 'Demandeur')).toBe('Thomas Petit');
    expect(textAfter(texts, 'Type')).toBe('Formation');
    expect(textAfter(texts, 'Commission')).toBe('Escalade');
    expect(textAfter(texts, 'Objet')).toBe('Formation initiateur escalade');
    expect(textAfter(texts, 'Date de la formation')).toBe('25/01/2025');

    expect(after(texts, 'DÉPENSES', 3)).toEqual(['Dépense', 'Détail', 'Montant']);
    expect(after(texts, 'Stage', 2)).toEqual(['', '250.00 €']);
    expect(after(texts, 'Voiture', 2)).toEqual(['240 km × 0,26\u00a0€', '62.40 €']);
    expect(textAfter(texts, 'Total déclaré')).toBe('312.40 €');
    expect(textAfter(texts, 'Total remboursable')).toBe('287.40 €');

    expect(textAfter(texts, 'Validation du responsable')).toBe('Validée par Hugo BLANC le 27/01/2025');
    expect(textAfter(texts, 'Décision')).toBe('Approuvée par la trésorerie le 30/01/2025');
    expect(texts.join('\n')).not.toContain('FONTAINE');
    expect(texts.at(-3)).toBe('Approuvée par la trésorerie le 30/01/2025');
  });

  it('says the amount and the accounting label once, at the top', () => {
    const texts = textsOf(noteHorsSortie(202, approuveeParLaTresorerie));

    for (const text of ['À rembourser : 287.40 €', 'PETIT Thomas NDF 25/01/2025 Formation initiateur escalade']) {
      expect(texts.filter((t) => t === text)).toHaveLength(1);
    }
    expect(texts).not.toContain('RÉCAPITULATIF');
    expect(texts).not.toContain('Remboursement demandé');
  });

  it('gives an achat given as a don, its text as typed, without a Détail column', () => {
    const achat = noteHorsSortie(203, approuveeParLaTresorerie);
    const texts = textsOf(achat);

    expect(getNoteHorsSortiePdfFileName(achat)).toBe('note-de-frais-achat-203-FAURE.pdf');
    expect(texts.slice(3, 6)).toEqual(['Note n° 203', 'Don : 42.00 €', 'Libellé comptable']);
    expect(textAfter(texts, 'Type')).toBe('Achat');
    expect(textAfter(texts, 'Objet')).toBe("Sac <b>30 L</b> & cordelette d'attache");
    expect(textAfter(texts, 'Date de la dépense')).toBe('18/01/2025');
    expect(after(texts, 'DÉPENSES', 4)).toEqual(['Dépense', 'Montant', "Sac <b>30 L</b> & cordelette d'attache", '42.00 €']);
    expect(texts).not.toContain('Détail');
    expect(textAfter(texts, 'Validation du responsable')).toBe('Validée par Hugo BLANC le 27/01/2025');
    expect(texts.join('\n')).not.toContain('déclarés');
    // Rien de plafonné : un seul total
    expect(textAfter(texts, 'Total')).toBe('42.00 €');
    expect(texts).not.toContain('Total déclaré');
    expect(texts).not.toContain('Total remboursable');
  });

  it('does not call the part of a don within the caps of the club refundable', () => {
    const texts = textsOf(noteHorsSortie(202, { ...approuveeParLaTresorerie, refundRequired: false }));

    expect(textAfter(texts, 'Total déclaré')).toBe('312.40 €');
    expect(textAfter(texts, 'Total dans les plafonds du club')).toBe('287.40 €');
    expect(texts).not.toContain('Total remboursable');
  });

  it('says that an accounted note went straight to the treasury', () => {
    const texts = textsOf(noteHorsSortie(208));

    expect(texts[2]).toBe('STATUT : COMPTABILISÉE');
    expect(texts[4]).toBe('Remboursement : 32.50 €');
    expect(texts.join('\n')).not.toContain('À rembourser');
    expect(textAfter(texts, 'Validation du responsable')).toBe('Aucune : la note est allée directement à la trésorerie.');
    expect(textAfter(texts, 'Décision')).toBe('Approuvée par la trésorerie le 07/01/2025');
  });

  it('prints the amounts frozen by the platform, without adding the lines up', () => {
    const texts = textsOf(noteHorsSortie(202, {
      ...approuveeParLaTresorerie,
      lignesAffichees: [{ id: 'ligne-1', nature: 'stage', libelle: 'Stage', detail: null, montant: 100 }],
      totalDeclare: 999.99,
      totalRemboursable: 888.88,
    }));

    expect(textAfter(texts, 'Total déclaré')).toBe('999.99 €');
    expect(textAfter(texts, 'Total remboursable')).toBe('888.88 €');
    expect(texts).toContain('À rembourser : 888.88 €');
    expect(texts).not.toContain('100.00 € déclarés');
  });

  it('prints a line typed without description, and a decision the API gives without name nor date', () => {
    const texts = textsOf(noteHorsSortie(202, {
      ...approuveeParLaTresorerie,
      lignesAffichees: [{ id: null, nature: null, libelle: null, detail: null, montant: 100 }],
      validationResponsable: { auteur: { prenom: null, nom: null }, date: null },
    }));

    expect(after(texts, 'DÉPENSES', 6)).toEqual(['Dépense', 'Montant', '', '100.00 €', 'Total déclaré', '312.40 €']);
    expect(textAfter(texts, 'Validation du responsable')).toBe('Validée');
  });

  it('keeps a line readable when it holds characters the PDF font cannot write', () => {
    const texts = textsOf(noteHorsSortie(202, {
      ...approuveeParLaTresorerie,
      objet: 'Stage Łódź 😀 e\u0301te\u0301',
      lignesAffichees: [{ id: 'ligne-1', nature: 'voiture', libelle: 'Voiture', detail: '1\u202f240 km × 0,26\u00a0€', montant: 322.4 }],
    }));

    expect(textAfter(texts, 'Objet')).toBe('Stage ?ódz ? été');
    expect(textAfter(texts, 'Voiture')).toBe('1\u00a0240 km × 0,26\u00a0€');
  });

  it('drops the invisible format characters instead of printing a question mark', () => {
    const texts = textsOf(noteHorsSortie(202, {
      ...approuveeParLaTresorerie,
      objet: 'Co\u200bde\u200c\u200d du\u2060 stage\ufeff ❤\ufe0f',
    }));

    expect(textAfter(texts, 'Objet')).toBe('Code du stage ?');
  });
});

describe('file name of the PDF of a note hors sortie', () => {
  it.each([
    ['Le Gall', 'note-de-frais-achat-201-LE-GALL.pdf'],
    ['Müller', 'note-de-frais-achat-201-MULLER.pdf'],
    ['Lœuillet', 'note-de-frais-achat-201-LOEUILLET.pdf'],
    ['../../etc/passwd', 'note-de-frais-achat-201-ETC-PASSWD.pdf'],
    ['O\'Brien\\\u0000\u001f', 'note-de-frais-achat-201-O-BRIEN.pdf'],
    ['日本', 'note-de-frais-achat-201.pdf'],
    ['- -- -', 'note-de-frais-achat-201.pdf'],
    ['', 'note-de-frais-achat-201.pdf'],
  ])('cleans the name %j', (nom, fileName) => {
    const achat = noteHorsSortie(201, { utilisateur: { id: 8, prenom: 'Lucie', nom } });

    expect(getNoteHorsSortiePdfFileName(achat)).toBe(fileName);
  });

  it('keeps the name short, without a dash before the extension', () => {
    const achat = (nom: string) => noteHorsSortie(201, { utilisateur: { id: 8, prenom: 'Lucie', nom } });

    expect(getNoteHorsSortiePdfFileName(achat('A'.repeat(200)))).toBe(`note-de-frais-achat-201-${'A'.repeat(56)}.pdf`);
    expect(getNoteHorsSortiePdfFileName(achat('ABC '.repeat(50)))).toBe(`note-de-frais-achat-201-${'ABC-'.repeat(13)}ABC.pdf`);
  });

  it('names the type and the note, never the code of a sortie', () => {
    expect(getNoteHorsSortiePdfFileName(noteHorsSortie(204))).toBe('note-de-frais-formation-204-ROUX.pdf');
    expect(getNoteHorsSortiePdfFileName(noteHorsSortie(208))).toBe('note-de-frais-achat-208-FAURE.pdf');
  });
});
