// Бесплатный курсовой API без ключей: https://github.com/fawazahmed0/exchange-api
const PRIMARY_URL =
  'https://cdn.jsdelivr.net/npm/@fawazahmed0/currency-api@latest/v1/currencies/usd.json';
const FALLBACK_URL = 'https://latest.currency-api.pages.dev/v1/currencies/usd.json';

const CACHE_TTL_MS = 24 * 60 * 60 * 1000; // курс обновляется раз в сутки

export interface RatesSnapshot {
  base: string; // 'usd'
  rates: Record<string, number>; // lowercase iso code -> курс к 1 USD
  updatedAt: number;
}

let cache: RatesSnapshot | null = null;
let pendingFetch: Promise<RatesSnapshot> | null = null;

async function fetchFrom(url: string): Promise<Record<string, number>> {
  const res = await fetch(url);
  if (!res.ok) {
    throw new Error(`Exchange rate source responded with ${res.status}`);
  }
  const data = (await res.json()) as { usd: Record<string, number> };
  return data.usd;
}

async function refreshRates(): Promise<RatesSnapshot> {
  try {
    const rates = await fetchFrom(PRIMARY_URL);
    return { base: 'usd', rates, updatedAt: Date.now() };
  } catch (primaryError) {
    try {
      const rates = await fetchFrom(FALLBACK_URL);
      return { base: 'usd', rates, updatedAt: Date.now() };
    } catch (fallbackError) {
      if (cache) {
        // источник недоступен — отдаём то, что есть, лучше устаревший курс, чем никакой
        return cache;
      }
      throw fallbackError;
    }
  }
}

export async function getExchangeRates(): Promise<RatesSnapshot> {
  const isFresh = cache && Date.now() - cache.updatedAt < CACHE_TTL_MS;
  if (isFresh) {
    return cache as RatesSnapshot;
  }

  if (!pendingFetch) {
    pendingFetch = refreshRates()
      .then((snapshot) => {
        cache = snapshot;
        return snapshot;
      })
      .finally(() => {
        pendingFetch = null;
      });
  }

  return pendingFetch;
}
