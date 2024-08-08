import {User} from "@/app/interfaces/UserInterface";

export interface ExpenseReport {
    id: number
    status: string
    statusComment: string
    refundRequired: boolean
    user: User
    event: Event
    participations: Participation[]
    createdAt: string
    updatedAt: string
    expenseGroups: ExpenseGroups
}
export interface Participation {
    id: number
    evt: number
    user: number
    role: string
    status: number
    isCovoiturage: any
}

export interface Event {
    id: number
    user: number
    titre: string
    code: string
    tsp: string
    tspEnd: string
    place: string
    rdv: string
    lat: string
    long: string
    description: string
    joinStart: number
    joinMax: number
    ngensMax: number
    commission: number
    participations: Participations
    articles: Articles
    cycleChildren: CycleChildren
    tspCrea: string
}

interface Articles {
}

interface CycleChildren {
}


export interface Participations {
}

export interface ExpenseGroups {
}