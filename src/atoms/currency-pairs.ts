import { atom } from 'jotai';
import { atomWithQuery } from 'jotai-tanstack-query';

const currencyPairsQueryAtom = atomWithQuery(() => ({
  queryKey: ['currencyPairs'],
  queryFn: async (): Promise<string[]> => {
    const response = await fetch('/data/currency-pairs.json');
    if (!response.ok) {
      throw new Error('Failed to load currency pairs');
    }
    return response.json();
  },
  staleTime: Infinity,
}));

export const currencyPairsAtom = atom<string[]>((get) => {
  const query = get(currencyPairsQueryAtom);
  return query.data ?? [];
});
