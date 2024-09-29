import React from 'react';
import { Transport } from "@/app/interfaces/DetailsInterface";
import { getFileUrlByExpenseId } from '@/app/utils/helper';
import { FaFileAlt } from 'react-icons/fa';
import { Justificatif } from '../Justificatif';
import { config } from '@/app/config';

interface TransportTableProps {
    transport: Transport;
    attachments: any[];
}

const TransportTable: React.FC<TransportTableProps> = ({ transport, attachments }) => {
    const transportType = (type: string) => {
        switch (type) {
            case "RENTAL_MINIBUS":
                return "Location de minibus";
            case "PUBLIC_TRANSPORT":
                return "Transport en commun";
            case "CLUB_MINIBUS":
                return "Minibus du club";
            case "PERSONAL_VEHICLE":
                return "Véhicule personnel";
            default:
                return "Type de transport inconnu";
        }
    }

    const renderTransportRows = () => {
        const tollFeeJustificatif = getFileUrlByExpenseId(attachments, 'tollFee');
        const fuelExpenseJustificatif = getFileUrlByExpenseId(attachments, 'fuelExpense');
        const rentalPriceJustificatif = getFileUrlByExpenseId(attachments, 'rentalPrice');
        const ticketPriceJustificatif = getFileUrlByExpenseId(attachments, 'ticketPrice');
        switch (transport.type) {
            case "RENTAL_MINIBUS":
                return (
                    <>
                        <tr>
                            <td className="px-6 py-4 whitespace-nowrap">Péage</td>
                            <td className="px-6 py-4 text-right">{transport.tollFee}€</td>
                            <td className="px-6 py-4 text-right"><Justificatif fileUrl={tollFeeJustificatif}/></td>
                        </tr>
                        <tr>
                            <td className="px-6 py-4 whitespace-nowrap">Carburant</td>
                            <td className="px-6 py-4 text-right">{transport.fuelExpense}€</td>
                            <td className="px-6 py-4 text-right"><Justificatif fileUrl={fuelExpenseJustificatif}/></td>
                        </tr>
                        <tr>
                            <td className="px-6 py-4 whitespace-nowrap">Prix de location</td>
                            <td className="px-6 py-4 text-right">{transport.rentalPrice}€</td>
                            <td className="px-6 py-4 text-right"><Justificatif fileUrl={rentalPriceJustificatif}/></td>
                        </tr>
                    </>
                );
            case "PUBLIC_TRANSPORT":
                return (
                    <tr>
                        <td className="px-6 py-4 whitespace-nowrap">Prix du billet</td>
                        <td className="px-6 py-4 text-right">{transport.ticketPrice}€</td>
                        <td className="px-6 py-4 text-right"><Justificatif fileUrl={ticketPriceJustificatif}/></td>
                    </tr>
                );
            case "CLUB_MINIBUS":
                return (
                    <>
                        <tr>
                            <td className="px-6 py-4 whitespace-nowrap">Péage</td>
                            <td className="px-6 py-4 text-right">{transport.tollFee}€</td>
                            <td className="px-6 py-4 text-right"><Justificatif fileUrl={tollFeeJustificatif}/></td>
                        </tr>
                        <tr>
                            <td className="px-6 py-4 whitespace-nowrap">Carburant</td>
                            <td className="px-6 py-4 text-right">{transport.fuelExpense}€</td>
                            <td className="px-6 py-4 text-right"><Justificatif fileUrl={fuelExpenseJustificatif}/></td>
                        </tr>
                    </>
                );
            case "PERSONAL_VEHICLE":
                return (
                    <>
                    <tr>
                        <td className="px-6 py-4 whitespace-nowrap">Péage</td>
                        <td className="px-6 py-4 text-right">{transport.tollFee}€</td>
                        <td className="px-6 py-4 text-right"><Justificatif fileUrl={tollFeeJustificatif}/></td>
                    </tr>
                    <tr>
                        <td className="px-6 py-4 whitespace-nowrap">Distance</td>
                        <td className="px-6 py-4 text-right">{(transport.distance || 0) * config.TAUX_KILOMETRIQUE_VOITURE}€ ({transport.distance} km x {config.TAUX_KILOMETRIQUE_VOITURE}€)</td>
                        <td className="px-6 py-4 text-right"><Justificatif fileUrl={tollFeeJustificatif}/></td>
                    </tr>
                    </>
                );
            default:
                return (
                    <tr>
                        <td className="px-6 py-4 text-center" colSpan={2}>
                            Aucune dépense disponible pour ce type de transport
                        </td>
                    </tr>
                );
        }
    };

    return (
        <div className="mb-8">
            <h3 className="text-xl font-semibold text-green-700 mb-3">Transport - {transportType(transport.type)}</h3>
            <div className="flex justify-evenly">
                {transport.distance && (
                    <p className="text-gray-600 mb-4">Distance parcourue : {transport.distance} km</p>
                )}
                {transport.passengerCount && (
                    <p className="text-gray-600 mb-4">Nombre de passagers : {transport.passengerCount}</p>
                )}
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
                        <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Justificatif
                        </th>
                    </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                    {renderTransportRows()}
                </tbody>
            </table>
        </div>
    );
};

export default TransportTable;
