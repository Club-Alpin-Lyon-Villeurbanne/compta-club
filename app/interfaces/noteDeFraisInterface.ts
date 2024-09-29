import {Details} from "@/app/interfaces/DetailsInterface";
import ExpenseStatus from "../enums/ExpenseStatus";

export interface ExpenseReport {
    id: number
    status: ExpenseStatus
    refundRequired: boolean
    user: User
    event: Event
    createdAt: string
    statusComment: any
    details: Details
    attachments: any[]
}

export interface User {
    id: number
    firstname: string
    lastname: string
}

export interface Commission {
    id: number
    name: string
}

export interface Event {
    id: number
    commission: Commission
    tsp: string
    tspEnd: string
    titre: string
    code: string
    rdv: string
}


