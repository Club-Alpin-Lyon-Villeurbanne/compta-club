import jsPDF from 'jspdf';
import autoTable, { CellHookData, RowInput, Styles } from 'jspdf-autotable';
import { NonEventExpenseReport } from '@/app/interfaces/noteDeFraisInterface';
import { ExpenseStatus } from '@/app/enums/ExpenseStatus';
import { config } from '@/app/config';
import { formatEuro } from '@/app/utils/helper';
import {
    formatReportDate,
    getAmountSummary,
    getApproval,
    getExpenseDateLabel,
    getReportTypeLabel,
    getValidationResponsable,
    noteStatusPhrase,
} from '@/app/utils/expenseReport';

const MARGE = 14;
const BLEU: [number, number, number] = [66, 139, 202];

// Les polices standard du PDF n'écrivent que le jeu WinAnsi : un seul caractère hors de ce jeu
// (espace fine insécable des nombres de la plateforme, lettre polonaise, émoji) brouille toute la ligne.
const WIN_ANSI_HORS_LATIN1 = '€‚ƒ„…†‡ˆ‰Š‹ŒŽ‘’“”•–—˜™š›œžŸ';

const estWinAnsi = (char: string) => {
    const code = char.codePointAt(0) ?? 0;
    return (code >= 0x20 && code < 0x7f) || (code >= 0xa0 && code <= 0xff) || WIN_ANSI_HORS_LATIN1.includes(char);
};

// Caractères de format invisibles (espace sans largeur, liant, sélecteur de variante d'émoji, BOM…).
const INVISIBLES = /[\u200b-\u200f\u202a-\u202e\u2060-\u2064\u2066-\u206f\ufe00-\ufe0f\ufeff]/;

function pdfText(text: string): string {
    return Array.from(text.normalize('NFC'), (char) => {
        if (char === '\n' || estWinAnsi(char)) return char;
        if (INVISIBLES.test(char)) return '';
        if (char === '\u202f' || char === '\u2007') return '\u00a0';
        if (/\s/.test(char)) return ' ';
        const sansAccent = char.normalize('NFD').replace(/[\u0300-\u036f]/g, '');
        return sansAccent && sansAccent !== char && Array.from(sansAccent).every(estWinAnsi) ? sansAccent : '?';
    }).join('');
}

const LIGATURES: Record<string, string> = { Œ: 'OE', Æ: 'AE', Ø: 'O', Ł: 'L', Đ: 'D' };

// Un morceau de nom de fichier : majuscules sans accent, chiffres et tirets, rien qui sorte du dossier.
function fileNamePart(text: string): string {
    return text
        .toUpperCase()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .replace(/[ŒÆØŁĐ]/g, (lettre) => LIGATURES[lettre])
        .replace(/[^A-Z0-9]+/g, '-')
        .replace(/^-+|-+$/g, '');
}

const LONGUEUR_MAX_DU_NOM = 80;

/** « note-de-frais-formation-202-PETIT.pdf » : le type, le numéro de la note et le nom du demandeur. */
export function getNoteHorsSortiePdfFileName(note: NonEventExpenseReport): string {
    const type = fileNamePart(getReportTypeLabel(note)).toLowerCase();
    const parts = [type, fileNamePart(String(note.id)), fileNamePart(note.utilisateur?.nom ?? '')];
    const nom = `note-de-frais-${parts.filter(Boolean).join('-')}`;
    return `${nom.slice(0, LONGUEUR_MAX_DU_NOM).replace(/-+$/, '')}.pdf`;
}

const finDuTableau = (doc: jsPDF) => (doc as jsPDF & { lastAutoTable: { finalY: number } }).lastAutoTable.finalY;

const lisible = ({ cell }: CellHookData) => {
    cell.text = cell.text.map(pdfText);
};

// Titre de section ; une page de plus s'il ne reste pas la place d'un titre et de quelques lignes.
function titre(doc: jsPDF, texte: string, y: number): number {
    let top = y + 10;
    if (top + 25 > doc.internal.pageSize.height - 20) {
        doc.addPage();
        top = 20;
    }
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(12);
    doc.text(texte, MARGE, top);
    return top + 3;
}

function fiche(doc: jsPDF, startY: number, body: RowInput[]): number {
    autoTable(doc, {
        body,
        startY,
        theme: 'plain',
        styles: { fontSize: 10, cellPadding: { top: 1.2, bottom: 1.2, left: 0, right: 3 } },
        columnStyles: { 0: { fontStyle: 'bold', cellWidth: 50 } },
        margin: { left: MARGE, right: MARGE },
        didParseCell: lisible,
    });
    return finDuTableau(doc);
}

const couleurDuStatut = (status: string): [number, number, number] =>
    status === ExpenseStatus.APPROVED ? [0, 128, 0] : status === ExpenseStatus.ACCOUNTED ? [128, 0, 128] : [0, 0, 0];

/** Le PDF d'une note hors sortie, avec les montants figés par la plateforme. */
export function buildNoteHorsSortiePdf(note: NonEventExpenseReport): jsPDF {
    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.width;

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(20);
    doc.text(pdfText(config.CLUB_NAME), pageWidth / 2, 20, { align: 'center' });
    doc.setFontSize(16);
    doc.text('NOTE DE FRAIS', pageWidth / 2, 30, { align: 'center' });
    doc.setFontSize(14);
    doc.setTextColor(...couleurDuStatut(note.status));
    doc.text(`STATUT : ${noteStatusPhrase(note.status).toUpperCase()}`, pageWidth / 2, 40, { align: 'center' });
    doc.setTextColor(0, 0, 0);

    // Ce que la trésorerie cherche d'abord, comme en tête de la page de la note : le numéro, le montant
    // à payer ou le don, et le libellé comptable.
    const summary = getAmountSummary(note);
    const ligneSeule = (content: string, styles: Partial<Styles> = {}) =>
        [{ content, colSpan: 2, styles: { fontStyle: 'normal' as const, ...styles } }];
    let y = fiche(doc, 48, [
        ligneSeule(`Note n° ${note.id}`, { fontStyle: 'bold', fontSize: 11 }),
        ligneSeule(summary.titre, { fontStyle: 'bold', fontSize: 14 }),
        ...(summary.detail ? [ligneSeule(summary.detail)] : []),
        ['Libellé comptable', note.libelleComptable ?? ''],
    ]);

    y = titre(doc, 'INFORMATIONS GÉNÉRALES', y);
    y = fiche(doc, y, [
        ['Demandeur', [note.utilisateur.prenom, note.utilisateur.nom].filter(Boolean).join(' ')],
        ['Type', getReportTypeLabel(note)],
        ['Commission', note.commission?.title ?? ''],
        ['Objet', note.objet],
        [getExpenseDateLabel(note), formatReportDate(note.dateDepense, 'fr-FR')],
    ]);

    y = titre(doc, 'DÉPENSES', y);
    const avecDetail = note.lignesAffichees.some((ligne) => ligne.detail);
    const aDroite = (content: string, styles: Partial<Styles> = {}) => ({ content, styles: { halign: 'right' as const, ...styles } });
    const montant = (valeur: number, styles: Partial<Styles> = {}) => aDroite(formatEuro(valeur), styles);
    const total = (libelle: string, valeur: number, fontStyle: Styles['fontStyle']) =>
        [{ content: libelle, colSpan: avecDetail ? 2 : 1, styles: { fontStyle } }, montant(valeur, { fontStyle })];
    autoTable(doc, {
        head: [['Dépense', ...(avecDetail ? ['Détail'] : []), aDroite('Montant')]],
        body: note.lignesAffichees.map((ligne) => [
            ligne.libelle ?? '',
            ...(avecDetail ? [ligne.detail ?? ''] : []),
            montant(ligne.montant),
        ]),
        foot: [total('Total déclaré', note.totalDeclare, 'normal'), total('Total remboursable', note.totalRemboursable, 'bold')],
        startY: y,
        theme: 'striped',
        showFoot: 'lastPage',
        headStyles: { fillColor: BLEU },
        footStyles: { fillColor: [255, 255, 255], textColor: 0 },
        columnStyles: avecDetail ? { 1: { minCellWidth: 45 }, 2: { cellWidth: 30 } } : { 1: { cellWidth: 30 } },
        margin: { left: MARGE, right: MARGE },
        didParseCell: lisible,
    });
    y = finDuTableau(doc);

    const validation = getValidationResponsable(note);
    const approval = getApproval(note);
    if (validation || approval) {
        y = titre(doc, 'VALIDATION', y);
        fiche(doc, y, [
            ...(validation ? [['Validation du responsable', validation]] : []),
            ...(approval ? [['Décision', approval]] : []),
        ]);
    }

    const pageCount = doc.getNumberOfPages();
    for (let i = 1; i <= pageCount; i++) {
        doc.setPage(i);
        doc.setFontSize(8);
        doc.setFont('helvetica', 'normal');
        doc.text(`Page ${i} / ${pageCount}`, pageWidth / 2, doc.internal.pageSize.height - 10, { align: 'center' });
        doc.text(`Généré le ${new Date().toLocaleDateString('fr-FR')}`, MARGE, doc.internal.pageSize.height - 10);
    }

    return doc;
}

export function generateNoteHorsSortiePDF(note: NonEventExpenseReport): void {
    buildNoteHorsSortiePdf(note).save(getNoteHorsSortiePdfFileName(note));
}
