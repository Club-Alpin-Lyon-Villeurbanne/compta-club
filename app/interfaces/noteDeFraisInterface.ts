import {Details} from "@/app/interfaces/DetailsInterface";
import ExpenseStatus from "../enums/ExpenseStatus";

export interface PaginationMeta {
    page: number;
    perPage: number;
    total: number;
    pages: number;
}

export interface PaginatedResponse<T> {
    data: T[];
    meta: PaginationMeta;
}

export interface PieceJointe {
    id: number
    expenseId: string
    fileUrl: string
}

// « autre » est un achat.
export type ExpenseReportType = 'sortie' | 'formation' | 'autre'

interface BaseExpenseReport {
    id: number
    status: ExpenseStatus
    refundRequired: boolean
    utilisateur: User
    dateCreation: string
    commentaireStatut: string | null
    piecesJointes: PieceJointe[]
}

export interface EventExpenseReport extends BaseExpenseReport {
    // Absent tant que la plateforme ne sert pas de notes hors sortie.
    type?: 'sortie'
    sortie: Event
    details: Details
}

export interface NonEventExpenseReport extends BaseExpenseReport {
    type: 'formation' | 'autre'
    sortie: null
    commission: Commission
    objet: string
    dateDepense: string
    lienFormation: string | null
    motPourResponsable: string | null
    // Lignes saisies sur le site, en chaîne JSON : compta-club lit lignesAffichees.
    details: string
    // Figés par la plateforme à l'envoi de la note.
    totalDeclare: number
    totalRemboursable: number
    lignesAffichees: LigneAffichee[]
    avertissements: string[]
    dateEnvoi: string | null
    valideurs: User[]
    derniereDecision: DerniereDecision | null
    validationResponsable: ValidationResponsable | null
    libelleComptable: string | null
}

export type ExpenseReport = EventExpenseReport | NonEventExpenseReport

export interface LigneAffichee {
    id: string
    nature: string | null
    libelle: string
    detail: string | null
    montant: number
}

export interface Auteur {
    prenom: string
    nom: string
}

export interface ValidationResponsable {
    auteur: Auteur
    date: string
}

export interface DerniereDecision {
    statut: 'preapproved' | 'approved' | 'rejected'
    niveau: 'responsable' | 'tresorerie' | null
    auteur: Auteur
    date: string
    message: string | null
}

export interface User {
    id: number
    prenom: string
    nom: string
}

export interface Commission {
    id: number
    title: string
    code?: string
}

export interface Event {
    id: number
    commission: Commission
    heureRendezVous: string
    heureRetour: string
    titre: string
    code: string
    lieuRendezVous: string
    participationsCount: number
    status: number
    statusLegal: number
}
