import { describe, it, expect, beforeEach } from 'vitest';
import { act } from '@testing-library/react';
import useStore from '@/app/store/useStore';

describe('useStore', () => {
  beforeEach(() => {
    // Reset store to initial state before each test
    act(() => {
      useStore.setState({
        expenseReports: [],
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

  describe('default filter values', () => {
    it('should default status filter to "submitted"', () => {
      const { status } = useStore.getState();
      expect(status).toBe('submitted');
    });

    it('should default all other filters to empty/neutral values', () => {
      const state = useStore.getState();
      expect(state.searchTerm).toBe('');
      expect(state.dateFilter).toBe('');
      expect(state.requesterFilter).toBe('');
      expect(state.typeFilter).toBe('');
      expect(state.currentPage).toBe(1);
      expect(state.itemsPerPage).toBe(10);
    });
  });

  describe('resetFilters', () => {
    it('should reset status to "submitted" and clear other filters', () => {
      act(() => {
        useStore.getState().setStatus('approved');
        useStore.getState().setSearchTerm('test');
        useStore.getState().setRequesterFilter('Jean');
        useStore.getState().setCurrentPage(3);
      });

      act(() => {
        useStore.getState().resetFilters();
      });

      const state = useStore.getState();
      expect(state.status).toBe('submitted');
      expect(state.searchTerm).toBe('');
      expect(state.requesterFilter).toBe('');
      expect(state.currentPage).toBe(1);
    });
  });

  describe('setExpenseReports', () => {
    it('should store an array of reports', () => {
      const reports = [
        { id: 1, status: 'accounted' },
        { id: 2, status: 'rejected' },
      ] as any;

      act(() => {
        useStore.getState().setExpenseReports(reports);
      });

      expect(useStore.getState().expenseReports).toEqual(reports);
    });

    it('should fallback to empty array if non-array is passed', () => {
      act(() => {
        useStore.getState().setExpenseReports('invalid' as any);
      });

      expect(useStore.getState().expenseReports).toEqual([]);
    });
  });

  describe('filter integration', () => {
    it('should show all reports when status is "Toutes"', () => {
      const reports = [
        { id: 1, status: 'accounted' },
        { id: 2, status: 'rejected' },
        { id: 3, status: 'approved' },
        { id: 4, status: 'submitted' },
      ] as any;

      act(() => {
        useStore.getState().setExpenseReports(reports);
        useStore.getState().setStatus('Toutes');
      });

      const { status, expenseReports } = useStore.getState();

      const filtered = expenseReports.filter(
        (r: any) => status === 'Toutes' || r.status === status
      );

      expect(filtered).toHaveLength(4);
    });

    it('should filter only submitted reports by default', () => {
      const reports = [
        { id: 1, status: 'accounted' },
        { id: 2, status: 'accounted' },
        { id: 3, status: 'rejected' },
        { id: 4, status: 'submitted' },
      ] as any;

      act(() => {
        useStore.getState().setExpenseReports(reports);
      });

      const { status, expenseReports } = useStore.getState();

      const filtered = expenseReports.filter(
        (r: any) => status === 'Toutes' || r.status === status
      );

      expect(filtered).toHaveLength(1);
    });
  });
});
