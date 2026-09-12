export interface CurrencyOption {
  symbol: string;
  code: string; // нижний регистр iso-код, как в курсовом API
  label: string;
}

export const CURRENCIES: CurrencyOption[] = [
  { symbol: '₸', code: 'kzt', label: 'Тенге' },
  { symbol: '$', code: 'usd', label: 'Доллар' },
  { symbol: '€', code: 'eur', label: 'Евро' },
  { symbol: '₽', code: 'rub', label: 'Рубль' },
  { symbol: '₴', code: 'uah', label: 'Гривна' },
];

export function currencyCode(symbol: string): string {
  return CURRENCIES.find((c) => c.symbol === symbol)?.code || 'usd';
}

export function currencyLabel(symbol: string): string {
  return CURRENCIES.find((c) => c.symbol === symbol)?.label || symbol;
}

/**
 * Конвертирует сумму из одной валюты в другую по курсам относительно USD.
 * rates — объект вида { kzt: 450.2, uah: 41.5, eur: 0.92, usd: 1, ... }
 * Если курс недоступен, возвращает исходную сумму без изменений.
 */
export function convertAmount(
  amount: number,
  fromSymbol: string,
  toSymbol: string,
  rates: Record<string, number> | null
): number {
  if (!rates || fromSymbol === toSymbol) return amount;

  const fromCode = currencyCode(fromSymbol);
  const toCode = currencyCode(toSymbol);

  const fromRate = fromCode === 'usd' ? 1 : rates[fromCode];
  const toRate = toCode === 'usd' ? 1 : rates[toCode];

  if (!fromRate || !toRate) return amount;

  const amountInUsd = amount / fromRate;
  return amountInUsd * toRate;
}
