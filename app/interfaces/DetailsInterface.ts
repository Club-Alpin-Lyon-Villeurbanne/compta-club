export interface Details {
    transport: Transport
    accommodations: Accommodation[]
    others: Other[]
}

export interface Transport {
    type: string
    tollFee?: number
    distance?: number
    passengerCount?: number
    fuelExpense?: number
    ticketPrice?: number
    rentalPrice?: number
}

export interface Accommodation {
    expenseId: string
    price: number
    comment: string
}

export interface Other {
    expenseId: string
    price: number
    comment: string
}
