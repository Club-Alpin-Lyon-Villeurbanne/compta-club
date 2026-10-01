import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, waitFor, act } from '@testing-library/react';
import useStore from '@/app/store/useStore';
import { mockExpenseReports } from '@/tests/mocks/fixtures';

// Mock fetchClient to intercept API calls without hitting the network
vi.mock('@/app/lib/fetchClient', () => ({
  get: vi.fn(),
}));

import { get } from '@/app/lib/fetchClient';
import { useExpenseReports } from '@/app/hooks/useExpenseReports';

const mockedGet = vi.mocked(get);

const paginatedResponse = {
  data: mockExpenseReports.slice(0, 2),
  meta: { page: 1, perPage: 10, total: 2, pages: 1 },
};

describe('useExpenseReports', () => {
  beforeEach(() => {
    mockedGet.mockClear();
    mockedGet.mockResolvedValue(paginatedResponse);
    act(() => {
      useStore.setState({
        expenseReports: [],
        paginationMeta: null,
        isLoading: false,
        status: 'submitted',
        itemsPerPage: 10,
        currentPage: 1,
        searchTerm: '',
        dateFilter: '',
        requesterFilter: '',
        typeFilter: '',
      });
    });
  });

  function lastCalledUrl(): string {
    const calls = mockedGet.mock.calls;
    return calls[calls.length - 1][0] as string;
  }

  function lastCalledParams(): URLSearchParams {
    return new URLSearchParams(lastCalledUrl().split('?')[1]);
  }

  it('sends itemsPerPage from store', async () => {
    act(() => useStore.getState().setItemsPerPage(25));
    renderHook(() => useExpenseReports());

    await waitFor(() => expect(mockedGet).toHaveBeenCalled());
    expect(lastCalledParams().get('itemsPerPage')).toBe('25');
  });

  it('sends default itemsPerPage of 10', async () => {
    renderHook(() => useExpenseReports());

    await waitFor(() => expect(mockedGet).toHaveBeenCalled());
    expect(lastCalledParams().get('itemsPerPage')).toBe('10');
  });

  it('sends status filter', async () => {
    act(() => useStore.getState().setStatus('approved'));
    renderHook(() => useExpenseReports());

    await waitFor(() => expect(mockedGet).toHaveBeenCalled());
    expect(lastCalledParams().get('status')).toBe('approved');
  });

  it('omits status param when "Toutes"', async () => {
    act(() => useStore.getState().setStatus('Toutes'));
    renderHook(() => useExpenseReports());

    await waitFor(() => expect(mockedGet).toHaveBeenCalled());
    expect(lastCalledParams().has('status')).toBe(false);
  });

  it('sends refundRequired=false for don filter', async () => {
    act(() => useStore.getState().setTypeFilter('don'));
    renderHook(() => useExpenseReports());

    await waitFor(() => expect(mockedGet).toHaveBeenCalled());
    expect(lastCalledParams().get('refundRequired')).toBe('false');
  });

  it('sends refundRequired=true for remboursement filter', async () => {
    act(() => useStore.getState().setTypeFilter('remboursement'));
    renderHook(() => useExpenseReports());

    await waitFor(() => expect(mockedGet).toHaveBeenCalled());
    expect(lastCalledParams().get('refundRequired')).toBe('true');
  });

  it('sends date range params for dateFilter', async () => {
    act(() => useStore.getState().setDateFilter('2025-06-15'));
    renderHook(() => useExpenseReports());

    await waitFor(() => expect(mockedGet).toHaveBeenCalled());
    const params = lastCalledParams();
    expect(params.get('event.startDate[after]')).toBe('2025-06-15T00:00:00');
    expect(params.get('event.startDate[before]')).toBe('2025-06-15T23:59:59');
  });

  it('stores fetched reports and pagination meta', async () => {
    renderHook(() => useExpenseReports());

    await waitFor(() => {
      expect(useStore.getState().expenseReports).toEqual(paginatedResponse.data);
      expect(useStore.getState().paginationMeta).toEqual(paginatedResponse.meta);
    });
  });

  it('sets error on fetch failure', async () => {
    mockedGet.mockRejectedValueOnce(new Error('Network error'));
    const { result } = renderHook(() => useExpenseReports());

    await waitFor(() => {
      expect(result.current.error).toBe('Network error');
    });
  });
});
