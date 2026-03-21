import { useAtomValue } from 'jotai';

import { isChannelStaleAtom } from '@/atoms/subscriptions';
import { tickerBySymbolAtom } from '@/atoms/tickers';
import { toSymbol } from '@/lib/currency-pair';
import { ChannelType } from '@/types/channel';

export function useTickerData(currencyPair: string) {
  const getTicker = useAtomValue(tickerBySymbolAtom);
  const getIsStale = useAtomValue(isChannelStaleAtom);

  const ticker = getTicker(currencyPair);
  const isStale = getIsStale(ChannelType.TICKER, {
    symbol: toSymbol(currencyPair),
  });

  return { ticker, isStale };
}
