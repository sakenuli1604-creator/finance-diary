export const SUPPORTED_CURRENCIES = ['₸', '$', '€', '₽', '₴'];

const SYMBOL_TO_CODE: Record<string, string> = {
  '₸': 'kzt',
  $: 'usd',
  '€': 'eur',
  '₽': 'rub',
  '₴': 'uah',
};

export function currencyCode(symbol: string): string {
  return SYMBOL_TO_CODE[symbol] || 'usd';
}

/**
 * Конвертирует сумму из одной валюты (по символу) в другую, используя курсы
 * относительно доллара (rates: iso-код в нижнем регистре -> курс к 1 USD).
 * Если курс для одной из валют не найден, возвращает исходную сумму без конвертации
 * (лучше показать неточную сумму, чем упасть с ошибкой).
 */
export function convertAmount(
  amount: number,
  fromSymbol: string,
  toSymbol: string,
  rates: Record<string, number>
): number {
  if (fromSymbol === toSymbol) return amount;

  const fromCode = currencyCode(fromSymbol);
  const toCode = currencyCode(toSymbol);

  const fromRate = fromCode === 'usd' ? 1 : rates[fromCode];
  const toRate = toCode === 'usd' ? 1 : rates[toCode];

  if (!fromRate || !toRate) return amount;

  const amountInUsd = amount / fromRate;
  return amountInUsd * toRate;
}
