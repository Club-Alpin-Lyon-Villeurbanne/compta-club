import React from 'react';
import {Transports} from "@/app/interfaces/ExpenseGroups";
import {FaFileAlt} from "react-icons/fa";

interface TransportTableProps {
    transport: Transports;
}

const TransportTable: React.FC<TransportTableProps> = ({transport}) => {
    const transportData = transport["0"];
    const distance = transportData.fields.find(f => f.fieldType === 1);
    const nbPassagers = transportData.fields.find(f => f.fieldType === 5);
    // const justificationField = transportData.fields.find(f => f.justificationDocument);
    // console.log(justificationField);
    return (
        <div className="mb-8">
            <h3 className="text-xl font-semibold text-green-700 mb-3">Transport - {transportData.expenseType.name}</h3>
            <div className={'flex justify-evenly'}>
                <p className="text-gray-600 mb-4">Distance parcourue : {distance?.value} km</p>
                <p className="text-gray-600 mb-4">Nombre de passagers : {nbPassagers?.value}</p>
            </div>
            <table className="min-w-full bg-white border border-gray-200 rounded-lg">
                <thead className="bg-green-100">
                <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Type de dépense
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Montant (en Euros)
                    </th>
                    <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Justificatif
                    </th>
                </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                {
                    transportData.fields.map(item => {
                        const fieldType = transportData.expenseType.fieldTypes.find(ft => ft.id === item.fieldType);
                        const justificationField = transportData.fields.find(f => f.justificationDocument);
                        console.log(justificationField);
                        if (item.fieldType === 1 || item.fieldType === 5) return null;

                        return (
                            <tr key={item.id}>
                                <td className="px-6 py-4 whitespace-nowrap">{fieldType?.name}</td>
                                <td className="px-6 py-4 text-right">{item.value}€</td>
                                <td className="px-6 py-4 text-center">
                                    {justificationField?.justificationDocument ? (
                                        <a href={'https://www.clubalpinlyon.fr' + justificationField.justificationDocument}
                                           target="_blank" rel="noopener noreferrer"
                                           className="text-blue-500 hover:text-blue-700">
                                            <FaFileAlt className="inline-block w-5 h-5"/>
                                        </a>
                                    ) : (
                                        "N/A"
                                    )}
                                </td>
                            </tr>
                        )
                    })
                }
                </tbody>
            </table>
        </div>
    );
};

export default TransportTable;
