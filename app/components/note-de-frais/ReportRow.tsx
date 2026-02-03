import Link from 'next/link';
import { ExpenseReport } from "@/app/interfaces/noteDeFraisInterface";
import React, { useState, useMemo, useCallback } from "react";
import Image from 'next/image';
import { Badge } from './Badge';
import { config } from '@/app/config';
import { FaCalendarAlt, FaClipboardList, FaGift, FaMoneyBillWave, FaCopy, FaFilePdf } from 'react-icons/fa';
import { calculateTotals, formatEuro, truncateText } from '@/app/utils/helper';
import { ExpenseStatus } from '@/app/enums/ExpenseStatus';

interface ReportRowProps {
    report: ExpenseReport;
}

const ReportRow: React.FC<ReportRowProps> = ({ report }) => {
    const [imgSrc, setImgSrc] = useState(`https://www.clubalpinlyon.fr/ftp/commission/${report.sortie.commission.id}/picto-dark.png`);
    const [copied, setCopied] = useState(false);
    const totals = useMemo(() => calculateTotals(report.details), [report.details]);

    const handleCopy = useCallback(() => {
        const textToCopy = [
            report.sortie.titre,
            `${report.utilisateur.prenom} ${report.utilisateur.nom}`,
            new Date(report.sortie.heureRendezVous).toLocaleDateString(),
            report.sortie.commission.title
        ].join('-').toUpperCase();

        navigator.clipboard.writeText(textToCopy);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    }, [report]);

    const handleDownloadPDF = useCallback(async () => {
        const { generateExpenseReportPDF } = await import('@/app/utils/pdfGenerator');
        generateExpenseReportPDF(report);
    }, [report]);

    return (
        <tr className="border-b transition-colors hover:bg-muted/50 data-[state=selected]:bg-muted">
            <td className="w-12 px-2 py-2 text-sm bg-white border-b border-gray-200">
                <Image
                    src={imgSrc}
                    alt=""
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
                    <Link href={`/note-de-frais/${report.sortie.id}`} className="hover:underline" title={report.sortie.titre}>
                        {truncateText(report.sortie.titre, 40)}
                    </Link>
                    <button
                        onClick={handleCopy}
                        className="p-1 transition-colors rounded-full hover:bg-gray-100"
                        title={copied ? "Copié !" : "Copier le titre"}
                    >
                        <FaCopy className={`text-sm ${copied ? 'text-green-500' : 'text-gray-400'}`} />
                    </button>
                </p>
            </td>
            <td className="w-1/6 px-2 py-2 text-sm bg-white border-b border-gray-200">
                <p className="text-gray-900 truncate whitespace-nowrap">
                    <Link href={`/note-de-frais/${report.sortie.id}`} className="hover:underline">
                        {report.utilisateur.prenom + " " + report.utilisateur.nom}
                    </Link>
                </p>
            </td>
            <td className="w-24 px-2 py-2 text-sm bg-white border-b border-gray-200">
                <p className="text-gray-900 whitespace-nowrap">
                    <FaCalendarAlt className="inline-block mr-1 text-gray-500" />
                    {new Date(report.sortie.heureRendezVous).toLocaleDateString()}
                </p>
            </td>
            <td className="w-24 px-2 py-2 text-sm bg-white border-b border-gray-200">
                <p className="text-gray-900 whitespace-nowrap">
                    <FaCalendarAlt className="inline-block mr-1 text-gray-500" />
                    {new Date(report.dateCreation).toLocaleDateString()}
                </p>
            </td>
            <td className="w-24 px-2 py-2 text-sm bg-white border-b border-gray-200">
                <span className="text-gray-900 whitespace-nowrap">
                    {formatEuro(totals.totalRemboursable)}
                </span>
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
            <td className="w-24 px-2 py-2 text-sm text-center bg-white border-b border-gray-200">
                <div className="flex items-center justify-center gap-2">
                    <Badge status={report.status} />
                    {(report.status === ExpenseStatus.APPROVED || report.status === ExpenseStatus.ACCOUNTED) && (
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