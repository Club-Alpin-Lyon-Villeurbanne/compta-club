import { describe, it, expect } from 'vitest';
import { calculateTotals, formatEuro, getFileUrlByExpenseId, truncateText } from '@/app/utils/helper';
import { Details } from '@/app/interfaces/DetailsInterface';

describe('formatEuro', () => {
  it('should format a number to euro currency', () => {
    expect(formatEuro(100)).toBe('100.00 €');
    expect(formatEuro(0)).toBe('0.00 €');
    expect(formatEuro(99.99)).toBe('99.99 €');
    expect(formatEuro(1234.567)).toBe('1234.57 €');
  });

  it('should handle negative numbers', () => {
    expect(formatEuro(-10)).toBe('-10.00 €');
  });
});

describe('truncateText', () => {
  it('should truncate text longer than maxLength', () => {
    expect(truncateText('This is a very long text', 10)).toBe('This is a ...');
  });

  it('should not truncate text shorter than maxLength', () => {
    expect(truncateText('Short', 10)).toBe('Short');
  });

  it('should return empty string for empty input', () => {
    expect(truncateText('')).toBe('');
    expect(truncateText(undefined as unknown as string)).toBe('');
  });

  it('should use default maxLength of 30', () => {
    const text = 'This is a text with exactly thirty-five chars';
    expect(truncateText(text)).toBe('This is a text with exactly th...');
  });
});

describe('getFileUrlByExpenseId', () => {
  it('should return file URL for matching expense ID', () => {
    const piecesJointes = [
      { expenseId: '1', fileUrl: 'http://example.com/file1.pdf' },
      { expenseId: '2', fileUrl: 'http://example.com/file2.pdf' },
    ];
    expect(getFileUrlByExpenseId(piecesJointes, '1')).toBe('http://example.com/file1.pdf');
    expect(getFileUrlByExpenseId(piecesJointes, '2')).toBe('http://example.com/file2.pdf');
  });

  it('should return undefined for non-matching expense ID', () => {
    const piecesJointes = [
      { expenseId: '1', fileUrl: 'http://example.com/file1.pdf' },
    ];
    expect(getFileUrlByExpenseId(piecesJointes, '999')).toBeUndefined();
  });

  it('should return undefined for empty array', () => {
    expect(getFileUrlByExpenseId([], '1')).toBeUndefined();
  });

  it('should return undefined for null/undefined input', () => {
    expect(getFileUrlByExpenseId(null as unknown as any[], '1')).toBeUndefined();
    expect(getFileUrlByExpenseId(undefined as unknown as any[], '1')).toBeUndefined();
  });
});

describe('calculateTotals', () => {
  const createDetails = (overrides: Partial<Details> = {}): Details => ({
    transport: {
      type: 'PERSONAL_VEHICLE',
      distance: 0,
      tollFee: 0,
    },
    accommodations: [],
    others: [],
    ...overrides,
  });

  describe('with null/undefined details', () => {
    it('should return zeros for null details', () => {
      const result = calculateTotals(null as unknown as Details);
      expect(result).toEqual({
        transportTotal: 0,
        accommodationsTotal: 0,
        othersTotal: 0,
        totalRemboursable: 0,
        accommodationsRemboursable: 0,
      });
    });

    it('should return zeros for undefined details', () => {
      const result = calculateTotals(undefined as unknown as Details);
      expect(result).toEqual({
        transportTotal: 0,
        accommodationsTotal: 0,
        othersTotal: 0,
        totalRemboursable: 0,
        accommodationsRemboursable: 0,
      });
    });
  });

  describe('with JSON string details', () => {
    it('should parse valid JSON string', () => {
      const details = createDetails({
        transport: { type: 'PUBLIC_TRANSPORT', ticketPrice: 50 },
      });
      const result = calculateTotals(JSON.stringify(details) as unknown as Details);
      expect(result.transportTotal).toBe(50);
    });

    it('should return zeros for invalid JSON string', () => {
      const result = calculateTotals('invalid json' as unknown as Details);
      expect(result).toEqual({
        transportTotal: 0,
        accommodationsTotal: 0,
        othersTotal: 0,
        totalRemboursable: 0,
        accommodationsRemboursable: 0,
      });
    });
  });

  describe('transport calculations', () => {
    it('should calculate PERSONAL_VEHICLE transport', () => {
      // TAUX_KILOMETRIQUE_VOITURE = 0.2, DIVISION_PEAGE = 3
      const details = createDetails({
        transport: {
          type: 'PERSONAL_VEHICLE',
          distance: 100, // 100 * 0.2 = 20
          tollFee: 30, // 30 / 3 = 10
        },
      });
      const result = calculateTotals(details);
      expect(result.transportTotal).toBe(30); // 20 + 10
    });

    it('should calculate CLUB_MINIBUS transport', () => {
      // TAUX_KILOMETRIQUE_MINIBUS = 0.3
      const details = createDetails({
        transport: {
          type: 'CLUB_MINIBUS',
          distance: 100, // 100 * 0.3 = 30
          fuelExpense: 50,
          tollFee: 20,
          passengerCount: 5, // (30 + 50 + 20) / 5 = 20
        },
      });
      const result = calculateTotals(details);
      expect(result.transportTotal).toBe(20);
    });

    it('should return 0 for CLUB_MINIBUS with 0 passengers', () => {
      const details = createDetails({
        transport: {
          type: 'CLUB_MINIBUS',
          distance: 100,
          passengerCount: 0,
        },
      });
      const result = calculateTotals(details);
      expect(result.transportTotal).toBe(0);
    });

    it('should calculate RENTAL_MINIBUS transport', () => {
      const details = createDetails({
        transport: {
          type: 'RENTAL_MINIBUS',
          rentalPrice: 200,
          fuelExpense: 50,
          tollFee: 50,
          passengerCount: 6, // (200 + 50 + 50) / 6 = 50
        },
      });
      const result = calculateTotals(details);
      expect(result.transportTotal).toBe(50);
    });

    it('should return 0 for RENTAL_MINIBUS with 0 passengers', () => {
      const details = createDetails({
        transport: {
          type: 'RENTAL_MINIBUS',
          rentalPrice: 200,
          passengerCount: 0,
        },
      });
      const result = calculateTotals(details);
      expect(result.transportTotal).toBe(0);
    });

    it('should calculate PUBLIC_TRANSPORT transport', () => {
      const details = createDetails({
        transport: {
          type: 'PUBLIC_TRANSPORT',
          ticketPrice: 75,
        },
      });
      const result = calculateTotals(details);
      expect(result.transportTotal).toBe(75);
    });

    it('should return 0 for unknown transport type', () => {
      const details = createDetails({
        transport: {
          type: 'UNKNOWN' as any,
        },
      });
      const result = calculateTotals(details);
      expect(result.transportTotal).toBe(0);
    });
  });

  describe('accommodation calculations', () => {
    it('should calculate total accommodations', () => {
      const details = createDetails({
        accommodations: [
          { expenseId: '1', price: 50, comment: 'Refuge' },
          { expenseId: '2', price: 80, comment: 'Gite' },
        ],
      });
      const result = calculateTotals(details);
      expect(result.accommodationsTotal).toBe(130);
    });

    it('should cap accommodations at NUITEE_MAX_REMBOURSABLE (60)', () => {
      const details = createDetails({
        accommodations: [
          { expenseId: '1', price: 100, comment: 'Hotel' }, // capped to 60
          { expenseId: '2', price: 50, comment: 'Refuge' }, // not capped
        ],
      });
      const result = calculateTotals(details);
      expect(result.accommodationsTotal).toBe(150);
      expect(result.accommodationsRemboursable).toBe(110); // 60 + 50
    });

    it('should handle empty accommodations', () => {
      const details = createDetails({
        accommodations: [],
      });
      const result = calculateTotals(details);
      expect(result.accommodationsTotal).toBe(0);
      expect(result.accommodationsRemboursable).toBe(0);
    });
  });

  describe('other expenses calculations', () => {
    it('should calculate total other expenses', () => {
      const details = createDetails({
        others: [
          { expenseId: '1', price: 20, comment: 'Repas' },
          { expenseId: '2', price: 30, comment: 'Materiel' },
        ],
      });
      const result = calculateTotals(details);
      expect(result.othersTotal).toBe(50);
    });

    it('should handle empty others', () => {
      const details = createDetails({
        others: [],
      });
      const result = calculateTotals(details);
      expect(result.othersTotal).toBe(0);
    });
  });

  describe('total remboursable', () => {
    it('should calculate total remboursable correctly', () => {
      const details = createDetails({
        transport: {
          type: 'PUBLIC_TRANSPORT',
          ticketPrice: 50,
        },
        accommodations: [
          { expenseId: '1', price: 100, comment: 'Hotel' }, // capped to 60
        ],
        others: [
          { expenseId: '2', price: 30, comment: 'Repas' },
        ],
      });
      const result = calculateTotals(details);
      expect(result.transportTotal).toBe(50);
      expect(result.accommodationsTotal).toBe(100);
      expect(result.accommodationsRemboursable).toBe(60);
      expect(result.othersTotal).toBe(30);
      expect(result.totalRemboursable).toBe(140); // 50 + 60 + 30
    });
  });
});
