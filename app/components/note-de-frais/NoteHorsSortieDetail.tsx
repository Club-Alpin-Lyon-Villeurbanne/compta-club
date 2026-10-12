import React, { Ref, useCallback, useEffect, useRef, useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { IconType } from 'react-icons';
import {
    FaArrowLeft,
    FaCheck,
    FaCopy,
    FaExclamationTriangle,
    FaExternalLinkAlt,
    FaFileInvoiceDollar,
    FaFilePdf,
    FaGift,
    FaInfoCircle,
    FaMoneyBillWave,
    FaTimes,
} from 'react-icons/fa';
import { NonEventExpenseReport } from '@/app/interfaces/noteDeFraisInterface';
import { config } from '@/app/config';
import { commissionPictoUrl, formatEuro, getFileUrlByExpenseId } from '@/app/utils/helper';
import {
    canDownloadPdf,
    formatReportDate,
    getAmountSummary,
    getApproval,
    getExpenseDateLabel,
    getLastRefusal,
    getReportTypeLabel,
    getStatusNote,
    getTotalLines,
    getTreasuryActions,
    getValidationResponsable,
    nomComplet,
    getWaitingForResponsable,
    safeExternalUrl,
    TreasuryAction,
} from '@/app/utils/expenseReport';
import { Badge } from './Badge';
import { Justificatif } from './Justificatif';

interface NoteHorsSortieDetailProps {
    note: NonEventExpenseReport;
    onAction: (noteId: number, action: TreasuryAction) => void;
    // L'action en cours d'envoi : les boutons attendent sa fin.
    pendingAction?: TreasuryAction | null;
    // « Note approuvée. … » après une action réussie
    confirmation?: string | null;
    // La note affichée n'a pas pu être relue après une action
    reloadFailed?: boolean;
    // Le titre, où la page ramène le focus quand une action n'a pas été enregistrée
    titleRef?: Ref<HTMLHeadingElement>;
}

const ACTION_BUTTONS: Record<TreasuryAction, { label: string; pending: string; icon: IconType; className: string }> = {
    approved: { label: 'Approuver', pending: 'Approbation…', icon: FaCheck, className: 'bg-green-700 hover:bg-green-800' },
    rejected: { label: 'Refuser', pending: 'Refus…', icon: FaTimes, className: 'bg-red-600 hover:bg-red-700' },
    accounted: { label: 'Comptabiliser', pending: 'Comptabilisation…', icon: FaFileInvoiceDollar, className: 'bg-purple-600 hover:bg-purple-700' },
};

// Anneau bleu foncé décalé du bouton : visible au clavier sur le blanc de la carte comme sur les boutons colorés.
const FOCUS_VISIBLE = 'focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-600 focus-visible:ring-offset-2';

const Field = ({ label, children, wide = false }: { label: string; children: React.ReactNode; wide?: boolean }) => (
    <div className={wide ? 'sm:col-span-2' : undefined}>
        <dt className="text-xs font-medium tracking-wide text-gray-500 uppercase">{label}</dt>
        <dd className="mt-1 text-sm text-gray-900 break-words">{children}</dd>
    </div>
);

const LienFormation = ({ url }: { url: string }) => {
    const href = safeExternalUrl(url);
    if (!href) return <span className="break-all">{url}</span>;
    return (
        <a href={href} target="_blank" rel="noopener noreferrer" className="text-blue-700 break-all hover:underline">
            {url}
            <FaExternalLinkAlt className="inline-block ml-1 text-xs" aria-hidden="true" />
        </a>
    );
};

const LibelleComptable = ({ libelle }: { libelle: string }) => {
    const [copie, setCopie] = useState<'faite' | 'impossible' | null>(null);
    const effacement = useRef<ReturnType<typeof setTimeout> | null>(null);
    const annulerEffacement = () => {
        if (effacement.current) clearTimeout(effacement.current);
        effacement.current = null;
    };
    useEffect(() => annulerEffacement, []);

    const copy = useCallback(async () => {
        annulerEffacement();
        try {
            await navigator.clipboard.writeText(libelle);
            setCopie('faite');
        } catch {
            setCopie('impossible');
        }
        effacement.current = setTimeout(() => setCopie(null), 2000);
    }, [libelle]);

    return (
        <div className="mt-3">
            {/* Le bouton à côté de l'intitulé : sous un libellé long, il se perdait seul sur sa ligne. */}
            <div className="flex items-center gap-1">
                <p className="text-xs font-medium tracking-wide text-gray-500 uppercase">Libellé comptable</p>
                <button
                    type="button"
                    onClick={copy}
                    className="inline-flex items-center justify-center w-8 h-8 -my-2 transition-colors rounded-full hover:bg-gray-100"
                    aria-label="Copier le libellé comptable"
                    title="Copier le libellé comptable"
                >
                    <FaCopy className={`text-sm ${copie === 'faite' ? 'text-green-600' : 'text-gray-500'}`} aria-hidden="true" />
                </button>
                <span role="status" aria-live="polite" className={`text-xs ${copie === 'impossible' ? 'text-red-700' : 'text-green-700'}`}>
                    {copie === 'faite' ? 'Copié' : copie === 'impossible' ? 'Copie impossible' : ''}
                </span>
            </div>
            <p className="text-sm text-gray-900 break-words">{libelle}</p>
        </div>
    );
};

export default function NoteHorsSortieDetail({
    note,
    onAction,
    pendingAction = null,
    confirmation = null,
    reloadFailed = false,
    titleRef,
}: NoteHorsSortieDetailProps) {
    const [pictoSrc, setPictoSrc] = useState(commissionPictoUrl(note.commission?.id));
    const typeLabel = getReportTypeLabel(note);
    const summary = getAmountSummary(note);
    const statusNote = getStatusNote(note);
    const refusal = getLastRefusal(note);
    const waiting = getWaitingForResponsable(note);
    const validation = getValidationResponsable(note);
    const approval = getApproval(note);
    // Après une relecture échouée, le statut affiché est peut-être périmé : aucune action n'est proposée.
    const actions = reloadFailed ? [] : getTreasuryActions(note);
    const busy = pendingAction !== null;
    const pdf = canDownloadPdf(note);
    const withDetail = note.lignesAffichees.some((ligne) => ligne.detail);
    const demandeur = nomComplet(note.utilisateur);

    // Au clavier, le bouton cliqué a disparu : le focus va sur la confirmation plutôt que retomber en haut de la page.
    const confirmationRef = useRef<HTMLParagraphElement>(null);
    useEffect(() => {
        if (confirmation) confirmationRef.current?.focus();
    }, [confirmation]);

    const downloadPdf = useCallback(async () => {
        const { generateNoteHorsSortiePDF } = await import('@/app/utils/noteHorsSortiePdf');
        generateNoteHorsSortiePDF(note);
    }, [note]);

    return (
        <div className="container max-w-5xl px-4 mx-auto space-y-5">
            <Link href="/note-de-frais" className="inline-flex items-center text-sm text-blue-700 hover:underline">
                <FaArrowLeft className="mr-2" aria-hidden="true" />
                Retour à la liste
            </Link>

            <div role="status" aria-live="polite" className="space-y-2">
                {confirmation && (
                    <p
                        ref={confirmationRef}
                        tabIndex={-1}
                        className="p-3 text-sm text-green-800 border border-green-200 rounded-lg bg-green-50 focus:outline-none"
                    >
                        {confirmation}
                    </p>
                )}
                {reloadFailed && (
                    <p className="p-3 text-sm border rounded-lg text-amber-900 border-amber-300 bg-amber-50">
                        La note n&apos;a pas pu être relue : elle peut avoir changé depuis. Rechargez la page pour la voir à jour.
                    </p>
                )}
            </div>

            <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
                <div className="flex items-start flex-1 min-w-0 gap-4">
                    <Image
                        src={pictoSrc}
                        alt=""
                        width={35}
                        height={35}
                        style={{ width: 35, height: 35 }}
                        className="mt-1"
                        onError={() => setPictoSrc(config.DEFAULT_COMMISSION_ICON)}
                    />
                    {/* Ce qui compte pour décider, avant les boutons de la synthèse : à qui l'on paie, les avertissements, le refus. */}
                    <div className="flex-1 min-w-0 space-y-3">
                        <div>
                            <p className="text-sm text-gray-600">
                                {[typeLabel, note.commission?.title, demandeur].filter(Boolean).join(' · ')}
                            </p>
                            <h1 ref={titleRef} tabIndex={-1} className="text-2xl font-semibold leading-tight text-gray-900 break-words focus:outline-none">
                                {note.objet}
                            </h1>
                            <div className="flex flex-wrap items-center gap-2 mt-2">
                                <Badge status={note.status} />
                                {statusNote && <span className="text-sm text-gray-600">{statusNote}</span>}
                            </div>
                        </div>

                        {refusal?.enCours && (
                            <section aria-label="Dernier refus" className="p-4 border border-red-200 rounded-lg bg-red-50">
                                <p className="font-medium text-red-800">{refusal.intitule}</p>
                                {refusal.message && <p className="mt-1 text-sm text-red-700 whitespace-pre-line">{refusal.message}</p>}
                            </section>
                        )}

                        {waiting && (
                            <p className="flex items-start gap-2 p-4 text-sm text-blue-900 border border-blue-200 rounded-lg bg-blue-50">
                                <FaInfoCircle className="flex-shrink-0 mt-0.5 text-blue-600" aria-hidden="true" />
                                {waiting}
                            </p>
                        )}

                        {refusal && !refusal.enCours && (
                            <section aria-label="Refus précédent" className="p-4 border border-gray-200 rounded-lg bg-gray-100">
                                <p className="text-sm text-gray-700 whitespace-pre-line">
                                    {refusal.intitule}
                                    {refusal.message && ` : « ${refusal.message} »`}
                                </p>
                            </section>
                        )}

                        {note.avertissements.length > 0 && (
                            <section className="p-4 border rounded-lg border-amber-300 bg-amber-50" aria-label="Avertissements">
                                <ul className="space-y-1 text-sm text-amber-900">
                                    {note.avertissements.map((avertissement, index) => (
                                        <li key={index} className="flex items-start gap-2">
                                            <FaExclamationTriangle className="flex-shrink-0 mt-0.5 text-amber-600" aria-hidden="true" />
                                            {avertissement}
                                        </li>
                                    ))}
                                </ul>
                            </section>
                        )}
                    </div>
                </div>

                <section aria-label="Synthèse" className="w-full p-4 bg-white rounded-lg shadow-sm md:w-80 md:flex-shrink-0">
                    <p className="text-xl font-semibold text-gray-900">
                        {note.refundRequired ? (
                            <FaMoneyBillWave className="inline-block mr-2 text-green-600" aria-hidden="true" />
                        ) : (
                            <FaGift className="inline-block mr-2 text-blue-600" aria-hidden="true" />
                        )}
                        {summary.titre}
                    </p>
                    {summary.detail && <p className="mt-1 text-sm text-gray-600">{summary.detail}</p>}
                    {note.libelleComptable && <LibelleComptable libelle={note.libelleComptable} />}
                    {(actions.length > 0 || pdf) && (
                        <div className="flex flex-wrap gap-2 mt-4">
                            {actions.map((action) => {
                                const { label, pending, icon: Icon, className } = ACTION_BUTTONS[action];
                                return (
                                    <button
                                        key={action}
                                        type="button"
                                        onClick={() => onAction(note.id, action)}
                                        disabled={busy}
                                        aria-busy={busy}
                                        className={`inline-flex items-center px-4 py-2 text-sm font-medium text-white rounded-lg ${FOCUS_VISIBLE} disabled:opacity-60 disabled:cursor-not-allowed ${className}`}
                                    >
                                        <Icon className="mr-2" aria-hidden="true" />
                                        {pendingAction === action ? pending : label}
                                    </button>
                                );
                            })}
                            {pdf && (
                                <button
                                    type="button"
                                    onClick={downloadPdf}
                                    disabled={busy}
                                    className={`inline-flex items-center px-4 py-2 text-sm font-medium text-gray-800 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 ${FOCUS_VISIBLE} disabled:opacity-60 disabled:cursor-not-allowed`}
                                >
                                    <FaFilePdf className="mr-2 text-red-600" aria-hidden="true" />
                                    Télécharger en PDF
                                </button>
                            )}
                        </div>
                    )}
                </section>
            </div>

            <div className="p-6 bg-white rounded-lg shadow-sm">
                <dl className="grid grid-cols-1 gap-x-6 gap-y-4 sm:grid-cols-2">
                    <Field label={getExpenseDateLabel(note)}>{formatReportDate(note.dateDepense)}</Field>
                    {note.lienFormation && (
                        <Field label="Lien de la formation" wide>
                            <LienFormation url={note.lienFormation} />
                        </Field>
                    )}
                    {note.motPourResponsable && (
                        <Field label="Mot du demandeur" wide>
                            <span className="whitespace-pre-line">{note.motPourResponsable}</span>
                        </Field>
                    )}
                    {validation && <Field label="Validation du responsable">{validation}</Field>}
                    {approval && <Field label="Décision">{approval}</Field>}
                </dl>
            </div>

            <div className="p-6 overflow-x-auto bg-white rounded-lg shadow-sm">
                <h2 className="mb-4 text-lg font-semibold text-gray-800">Dépenses</h2>
                <table className="w-full text-sm">
                    <thead>
                        <tr className="text-left text-gray-600">
                            <th className="py-2 pr-4 font-medium">Dépense</th>
                            {withDetail && <th className="py-2 pr-4 font-medium">Détail</th>}
                            <th className="py-2 pr-4 font-medium text-right">Montant</th>
                            <th className="py-2 font-medium text-center">Justificatif</th>
                        </tr>
                    </thead>
                    <tbody>
                        {note.lignesAffichees.map((ligne, index) => {
                            const fileUrl = ligne.id ? getFileUrlByExpenseId(note.piecesJointes, ligne.id) : undefined;
                            return (
                                <tr key={`${index}-${ligne.id ?? ''}`} className="border-t border-gray-200">
                                    <td className="py-2 pr-4">{ligne.libelle}</td>
                                    {withDetail && <td className="py-2 pr-4 text-gray-600">{ligne.detail}</td>}
                                    <td className="py-2 pr-4 text-right whitespace-nowrap">{formatEuro(ligne.montant)}</td>
                                    <td className="py-1 text-center">
                                        {fileUrl ? (
                                            <Justificatif fileUrl={fileUrl} libelle={ligne.libelle} />
                                        ) : (
                                            <>
                                                <span aria-hidden="true">—</span>
                                                <span className="sr-only">Aucun justificatif</span>
                                            </>
                                        )}
                                    </td>
                                </tr>
                            );
                        })}
                    </tbody>
                    <tfoot className="border-t-2 border-gray-300">
                        {getTotalLines(note).map(({ libelle, montant, principal }, index) => (
                            <tr key={libelle}>
                                <th
                                    scope="row"
                                    colSpan={withDetail ? 2 : 1}
                                    className={`${index === 0 ? 'pt-3' : 'py-1'} pr-4 text-left ${principal ? 'font-semibold' : 'font-medium'}`}
                                >
                                    {libelle}
                                </th>
                                <td className={`${index === 0 ? 'pt-3' : 'py-1'} pr-4 text-right whitespace-nowrap ${principal ? 'font-semibold' : ''}`}>
                                    {formatEuro(montant)}
                                </td>
                                <td />
                            </tr>
                        ))}
                    </tfoot>
                </table>
            </div>
        </div>
    );
}
