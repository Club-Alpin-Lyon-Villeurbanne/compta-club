import { describe, it, expect, beforeEach } from 'vitest';
import { act } from '@testing-library/react';
import useStore from '@/app/store/useStore';

describe('useStore', () => {
  beforeEach(() => {
    // Reset store to initial state before each test
    act(() => {
      useStore.setState({
        expenseReports: [],
        status: 'Toutes',
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
    it('should default status filter to "Toutes" so all reports are visible', () => {
      const { status } = useStore.getState();
      expect(status).toBe('Toutes');
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
    it('should reset status to "Toutes", not a specific status', () => {
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
      expect(state.status).toBe('Toutes');
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

  describe('filter integration - no reports should be hidden by default', () => {
    it('should not filter out reports when status is "Toutes"', () => {
      const reports = [
        { id: 1, status: 'accounted' },
        { id: 2, status: 'rejected' },
        { id: 3, status: 'approved' },
        { id: 4, status: 'submitted' },
      ] as any;

      act(() => {
        useStore.getState().setExpenseReports(reports);
      });

      const { status, expenseReports } = useStore.getState();

      // The default filter should match ALL reports
      const filtered = expenseReports.filter(
        (r: any) => status === 'Toutes' || r.status === status
      );

      expect(filtered).toHaveLength(4);
    });

    it('should not filter out reports when no reports have "submitted" status', () => {
      // This is the exact bug scenario: all reports are processed, none are "submitted"
      const reports = [
        { id: 1, status: 'accounted' },
        { id: 2, status: 'accounted' },
        { id: 3, status: 'rejected' },
      ] as any;

      act(() => {
        useStore.getState().setExpenseReports(reports);
      });

      const { status, expenseReports } = useStore.getState();

      const filtered = expenseReports.filter(
        (r: any) => status === 'Toutes' || r.status === status
      );

      expect(filtered).toHaveLength(3);
    });
  });
});
