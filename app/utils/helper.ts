import { Details, Transport } from '../interfaces/DetailsInterface';
import { config } from '../config';

export function getFileUrlByExpenseId(piecesJointes: any[], expenseId: string): string | undefined {
    if (!piecesJointes || piecesJointes.length === 0) {
        return undefined;
    }
    return piecesJointes.find(att => att.expenseId === expenseId)?.fileUrl;
}


// Les montants viennent du JSON saisi par l'adhérent : on ne fait pas confiance à leur type.
const toAmount = (value: unknown): number => {
    const amount = Number(value);
    return Number.isFinite(amount) ? amount : 0;
};

const asList = <T,>(value: T[] | unknown): T[] => (Array.isArray(value) ? value : []);

export const formatEuro = (amount: number) => `${toAmount(amount).toFixed(2)} €`;

function calculateTransportTotal(transport: Transport): number {
    switch (transport.type) {
        case "PERSONAL_VEHICLE":
            const distance = toAmount(transport.distance);
            const tollFee = toAmount(transport.tollFee);
            return (distance * config.TAUX_KILOMETRIQUE_VOITURE) + 
                   (tollFee / config.DIVISION_PEAGE);

        case "CLUB_MINIBUS":
            const clubDistance = toAmount(transport.distance);
            const clubFuel = toAmount(transport.fuelExpense);
            const clubToll = toAmount(transport.tollFee);
            const clubPassengers = toAmount(transport.passengerCount);
            if (clubPassengers <= 0) return 0;
            
            const clubTotal = (clubDistance * config.TAUX_KILOMETRIQUE_MINIBUS) + 
                            clubFuel + clubToll;
            return clubTotal / clubPassengers;

        case "RENTAL_MINIBUS":
            const rental = toAmount(transport.rentalPrice);
            const rentalFuel = toAmount(transport.fuelExpense);
            const rentalToll = toAmount(transport.tollFee);
            const passengers = toAmount(transport.passengerCount);
            if (passengers <= 0) return 0;
            
            return (rental + rentalFuel + rentalToll) / passengers;

        case "PUBLIC_TRANSPORT":
            return toAmount(transport.ticketPrice);

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
        try {
            details = JSON.parse(details);
        } catch {
            return {
                transportTotal: 0,
                accommodationsTotal: 0,
                othersTotal: 0,
                totalRemboursable: 0,
                accommodationsRemboursable: 0
            };
        }
    }

    const transportTotal = details.transport ? calculateTransportTotal(details.transport) : 0;
    const accommodations = asList<{ price?: number }>(details.accommodations);
    const others = asList<{ price?: number }>(details.others);

    const accommodationsTotal = accommodations.reduce((total, acc) => 
        total + toAmount(acc.price), 0);

    const accommodationsRemboursable = accommodations.reduce((total, acc) => 
        total + Math.min(toAmount(acc.price), config.NUITEE_MAX_REMBOURSABLE), 0);

    const othersTotal = others.reduce((total, other) => 
        total + toAmount(other.price), 0);

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