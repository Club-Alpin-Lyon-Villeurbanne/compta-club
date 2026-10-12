import Link from 'next/link';
import { ExpenseReport } from "@/app/interfaces/noteDeFraisInterface";
import React, { useState, useMemo, useCallback } from "react";
import Image from 'next/image';
import { Badge } from './Badge';
import { config } from '@/app/config';
import { FaCalendarAlt, FaClipboardList, FaGift, FaMoneyBillWave, FaCopy, FaFilePdf } from 'react-icons/fa';
import { commissionPictoUrl, formatEuro } from '@/app/utils/helper';
import {
    canDownloadPdf,
    formatReportDate,
    getReportAmount,
    getReportCommission,
    getNonEventReportDetails,
    getRefundableNote,
    getReportDate,
    getReportHref,
    getReportSubmissionDate,
    getReportTitle,
    getReportTypeLabel,
    isEventReport,
} from '@/app/utils/expenseReport';

interface ReportRowProps {
    report: ExpenseReport;
}

const ReportRow: React.FC<ReportRowProps> = ({ report }) => {
    const commission = getReportCommission(report);
    const [imgSrc, setImgSrc] = useState(commissionPictoUrl(commission?.id));
    const [copied, setCopied] = useState(false);
    const amount = useMemo(() => getReportAmount(report), [report]);
    const title = getReportTitle(report);
    const details = getNonEventReportDetails(report);
    const refundableNote = getRefundableNote(report);
    const requester = `${report.utilisateur.prenom} ${report.utilisateur.nom}`;
    const href = getReportHref(report);

    // Une note hors sortie se copie par son libellé comptable, donné par la plateforme.
    const textToCopy = isEventReport(report)
        ? [title, requester, formatReportDate(getReportDate(report)), commission?.title ?? ''].join('-').toUpperCase()
        : report.libelleComptable;

    const handleCopy = useCallback(() => {
        if (!textToCopy) return;
        navigator.clipboard.writeText(textToCopy);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    }, [textToCopy]);

    const handleDownloadPDF = useCallback(async () => {
        if (isEventReport(report)) {
            const { generateExpenseReportPDF } = await import('@/app/utils/pdfGenerator');
            generateExpenseReportPDF(report);
        } else {
            const { generateNoteHorsSortiePDF } = await import('@/app/utils/noteHorsSortiePdf');
            generateNoteHorsSortiePDF(report);
        }
    }, [report]);

    const canDownloadPDF = canDownloadPdf(report);

    return (
        <tr className="border-b transition-colors hover:bg-muted/50 data-[state=selected]:bg-muted">
            <td className="w-20 px-2 py-2 text-sm bg-white border-b border-gray-200">
                <p className="text-gray-900 whitespace-nowrap">{getReportTypeLabel(report)}</p>
            </td>
            <td className="w-12 px-2 py-2 text-sm bg-white border-b border-gray-200">
                <Image
                    src={imgSrc}
                    alt={commission?.title ?? ''}
                    title={commission?.title}
                    className="inline-block"
                    width={30}
                    height={30}
                    style={{ width: 30, height: 30 }}
                    onError={() => {
                        setImgSrc(config.DEFAULT_COMMISSION_ICON);
                    }}
                />
            </td>
            <td className="w-1/4 px-2 py-2 text-sm bg-white border-b border-gray-200">
                {/* Le titre passe à la ligne, sur deux lignes au plus : la table tient dans sa carte dès 1280 px, bouton PDF compris. */}
                <p className="flex items-center gap-1 text-gray-900">
                    <FaClipboardList className="flex-shrink-0 text-gray-500" />
                    {href ? (
                        <Link href={href} className="min-w-0 break-words line-clamp-2 hover:underline" title={title}>
                            {title}
                        </Link>
                    ) : (
                        <span className="min-w-0 break-words line-clamp-2" title={title}>{title}</span>
                    )}
                    {textToCopy && (
                        <button
                            onClick={handleCopy}
                            className="flex-shrink-0 p-1 transition-colors rounded-full hover:bg-gray-100"
                            title={copied ? "Copié !" : isEventReport(report) ? "Copier le titre" : "Copier le libellé comptable"}
                        >
                            <FaCopy className={`text-sm ${copied ? 'text-green-500' : 'text-gray-400'}`} />
                        </button>
                    )}
                </p>
                {details && <p className="max-w-xs mt-0.5 text-xs text-gray-500 break-words">{details}</p>}
            </td>
            <td className="px-2 py-2 text-sm bg-white border-b border-gray-200">
                {/* Coupé : un nom composé repousserait le bouton PDF hors de la carte. */}
                <p className="max-w-[10rem] truncate text-gray-900" title={requester}>
                    {requester}
                </p>
            </td>
            <td className="w-24 px-2 py-2 text-sm bg-white border-b border-gray-200">
                <p className="text-gray-900 whitespace-nowrap">
                    <FaCalendarAlt className="inline-block mr-1 text-gray-500" />
                    {formatReportDate(getReportDate(report))}
                </p>
            </td>
            <td className="w-24 px-2 py-2 text-sm bg-white border-b border-gray-200">
                <p className="text-gray-900 whitespace-nowrap">
                    <FaCalendarAlt className="inline-block mr-1 text-gray-500" />
                    {new Date(getReportSubmissionDate(report)).toLocaleDateString()}
                </p>
            </td>
            <td className="w-24 px-2 py-2 text-sm bg-white border-b border-gray-200">
                <span className="text-gray-900 whitespace-nowrap">
                    {formatEuro(amount)}
                </span>
                {refundableNote && <p className="text-xs text-gray-500 whitespace-nowrap">{refundableNote}</p>}
            </td>
            <td className="px-2 py-2 text-sm text-center bg-white border-b border-gray-200 w-28">
                <p className="text-gray-900 whitespace-nowrap">
                    {report.refundRequired ? (
                        <>
                            <FaMoneyBillWave className="inline-block mr-1 text-green-500" />
                            Remboursement
                        </>
                    ) : (
                        <>
                            <FaGift className="inline-block mr-1 text-blue-500" />
                            Don
                        </>
                    )}
                </p>
            </td>
            <td className="w-32 px-2 py-2 text-sm bg-white border-b border-gray-200">
                {/* Badges alignés à gauche, qu'un bouton PDF les suive ou non ; « Validée par le responsable » sur deux lignes au plus */}
                <div className="flex items-center gap-2 min-w-[7rem]">
                    <Badge status={report.status} />
                    {canDownloadPDF && (
                        <button
                            onClick={handleDownloadPDF}
                            className="p-1.5 text-red-600 transition-colors rounded hover:bg-red-50"
                            title="Télécharger en PDF"
                        >
                            <FaFilePdf className="text-lg" />
                        </button>
                    )}
                </div>
            </td>
        </tr>
    );
}

export default React.memo(ReportRow);
