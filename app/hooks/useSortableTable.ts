import { useState, useMemo } from 'react';

export type SortDirection = 'asc' | 'desc' | null;

export interface SortConfig<T> {
  key: keyof T | string;
  direction: SortDirection;
}

export function useSortableTable<T>(
  data: T[],
  defaultSort?: SortConfig<T>
) {
  const [sortConfig, setSortConfig] = useState<SortConfig<T>>(
    defaultSort || { key: '', direction: null }
  );

  const handleSort = (key: keyof T | string) => {
    let direction: SortDirection = 'asc';
    
    if (sortConfig.key === key) {
      if (sortConfig.direction === 'asc') {
        direction = 'desc';
      } else if (sortConfig.direction === 'desc') {
        direction = null;
      } else {
        direction = 'asc';
      }
    }

    setSortConfig({ key, direction });
  };

  const sortedData = useMemo(() => {
    if (!sortConfig.key || !sortConfig.direction) {
      return [...data];
    }

    return [...data].sort((a, b) => {
      // Fonction pour obtenir une valeur imbriquée avec une chaîne comme "event.titre"
      const getNestedValue = (obj: any, path: string) => {
        return path.split('.').reduce((acc, part) => acc?.[part], obj);
      };

      const aValue = getNestedValue(a, sortConfig.key as string);
      const bValue = getNestedValue(b, sortConfig.key as string);

      if (aValue === null || aValue === undefined) return 1;
      if (bValue === null || bValue === undefined) return -1;

      if (aValue < bValue) {
        return sortConfig.direction === 'asc' ? -1 : 1;
      }
      if (aValue > bValue) {
        return sortConfig.direction === 'asc' ? 1 : -1;
      }
      return 0;
    });
  }, [data, sortConfig]);

  return {
    sortedData,
    sortConfig,
    handleSort,
  };
}