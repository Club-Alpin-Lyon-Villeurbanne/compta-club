import { Details } from '../interfaces/DetailsInterface';
import { config } from '../config';

export function getFileUrlByExpenseId(attachments: any[], expenseId: string): string | undefined {
    if (!attachments || attachments.length === 0) {
        return undefined;
    }
    return attachments.find(att => att.expenseId === expenseId)?.fileUrl;
}


export const formatEuro = (amount: number) => `${amount?.toFixed(2)} €`;

// Calcul le total pour chaque catégorie de dépenses
export function calculateTotals(details: Details) {
    if (details === null) {
        return {
            transportTotal: 0,
            accommodationsTotal: 0,
            othersTotal: 0,
            totalRemboursable: 0,
            accommodationsRemboursable: 0
        };
    }
    let transportTotal: number;

    // Calcul le total de transport selon le type de transport TODO: A modifier si on ajoute un nouveau type de transport
    switch (details.transport.type) {
        case "RENTAL_MINIBUS":
            transportTotal = ((details.transport.tollFee || 0) +
                (details.transport.fuelExpense || 0) +
                (details.transport.rentalPrice || 0)) / (details.transport?.passengerCount || 1);
            break;
        case "PUBLIC_TRANSPORT":
            transportTotal = (details.transport.ticketPrice || 0);
            break;
        case "CLUB_MINIBUS":
            transportTotal = (details.transport.tollFee || 0) +
                (details.transport.fuelExpense || 0);
            break;
        case "PERSONAL_VEHICLE":
            transportTotal = (details.transport.tollFee || 0) +
            (details.transport.distance || 0) * config.TAUX_KILOMETRIQUE_VOITURE;
            break;
        default:
            transportTotal = 0;
    }

    // Calcul les totaux d'hébergement et autres dépenses
    const accommodationsTotal = details.accommodations.reduce((total, acc) => total + acc.price, 0);
    const othersTotal = details.others.reduce((total, other) => total + other.price, 0);

    // Calcul le montant remboursable pour les hébergements (max 60€/nuitée)
    const accommodationsRemboursable = details.accommodations.reduce((total, acc) => total + Math.min(acc.price, config.NUITEE_MAX_REMBOURSABLE), 0);

    // Calcul le total remboursable (transport + hébergement + autres)
    const totalRemboursable = transportTotal + accommodationsRemboursable + othersTotal;

    return {
        transportTotal,
        accommodationsTotal,
        othersTotal,
        totalRemboursable,
        accommodationsRemboursable
    };
};