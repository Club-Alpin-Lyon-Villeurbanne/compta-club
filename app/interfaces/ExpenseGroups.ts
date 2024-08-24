interface FieldType {
    id: number
    name: string
    slug: string
    inputType: string
    fieldTypeId: number
    flags: any[]
}

interface ExpenseType {
    id: number
    name: string
    slug: string
    fieldTypes: FieldType[]
}

export interface Field {
    id: number
    justificationDocument?: string
    value: string
    expense: number
    fieldType: number
    inputType: string
    createdAt: string
    updatedAt: string
}

interface Transport {
    id: number
    expenseType: ExpenseType
    fields: Field[]
}

export interface Transports {
    "0": Transport
    selectedType: string
}

export interface Hebergement {
    id: number
    expenseType: ExpenseType
    fields: Field[]
}

export interface Autre {
    id: number
    expenseType: ExpenseType
    fields: Field[]
}

export interface ExpenseGroups {
    transport: Transports
    hebergement: Hebergement[]
    autres: Autre[]
}