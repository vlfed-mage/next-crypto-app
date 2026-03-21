export interface Trade {
  id: number;
  timestamp: number;
  amount: number;
  price: number;
}

export type TradeTuple = [
  id: number,
  timestamp: number,
  amount: number,
  price: number,
];
