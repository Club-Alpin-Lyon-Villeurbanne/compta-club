import React, { useCallback, useState } from 'react';
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
    FaMoneyBillWave,
    FaTimes,
} from 'react-icons/fa';
import { NonEventExpenseReport } from '@/app/interfaces/noteDeFraisInterface';
import { config } from '@/app/config';
import { formatEuro, getFileUrlByExpenseId } from '@/app/utils/helper';
import {
    formatReportDate,
    getLastRefusal,
    getReportTypeLabel,
    getTreasuryActions,
    getValidationResponsable,
    safeExternalUrl,
    TreasuryAction,
    waitsForResponsable,
} from '@/app/utils/expenseReport';
import { Badge } from './Badge';
import { Justificatif } from './Justificatif';

interface NoteHorsSortieDetailProps {
    note: NonEventExpenseReport;
    onAction: (noteId: number, action: TreasuryAction) => void;
}

const ACTION_BUTTONS: Record<TreasuryAction, { label: string; icon: IconType; className: string }> = {
    approved: { label: 'Approuver', icon: FaCheck, className: 'bg-green-600 hover:bg-green-700 focus:ring-green-300' },
    rejected: { label: 'Rejeter', icon: FaTimes, className: 'bg-red-600 hover:bg-red-700 focus:ring-red-300' },
    accounted: { label: 'Comptabiliser', icon: FaFileInvoiceDollar, className: 'bg-purple-600 hover:bg-purple-700 focus:ring-purple-300' },
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
    const [copied, setCopied] = useState(false);
    const copy = useCallback(() => {
        navigator.clipboard.writeText(libelle);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    }, [libelle]);

    return (
        <span className="inline-flex items-center gap-1">
            <span>{libelle}</span>
            <button
                type="button"
                onClick={copy}
                className="p-1 transition-colors rounded-full hover:bg-gray-100"
                title={copied ? 'Copié !' : 'Copier le libellé comptable'}
            >
                <FaCopy className={`text-sm ${copied ? 'text-green-500' : 'text-gray-400'}`} />
            </button>
        </span>
    );
};

export default function NoteHorsSortieDetail({ note, onAction }: NoteHorsSortieDetailProps) {
    const [pictoSrc, setPictoSrc] = useState(
        note.commission ? `https://www.clubalpinlyon.fr/ftp/commission/${note.commission.id}/picto-dark.png` : config.DEFAULT_COMMISSION_ICON
    );
    const typeLabel = getReportTypeLabel(note);
    const validation = getValidationResponsable(note);
    const refusal = getLastRefusal(note);
    const actions = getTreasuryActions(note);

    return (
        <div className="min-h-screen bg-gray-50">
            <div className="container max-w-4xl px-4 py-8 mx-auto space-y-6">
                <Link href="/note-de-frais" className="inline-flex items-center text-sm text-blue-700 hover:underline">
                    <FaArrowLeft className="mr-2" aria-hidden="true" />
                    Retour à la liste
                </Link>

                <div className="flex flex-wrap items-start justify-between gap-4">
                    <div className="flex items-center min-w-0 gap-4">
                        <Image
                            src={pictoSrc}
                            alt=""
                            width={35}
                            height={35}
                            style={{ width: 35, height: 35 }}
                            onError={() => setPictoSrc(config.DEFAULT_COMMISSION_ICON)}
                        />
                        <div className="min-w-0">
                            <p className="text-sm text-gray-600">
                                {[typeLabel, note.commission?.title].filter(Boolean).join(' · ')}
                            </p>
                            <h1 className="text-2xl font-semibold leading-tight text-gray-900 break-words">{note.objet}</h1>
                        </div>
                    </div>
                    <Badge status={note.status} />
                </div>

                {refusal && (
                    <section className="p-4 border border-red-200 rounded-lg bg-red-50" aria-label="Dernier refus">
                        <p className="font-medium text-red-800">{refusal.intitule}</p>
                        {refusal.message && <p className="mt-1 text-sm text-red-700 whitespace-pre-line">{refusal.message}</p>}
                    </section>
                )}

                {note.avertissements.length > 0 && (
                    <section className="p-4 border rounded-lg border-amber-300 bg-amber-50" aria-label="Avertissements">
                        <ul className="space-y-1 text-sm text-amber-900">
                            {note.avertissements.map((avertissement) => (
                                <li key={avertissement} className="flex items-start gap-2">
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
                        <Field label="Type">{typeLabel}</Field>
                        <Field label="Commission">{note.commission?.title}</Field>
                        <Field label="Date de la dépense">{formatReportDate(note.dateDepense)}</Field>
                        <Field label="Objet" wide>{note.objet}</Field>
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
                        <Field label="Don ou remboursement">
                            {note.refundRequired ? (
                                <>
                                    <FaMoneyBillWave className="inline-block mr-1 text-green-600" aria-hidden="true" />
                                    Remboursement
                                </>
                            ) : (
                                <>
                                    <FaGift className="inline-block mr-1 text-blue-600" aria-hidden="true" />
                                    Don
                                </>
                            )}
                        </Field>
                        {note.libelleComptable && (
                            <Field label="Libellé comptable" wide>
                                <LibelleComptable libelle={note.libelleComptable} />
                            </Field>
                        )}
                    </dl>
                </div>

                <div className="p-6 overflow-x-auto bg-white rounded-lg shadow-sm">
                    <h2 className="mb-4 text-lg font-semibold text-gray-800">Dépenses</h2>
                    <table className="w-full text-sm">
                        <thead>
                            <tr className="text-left text-gray-600">
                                <th className="py-2 pr-4 font-medium">Dépense</th>
                                <th className="py-2 pr-4 font-medium">Détail</th>
                                <th className="py-2 pr-4 font-medium text-right">Montant</th>
                                <th className="py-2 font-medium text-center">Justificatif</th>
                            </tr>
                        </thead>
                        <tbody>
                            {note.lignesAffichees.map((ligne) => (
                                <tr key={ligne.id} className="border-t border-gray-200">
                                    <td className="py-2 pr-4">{ligne.libelle}</td>
                                    <td className="py-2 pr-4 text-gray-600">{ligne.detail}</td>
                                    <td className="py-2 pr-4 text-right whitespace-nowrap">{formatEuro(ligne.montant)}</td>
                                    <td className="py-2 text-center">
                                        <Justificatif fileUrl={getFileUrlByExpenseId(note.piecesJointes, ligne.id)} />
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                        <tfoot className="border-t-2 border-gray-300">
                            <tr>
                                <th scope="row" colSpan={2} className="pt-3 pr-4 font-medium text-left">Total déclaré</th>
                                <td className="pt-3 pr-4 text-right whitespace-nowrap">{formatEuro(note.totalDeclare)}</td>
                                <td />
                            </tr>
                            <tr>
                                <th scope="row" colSpan={2} className="py-1 pr-4 font-semibold text-left">Total remboursable</th>
                                <td className="py-1 pr-4 font-semibold text-right whitespace-nowrap">{formatEuro(note.totalRemboursable)}</td>
                                <td />
                            </tr>
                        </tfoot>
                    </table>
                </div>

                {waitsForResponsable(note) && (
                    <p className="text-sm text-gray-700">En attente de la validation du responsable de commission.</p>
                )}
                {actions.length > 0 && (
                    <div className="flex flex-wrap gap-3">
                        {actions.map((action) => {
                            const { label, icon: Icon, className } = ACTION_BUTTONS[action];
                            return (
                                <button
                                    key={action}
                                    type="button"
                                    onClick={() => onAction(note.id, action)}
                                    className={`inline-flex items-center px-4 py-2 text-sm font-medium text-white rounded-lg focus:outline-none focus:ring-4 ${className}`}
                                >
                                    <Icon className="mr-2" aria-hidden="true" />
                                    {label}
                                </button>
                            );
                        })}
                    </div>
                )}
            </div>
        </div>
    );
}
