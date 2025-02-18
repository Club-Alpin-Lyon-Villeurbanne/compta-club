import React from 'react';
import { Transport } from "@/app/interfaces/DetailsInterface";
import { getFileUrlByExpenseId } from '@/app/utils/helper';
import { FaRoad, FaGasPump, FaCar, FaTicketAlt, FaUsers, FaRoute, FaBus, FaTrain } from 'react-icons/fa';
import { Justificatif } from '../Justificatif';
import { config } from '@/app/config';

interface TransportTableProps {
    transport: Transport;
    attachments: any[];
}

const TransportTable: React.FC<TransportTableProps> = ({ transport, attachments }) => {
    const getTransportInfo = (type: string) => {
        switch (type) {
            case "RENTAL_MINIBUS":
                return { label: "Location de minibus", icon: <FaBus className="text-yellow-500" /> };
            case "PUBLIC_TRANSPORT":
                return { label: "Transport en commun", icon: <FaTrain className="text-blue-500" /> };
            case "CLUB_MINIBUS":
                return { label: "Minibus du club", icon: <FaBus className="text-green-500" /> };
            case "PERSONAL_VEHICLE":
                return { label: "Véhicule personnel", icon: <FaCar className="text-red-500" /> };
            default:
                return { label: "Type de transport inconnu", icon: <FaCar className="text-gray-500" /> };
        }
    }

    const transportInfo = getTransportInfo(transport.type);

    const ExpenseCard = ({ icon, title, amount, justificatif }) => (
        <div className="p-4 bg-white border border-gray-200 rounded-lg shadow-sm">
            <div className="flex items-center mb-2">
                {icon}
                <h4 className="ml-2 font-semibold text-gray-700">{title}</h4>
            </div>
            <div className="flex items-center justify-between">
                <span className="text-lg font-bold text-gray-900">{amount}€</span>
                <Justificatif fileUrl={justificatif} />
            </div>
        </div>
    );

    return (
        <div>
            <div className="p-4 mb-4 rounded-lg bg-blue-50">
                <h3 className="flex items-center mb-2 text-lg font-semibold text-blue-700">
                    {transportInfo.icon}
                    <span className="ml-2">{transportInfo.label}</span>
                </h3>
                {transport.distance && (
                    <p className="flex items-center text-sm text-gray-600">
                        <FaRoute className="mr-2" /> Distance parcourue : {transport.distance} km
                    </p>
                )}
                {transport.passengerCount && (
                    <p className="flex items-center mt-1 text-sm text-gray-600">
                        <FaUsers className="mr-2" /> Nombre de passagers : {transport.passengerCount}
                    </p>
                )}
            </div>

            <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
                {transport.tollFee && (
                    <ExpenseCard 
                        icon={<FaRoad className="text-blue-500" />}
                        title={transport.type === 'PERSONAL_VEHICLE' ? `Péage (sera divisé par ${config.DIVISION_PEAGE})` : 'Péage'}
                        amount={transport.tollFee}
                        justificatif={getFileUrlByExpenseId(attachments, 'tollFee')}
                    />
                )}
                {transport.fuelExpense && (
                    <ExpenseCard 
                        icon={<FaGasPump className="text-green-500" />}
                        title="Carburant"
                        amount={transport.fuelExpense}
                        justificatif={getFileUrlByExpenseId(attachments, 'fuelExpense')}
                    />
                )}
                {transport.rentalPrice && (
                    <ExpenseCard 
                        icon={<FaBus className="text-yellow-500" />}
                        title="Prix de location"
                        amount={transport.rentalPrice}
                        justificatif={getFileUrlByExpenseId(attachments, 'rentalPrice')}
                    />
                )}
                {transport.ticketPrice && (
                    <ExpenseCard 
                        icon={<FaTicketAlt className="text-purple-500" />}
                        title="Prix du billet"
                        amount={transport.ticketPrice}
                        justificatif={getFileUrlByExpenseId(attachments, 'ticketPrice')}
                    />
                )}
                {transport.distance && (
                    <ExpenseCard 
                        icon={<FaRoute className="text-indigo-500" />}
                        title={`Indemnités kilométriques (${
                            transport.type === 'PERSONAL_VEHICLE' 
                                ? config.TAUX_KILOMETRIQUE_VOITURE 
                                : config.TAUX_KILOMETRIQUE_MINIBUS
                        }€/km)`}
                        amount={(
                            transport.distance * (
                                transport.type === 'PERSONAL_VEHICLE'
                                    ? config.TAUX_KILOMETRIQUE_VOITURE
                                    : config.TAUX_KILOMETRIQUE_MINIBUS
                            )
                        ).toFixed(2)}
                        justificatif={null}
                    />
                )}
            </div>
        </div>
    );
};

export default TransportTable;