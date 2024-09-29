import Link from 'next/link';
import { ExpenseReport } from "@/app/interfaces/noteDeFraisInterface";
import React, { useState } from "react";
import Image from 'next/image';
import { Badge } from './Badge';
import { config } from '@/app/config';

interface ReportRowProps {
    report: ExpenseReport;
}

const ReportRow: React.FC<ReportRowProps> = ({ report }) => {

    const [imgSrc, setImgSrc] = useState(`https://www.clubalpinlyon.fr/ftp/commission/${report.event.commission.id}/picto-dark.png`);
    return (
        <tr key={report.id}>

            <td className="px-1 py-1 text-sm bg-white border-b border-gray-200">
                <Image
                    src={imgSrc}
                    alt=""
                    className="float-left x-left-10"
                    width={35}
                    height={35}
                    style={{ width: 35, height: 35 }}
                    onError={() => {
                        setImgSrc(config.DEFAULT_COMMISSION_ICON);
                    }}
                />
            </td>
            <td className="px-5 py-5 text-sm bg-white border-b border-gray-200">
                <p className="text-gray-900 whitespace-no-wrap">
                    <Link href={`/note-de-frais/${report.event.id}`}>{report.event.titre}</Link>
                </p>
            </td>
            <td className="px-5 py-5 text-sm bg-white border-b border-gray-200">
                <p className="text-gray-900 whitespace-no-wrap">
                    {new Date(report.createdAt).toLocaleDateString()}
                </p>
            </td>
            <td className="px-5 py-5 text-sm bg-white border-b border-gray-200">
                <Badge status={report.status} />
            </td>
        </tr>
    );
}

export default ReportRow;
