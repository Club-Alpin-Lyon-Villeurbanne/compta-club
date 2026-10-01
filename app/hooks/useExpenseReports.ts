import { useEffect, useRef, useState, useCallback } from "react";
import useStore from "@/app/store/useStore";
import { PaginatedResponse, ExpenseReport } from "@/app/interfaces/noteDeFraisInterface";
import { get } from "@/app/lib/fetchClient";

function useDebounce<T>(value: T, delay: number): T {
    const [debounced, setDebounced] = useState(value);
    useEffect(() => {
        const timer = setTimeout(() => setDebounced(value), delay);
        return () => clearTimeout(timer);
    }, [value, delay]);
    return debounced;
}

export function useExpenseReports() {
    const [error, setError] = useState<string | null>(null);

    const status = useStore((state) => state.status);
    const searchTerm = useStore((state) => state.searchTerm);
    const dateFilter = useStore((state) => state.dateFilter);
    const requesterFilter = useStore((state) => state.requesterFilter);
    const typeFilter = useStore((state) => state.typeFilter);
    const currentPage = useStore((state) => state.currentPage);
    const itemsPerPage = useStore((state) => state.itemsPerPage);
    const setExpenseReports = useStore((state) => state.setExpenseReports);
    const setPaginationMeta = useStore((state) => state.setPaginationMeta);
    const setIsLoading = useStore((state) => state.setIsLoading);

    const debouncedSearch = useDebounce(searchTerm, 400);
    const debouncedRequester = useDebounce(requesterFilter, 400);

    const abortControllerRef = useRef<AbortController | null>(null);

    const fetchReports = useCallback(async () => {
        abortControllerRef.current?.abort();
        abortControllerRef.current = new AbortController();
        const signal = abortControllerRef.current.signal;

        setIsLoading(true);
        setError(null);

        try {
            const params = new URLSearchParams();
            params.set('page', String(currentPage));
            params.set('itemsPerPage', String(itemsPerPage));

            if (status !== 'Toutes') {
                params.set('status', status);
            }
            if (debouncedSearch) {
                params.set('event.titre', debouncedSearch);
            }
            if (debouncedRequester) {
                params.set('user.lastname', debouncedRequester);
            }
            if (dateFilter) {
                params.set('event.startDate[after]', `${dateFilter}T00:00:00`);
                params.set('event.startDate[before]', `${dateFilter}T23:59:59`);
            }
            if (typeFilter === 'don') {
                params.set('refundRequired', 'false');
            } else if (typeFilter === 'remboursement') {
                params.set('refundRequired', 'true');
            }

            const response = await get<PaginatedResponse<ExpenseReport>>(
                `/api/expense-reports?${params.toString()}`,
                { signal }
            );

            setExpenseReports(response.data);
            setPaginationMeta(response.meta);
        } catch (err: any) {
            if (err?.name === 'AbortError') return;
            setError(err?.message || 'Une erreur est survenue lors de la récupération des données.');
            setExpenseReports([]);
        } finally {
            if (!signal.aborted) {
                setIsLoading(false);
            }
        }
    }, [currentPage, itemsPerPage, status, debouncedSearch, dateFilter, debouncedRequester, typeFilter, setExpenseReports, setPaginationMeta, setIsLoading]);

    useEffect(() => {
        fetchReports();
        return () => abortControllerRef.current?.abort();
    }, [fetchReports]);

    return { error };
}
