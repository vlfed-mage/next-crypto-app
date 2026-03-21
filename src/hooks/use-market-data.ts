import { useAtomValue } from 'jotai';

import { enrichedTickersAtom } from '@/atoms/tickers';

export function useMarketData() {
  return useAtomValue(enrichedTickersAtom);
}
