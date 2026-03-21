export const ChannelType = {
  TRADES: 'trades',
  TICKER: 'ticker',
  BOOK: 'book',
  CANDLES: 'candles',
};

export type ChannelType = (typeof ChannelType)[keyof typeof ChannelType];
