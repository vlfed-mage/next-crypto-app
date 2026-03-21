export interface Order {
  id: number;
  price: number;
  amount: number;
}

export type OrderTuple = [id: number, price: number, amount: number];

export interface BookSide {
  bids: Order[];
  asks: Order[];
}
