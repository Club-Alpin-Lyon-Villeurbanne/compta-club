import Link from 'next/link';
import {ExpenseReport} from "@/app/interfaces/noteDeFraisInterface";
import React from "react";
import {ExpenseStatus, getExpenseStatusTranslation} from "@/app/enums/ExpenseStatus";

interface ReportRowProps {
    report: ExpenseReport;
}

const ReportRow: React.FC<ReportRowProps> = ({report}) => (
    <tr key={report.id}>
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
          <span
              className={`relative inline-block px-3 py-1 font-semibold leading-tight text-${report.status === 'approved' ? 'lime' : report.status === 'rejected' ? 'rose' : 'yellow'}-900`}>
            <span aria-hidden
                  className={`absolute inset-0 bg-${report.status === 'approved' ? 'lime' : report.status === 'rejected' ? 'rose' : 'yellow'}-200 rounded-full opacity-50`}></span>
            <span className="relative">{
                getExpenseStatusTranslation(report.status as ExpenseStatus)
            }</span>
          </span>
        </td>
    </tr>
);

export default ReportRow;
