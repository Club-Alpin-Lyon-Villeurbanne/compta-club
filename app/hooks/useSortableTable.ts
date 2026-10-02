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
      // Fonction pour obtenir une valeur imbriquée avec une chaîne comme "sortie.titre"
      const getNestedValue = (obj: any, path: string) => {
        return path.split('.').reduce((acc, part) => acc?.[part], obj);
      };

      const aValue = getNestedValue(a, sortConfig.key as string);
      const bValue = getNestedValue(b, sortConfig.key as string);

      // Les valeurs manquantes restent en fin de liste, quel que soit le sens
      const aMissing = aValue === null || aValue === undefined;
      const bMissing = bValue === null || bValue === undefined;
      if (aMissing || bMissing) return Number(aMissing) - Number(bMissing);

      // Textes dans l'ordre français, sans tenir compte des majuscules ni des accents
      const order = typeof aValue === 'string' && typeof bValue === 'string'
        ? aValue.localeCompare(bValue, 'fr', { sensitivity: 'base' })
        : aValue < bValue ? -1 : aValue > bValue ? 1 : 0;
      return sortConfig.direction === 'asc' ? order : -order;
    });
  }, [data, sortConfig]);

  return {
    sortedData,
    sortConfig,
    handleSort,
  };
}