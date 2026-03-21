export const BITFINEX_WS_URL =
  process.env['NEXT_PUBLIC_BITFINEX_WS_URL'] ??
  'wss://api-pub.bitfinex.com/ws/2';

export const MAX_TRADES = Number(process.env['NEXT_PUBLIC_MAX_TRADES'] ?? 1000);
export const MAX_CANDLES = Number(
  process.env['NEXT_PUBLIC_MAX_CANDLES'] ?? 5000
);
export const MAX_BOOK_ORDERS = Number(
  process.env['NEXT_PUBLIC_MAX_BOOK_ORDERS'] ?? 50
);

export const DEFAULT_TIMEFRAME = '1m';

export const TIMEFRAMES = ['1m', '5m', '15m', '1h', '4h', '1D'] as const;
export type Timeframe = (typeof TIMEFRAMES)[number];

export const TIMEFRAME_LABELS: Record<Timeframe, string> = {
  '1m': '1m',
  '5m': '5m',
  '15m': '15m',
  '1h': '1H',
  '4h': '4H',
  '1D': '1D',
};
export const SUBSCRIPTION_DELAY_MS = 2000;
export const STALE_TIMEOUT_MS = 90_000;
export const STALE_CHECK_INTERVAL_MS = 30_000;
export const MESSAGE_BUFFER_FLUSH_MS = 100;

export const MAX_RECONNECT_ATTEMPTS = 5;
export const RECONNECT_BASE_DELAY_MS = 1000;

export const VISIBLE_TICKERS_COUNT = 5;
export const VISIBLE_TICKERS_OFFSET = 2;
