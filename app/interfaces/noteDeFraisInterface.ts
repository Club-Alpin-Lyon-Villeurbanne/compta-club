import {Details} from "@/app/interfaces/DetailsInterface";
import ExpenseStatus from "../enums/ExpenseStatus";

export interface ExpenseReport {
    id: number
    status: ExpenseStatus
    refundRequired: boolean
    utilisateur: User
    sortie: Event
    dateCreation: string
    commentaireStatut: any
    details: Details
    piecesJointes: any[]
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


