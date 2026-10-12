import Link from 'next/link';
import { ExpenseReport } from "@/app/interfaces/noteDeFraisInterface";
import React, { useState, useMemo, useCallback } from "react";
import Image from 'next/image';
import { Badge } from './Badge';
import { config } from '@/app/config';
import { FaCalendarAlt, FaClipboardList, FaGift, FaMoneyBillWave, FaCopy, FaFilePdf } from 'react-icons/fa';
import { commissionPictoUrl, formatEuro, truncateText } from '@/app/utils/helper';
import {
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
import { ExpenseStatus } from '@/app/enums/ExpenseStatus';

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
        if (!isEventReport(report)) return;
        const { generateExpenseReportPDF } = await import('@/app/utils/pdfGenerator');
        generateExpenseReportPDF(report);
    }, [report]);

    // Le PDF d'une note hors sortie n'existe pas encore : le modèle des sorties lui serait faux.
    const canDownloadPDF = isEventReport(report) &&
        (report.status === ExpenseStatus.APPROVED || report.status === ExpenseStatus.ACCOUNTED);

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
                <p className="flex items-center gap-1 text-gray-900 truncate whitespace-nowrap">
                    <FaClipboardList className="text-gray-500" />
                    {href ? (
                        <Link href={href} className="hover:underline" title={title}>
                            {truncateText(title, 40)}
                        </Link>
                    ) : (
                        <span title={title}>{truncateText(title, 40)}</span>
                    )}
                    {textToCopy && (
                        <button
                            onClick={handleCopy}
                            className="p-1 transition-colors rounded-full hover:bg-gray-100"
                            title={copied ? "Copié !" : isEventReport(report) ? "Copier le titre" : "Copier le libellé comptable"}
                        >
                            <FaCopy className={`text-sm ${copied ? 'text-green-500' : 'text-gray-400'}`} />
                        </button>
                    )}
                </p>
                {details && <p className="mt-0.5 text-xs text-gray-500">{details}</p>}
            </td>
            <td className="w-1/6 px-2 py-2 text-sm bg-white border-b border-gray-200">
                <p className="text-gray-900 truncate whitespace-nowrap">
                    {href ? (
                        <Link href={href} className="hover:underline">
                            {requester}
                        </Link>
                    ) : (
                        requester
                    )}
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
