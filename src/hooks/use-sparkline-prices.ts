import { useAtomValue } from 'jotai';

import { sparklinePricesByPairAtom } from '@/atoms/tickers';

export function useSparklinePrices(currencyPair: string): number[] {
  const getPrices = useAtomValue(sparklinePricesByPairAtom);
  return getPrices(currencyPair);
}
