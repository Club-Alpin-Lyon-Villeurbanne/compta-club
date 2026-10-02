import { describe, it, expect } from 'vitest';
import { act, renderHook } from '@testing-library/react';
import { useSortableTable } from '@/app/hooks/useSortableTable';

const reports = [
  { id: 1, sortie: { titre: 'Sortie Mont Blanc' }, utilisateur: { nom: 'Dupont' }, montant: 120 },
  { id: 2, sortie: { titre: 'canyon Ardèche' }, utilisateur: { nom: 'Moreau' }, montant: 65.83 },
  { id: 3, sortie: { titre: 'Écrins' }, utilisateur: { nom: 'Fontaine' }, montant: 90 },
];

function sortedIds(key: string, clicks: number, data: { id: number }[] = reports) {
  const { result } = renderHook(() => useSortableTable(data));
  for (let i = 0; i < clicks; i++) act(() => result.current.handleSort(key));
  return result.current.sortedData.map((r) => r.id);
}

describe('useSortableTable', () => {
  it('sorts by a nested key, then reverses, then restores the original order', () => {
    expect(sortedIds('utilisateur.nom', 1)).toEqual([1, 3, 2]); // Dupont, Fontaine, Moreau
    expect(sortedIds('utilisateur.nom', 2)).toEqual([2, 3, 1]);
    expect(sortedIds('utilisateur.nom', 3)).toEqual([1, 2, 3]);
  });

  it('sorts text in French order, ignoring case and accents', () => {
    // canyon < Écrins < Sortie : ni la minuscule ni l'accent ne relèguent un titre en fin de liste
    expect(sortedIds('sortie.titre', 1)).toEqual([2, 3, 1]);
  });

  it('sorts numbers by value', () => {
    expect(sortedIds('montant', 1)).toEqual([2, 3, 1]); // 65.83, 90, 120
  });

  it('keeps reports without a value at the end, in both directions', () => {
    const data = [{ id: 1, montant: 10 }, { id: 2 }, { id: 3, montant: 5 }, { id: 4 }];

    expect(sortedIds('montant', 1, data)).toEqual([3, 1, 2, 4]);
    expect(sortedIds('montant', 2, data)).toEqual([1, 3, 2, 4]);
  });
});
