import React, { useCallback, useEffect, useRef, useState } from 'react';
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
    FaGift,
    FaInfoCircle,
    FaMoneyBillWave,
    FaTimes,
} from 'react-icons/fa';
import { NonEventExpenseReport } from '@/app/interfaces/noteDeFraisInterface';
import { config } from '@/app/config';
import { commissionPictoUrl, formatEuro, getFileUrlByExpenseId } from '@/app/utils/helper';
import {
    formatReportDate,
    getAmountSummary,
    getApproval,
    getExpenseDateLabel,
    getLastRefusal,
    getReportTypeLabel,
    getStatusNote,
    getTreasuryActions,
    getValidationResponsable,
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
}

const ACTION_BUTTONS: Record<TreasuryAction, { label: string; pending: string; icon: IconType; className: string }> = {
    approved: { label: 'Approuver', pending: 'Approbation…', icon: FaCheck, className: 'bg-green-600 hover:bg-green-700 focus:ring-green-300' },
    rejected: { label: 'Rejeter', pending: 'Refus…', icon: FaTimes, className: 'bg-red-600 hover:bg-red-700 focus:ring-red-300' },
    accounted: { label: 'Comptabiliser', pending: 'Comptabilisation…', icon: FaFileInvoiceDollar, className: 'bg-purple-600 hover:bg-purple-700 focus:ring-purple-300' },
};

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
        <span className="inline-flex flex-wrap items-center gap-1">
            <span>{libelle}</span>
            <button
                type="button"
                onClick={copy}
                className="inline-flex items-center justify-center w-8 h-8 transition-colors rounded-full hover:bg-gray-100"
                aria-label="Copier le libellé comptable"
                title="Copier le libellé comptable"
            >
                <FaCopy className={`text-sm ${copie === 'faite' ? 'text-green-600' : 'text-gray-500'}`} aria-hidden="true" />
            </button>
            <span role="status" aria-live="polite" className={`text-xs ${copie === 'impossible' ? 'text-red-700' : 'text-green-700'}`}>
                {copie === 'faite' ? 'Copié' : copie === 'impossible' ? 'Copie impossible' : ''}
            </span>
        </span>
    );
};

export default function NoteHorsSortieDetail({ note, onAction, pendingAction = null, confirmation = null }: NoteHorsSortieDetailProps) {
    const [pictoSrc, setPictoSrc] = useState(commissionPictoUrl(note.commission?.id));
    const typeLabel = getReportTypeLabel(note);
    const summary = getAmountSummary(note);
    const statusNote = getStatusNote(note);
    const refusal = getLastRefusal(note);
    const waiting = getWaitingForResponsable(note);
    const validation = getValidationResponsable(note);
    const approval = getApproval(note);
    const actions = getTreasuryActions(note);
    const busy = pendingAction !== null;
    const withDetail = note.lignesAffichees.some((ligne) => ligne.detail);

    return (
        <div className="min-h-screen bg-gray-50">
            <div className="container max-w-5xl px-4 py-6 mx-auto space-y-5">
                <Link href="/note-de-frais" className="inline-flex items-center text-sm text-blue-700 hover:underline">
                    <FaArrowLeft className="mr-2" aria-hidden="true" />
                    Retour à la liste
                </Link>

                <div role="status" aria-live="polite">
                    {confirmation && (
                        <p className="p-3 text-sm text-green-800 border border-green-200 rounded-lg bg-green-50">{confirmation}</p>
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
                        <div className="min-w-0">
                            <p className="text-sm text-gray-600">
                                {[typeLabel, note.commission?.title].filter(Boolean).join(' · ')}
                            </p>
                            <h1 className="text-2xl font-semibold leading-tight text-gray-900 break-words">{note.objet}</h1>
                            <div className="flex flex-wrap items-center gap-2 mt-2">
                                <Badge status={note.status} />
                                {statusNote && <span className="text-sm text-gray-600">{statusNote}</span>}
                            </div>
                        </div>
                    </div>

                    <section aria-label="Synthèse" className="w-full p-4 bg-white rounded-lg shadow-sm md:w-80 md:flex-shrink-0">
                        <p className="text-xl font-semibold text-gray-900">{summary.titre}</p>
                        {summary.detail && <p className="mt-1 text-sm text-gray-600">{summary.detail}</p>}
                        <p className="mt-2 text-sm text-gray-700">
                            {note.refundRequired ? (
                                <>
                                    <FaMoneyBillWave className="inline-block mr-1 text-green-600" aria-hidden="true" />
                                    Remboursement demandé
                                </>
                            ) : (
                                <>
                                    <FaGift className="inline-block mr-1 text-blue-600" aria-hidden="true" />
                                    Don au club
                                </>
                            )}
                        </p>
                        {note.libelleComptable && (
                            <div className="mt-3">
                                <p className="text-xs font-medium tracking-wide text-gray-500 uppercase">Libellé comptable</p>
                                <div className="text-sm text-gray-900 break-words">
                                    <LibelleComptable libelle={note.libelleComptable} />
                                </div>
                            </div>
                        )}
                        {actions.length > 0 && (
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
                                            className={`inline-flex items-center px-4 py-2 text-sm font-medium text-white rounded-lg focus:outline-none focus:ring-4 disabled:opacity-60 disabled:cursor-not-allowed ${className}`}
                                        >
                                            <Icon className="mr-2" aria-hidden="true" />
                                            {pendingAction === action ? pending : label}
                                        </button>
                                    );
                                })}
                            </div>
                        )}
                    </section>
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

                <div className="p-6 bg-white rounded-lg shadow-sm">
                    <dl className="grid grid-cols-1 gap-x-6 gap-y-4 sm:grid-cols-2">
                        <Field label="Demandeur">{note.utilisateur.prenom} {note.utilisateur.nom}</Field>
                        <Field label={getExpenseDateLabel(note)}>{formatReportDate(note.dateDepense)}</Field>
                        {note.lienFormation && (
                            <Field label="Lien de la formation" wide>
                                <LienFormation url={note.lienFormation} />
                            </Field>
                        )}
                        {note.motPourResponsable && (
                            <Field label="Mot pour le responsable" wide>
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
                            <tr>
                                <th scope="row" colSpan={withDetail ? 2 : 1} className="pt-3 pr-4 font-medium text-left">Total déclaré</th>
                                <td className="pt-3 pr-4 text-right whitespace-nowrap">{formatEuro(note.totalDeclare)}</td>
                                <td />
                            </tr>
                            <tr>
                                <th scope="row" colSpan={withDetail ? 2 : 1} className="py-1 pr-4 font-semibold text-left">Total remboursable</th>
                                <td className="py-1 pr-4 font-semibold text-right whitespace-nowrap">{formatEuro(note.totalRemboursable)}</td>
                                <td />
                            </tr>
                        </tfoot>
                    </table>
                </div>
            </div>
        </div>
    );
}
