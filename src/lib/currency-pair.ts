const BASE_CURRENCY_LENGTH = 3;

export function parseCurrencyPair(
  pair: string
): [base: string, quote: string] {
  const base = pair.slice(0, BASE_CURRENCY_LENGTH);
  const quote = pair.slice(BASE_CURRENCY_LENGTH);
  return [base, quote];
}

export function formatCurrencyPair(pair: string): string {
  const [base, quote] = parseCurrencyPair(pair);
  return `${base} / ${quote}`;
}

export function toSymbol(currencyPair: string): string {
  return `t${currencyPair}`;
}

export function fromSymbol(symbol: string): string {
  return symbol.slice(1);
}
