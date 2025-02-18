import Link from 'next/link';
import { ExpenseReport } from "@/app/interfaces/noteDeFraisInterface";
import React, { useState } from "react";
import Image from 'next/image';
import { Badge } from './Badge';
import { config } from '@/app/config';
import { FaCalendarAlt, FaClipboardList, FaGift, FaMoneyBillWave, FaCopy } from 'react-icons/fa';
import { calculateTotals, formatEuro, truncateText } from '@/app/utils/helper';

interface ReportRowProps {
    report: ExpenseReport;
}

const ReportRow: React.FC<ReportRowProps> = ({ report }) => {
    const [imgSrc, setImgSrc] = useState(`https://www.clubalpinlyon.fr/ftp/commission/${report.event.commission.id}/picto-dark.png`);
    const [copied, setCopied] = useState(false);
    const totals = calculateTotals(report.details);

    const handleCopy = () => {
        const textToCopy = [
            report.event.titre,
            `${report.user.firstname} ${report.user.lastname}`,
            new Date(report.event.tsp).toLocaleDateString(),
            report.event.commission.name
        ].join('-').toUpperCase();

        navigator.clipboard.writeText(textToCopy);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

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
                    <Link href={`/note-de-frais/${report.event.id}`} className="hover:underline" title={report.event.titre}>
                        {truncateText(report.event.titre, 40)}
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
                    <Link href={`/note-de-frais/${report.event.id}`} className="hover:underline">
                        {report.user.firstname + " " + report.user.lastname}
                    </Link>
                </p>
            </td>
            <td className="w-24 px-2 py-2 text-sm bg-white border-b border-gray-200">
                <p className="text-gray-900 whitespace-nowrap">
                    <FaCalendarAlt className="inline-block mr-1 text-gray-500" />
                    {new Date(report.event.tsp).toLocaleDateString()}
                </p>
            </td>
            <td className="w-24 px-2 py-2 text-sm bg-white border-b border-gray-200">
                <p className="text-gray-900 whitespace-nowrap">
                    <FaCalendarAlt className="inline-block mr-1 text-gray-500" />
                    {new Date(report.createdAt).toLocaleDateString()}
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
                <Badge status={report.status} />
            </td>
        </tr>
    );
}

export default ReportRow;