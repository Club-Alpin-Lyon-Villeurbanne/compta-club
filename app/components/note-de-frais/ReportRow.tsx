import Link from 'next/link';
import { ExpenseReport } from "@/app/interfaces/noteDeFraisInterface";
import React, { useState } from "react";
import Image from 'next/image';
import { Badge } from './Badge';
import { config } from '@/app/config';
import { FaUser, FaCalendarAlt, FaClipboardList, FaGift, FaMoneyBillWave } from 'react-icons/fa';

interface ReportRowProps {
    report: ExpenseReport;
}

const ReportRow: React.FC<ReportRowProps> = ({ report }) => {
    const [imgSrc, setImgSrc] = useState(`https://www.clubalpinlyon.fr/ftp/commission/${report.event.commission.id}/picto-dark.png`);

    return (
        <tr key={report.id}>
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
                <p className="text-gray-900 whitespace-nowrap truncate">
                    <FaClipboardList className="inline-block mr-1 text-gray-500" />
                    <Link href={`/note-de-frais/${report.event.id}`} className="hover:underline">
                        {report.event.titre}
                    </Link>
                </p>
            </td>
            <td className="w-1/6 px-2 py-2 text-sm bg-white border-b border-gray-200">
                <p className="text-gray-900 whitespace-nowrap truncate">
                    <FaUser className="inline-block mr-1 text-gray-500" />
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
            <td className="w-28 px-2 py-2 text-sm bg-white border-b border-gray-200 text-center">
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
            <td className="w-24 px-2 py-2 text-sm bg-white border-b border-gray-200 text-center">
                <Badge status={report.status} />
            </td>
        </tr>
    );
}

export default ReportRow;