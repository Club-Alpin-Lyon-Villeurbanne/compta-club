import { Details, Transport } from '../interfaces/DetailsInterface';
import { config } from '../config';

export function getFileUrlByExpenseId(piecesJointes: any[], expenseId: string): string | undefined {
    if (!piecesJointes || piecesJointes.length === 0) {
        return undefined;
    }
    return piecesJointes.find(att => att.expenseId === expenseId)?.fileUrl;
}


export const formatEuro = (amount: number) => `${amount?.toFixed(2)} €`;

function calculateTransportTotal(transport: Transport): number {
    switch (transport.type) {
        case "PERSONAL_VEHICLE":
            const distance = transport.distance ?? 0;
            const tollFee = transport.tollFee ?? 0;
            return (distance * config.TAUX_KILOMETRIQUE_VOITURE) + 
                   (tollFee / config.DIVISION_PEAGE);

        case "CLUB_MINIBUS":
            const clubDistance = transport.distance ?? 0;
            const clubFuel = transport.fuelExpense ?? 0;
            const clubToll = transport.tollFee ?? 0;
            const clubPassengers = transport.passengerCount ?? 0;
            if (clubPassengers <= 0) return 0;
            
            const clubTotal = (clubDistance * config.TAUX_KILOMETRIQUE_MINIBUS) + 
                            clubFuel + clubToll;
            return clubTotal / clubPassengers;

        case "RENTAL_MINIBUS":
            const rental = transport.rentalPrice ?? 0;
            const rentalFuel = transport.fuelExpense ?? 0;
            const rentalToll = transport.tollFee ?? 0;
            const passengers = transport.passengerCount ?? 0;
            if (passengers <= 0) return 0;
            
            return (rental + rentalFuel + rentalToll) / passengers;

        case "PUBLIC_TRANSPORT":
            return transport.ticketPrice ?? 0;

        default:
            return 0;
    }
}

export function calculateTotals(details: Details) {
    if (!details) {
        return {
            transportTotal: 0,
            accommodationsTotal: 0,
            othersTotal: 0,
            totalRemboursable: 0,
            accommodationsRemboursable: 0
        };
    }

    if (typeof details === 'string') {
        details = JSON.parse(details);
    }

    const transportTotal = calculateTransportTotal(details.transport);

    const accommodationsTotal = details.accommodations.reduce((total, acc) => 
        total + (acc.price ?? 0), 0);

    const accommodationsRemboursable = details.accommodations.reduce((total, acc) => 
        total + Math.min(acc.price ?? 0, config.NUITEE_MAX_REMBOURSABLE), 0);

    const othersTotal = details.others.reduce((total, other) => 
        total + (other.price ?? 0), 0);

    const totalRemboursable = transportTotal + accommodationsRemboursable + othersTotal;

    return {
        transportTotal,
        accommodationsTotal,
        othersTotal,
        totalRemboursable,
        accommodationsRemboursable
    };
}

export const truncateText = (text: string, maxLength: number = 30): string => {
  if (!text) return '';
  return text.length > maxLength ? `${text.substring(0, maxLength)}...` : text;
};