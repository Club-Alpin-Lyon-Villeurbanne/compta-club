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
    name: string
}

export interface Event {
    id: number
    commission: Commission
    dateDebut: string
    dateFin: string
    titre: string
    code: string
    lieuRendezVous: string
    participationsCount: number
    status: number
    statusLegal: number
}


