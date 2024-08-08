import {create} from 'zustand';
import {ExpenseReport} from "@/app/interfaces/noteDeFraisInterface";

interface StoreState {
    expenseReports: ExpenseReport[];
    status: string;
    itemsPerPage: number;
    currentPage: number;
    searchTerm: string;
    setExpenseReports: (reports: ExpenseReport[]) => void;
    setStatus: (status: string) => void;
    setItemsPerPage: (items: number) => void;
    setCurrentPage: (page: number) => void;
    setSearchTerm: (term: string) => void;
}

const useStore = create<StoreState>((set) => ({
    expenseReports: [],
    status: 'Toutes',
    itemsPerPage: 5,
    currentPage: 1,
    setExpenseReports: (reports) => set({ expenseReports: reports }),
    setStatus: (status) => set({ status }),
    setItemsPerPage: (items) => set({ itemsPerPage: items }),
    setCurrentPage: (page) => set({ currentPage: page }),
    searchTerm: '',
    setSearchTerm: (term) => set({ searchTerm: term }),
}));

export default useStore;
