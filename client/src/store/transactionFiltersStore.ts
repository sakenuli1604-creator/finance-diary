import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export type TypeFilter = 'all' | 'income' | 'expense';
export type SortBy = 'date' | 'amount' | 'category';
export type DatePreset = '' | 'today' | 'week' | 'month' | 'custom';

interface FiltersState {
  type: TypeFilter;
  sortBy: SortBy;
  sortDir: 'asc' | 'desc';
  search: string;
  categoryId: string;
  amountMin: string;
  amountMax: string;
  // Пресеты ("Сегодня", "Неделя", "Месяц") храним именем, а не датами — иначе завтра "Сегодня" останется вчерашним
  datePreset: DatePreset;
  dateFrom: string; // используются только при datePreset === 'custom'
  dateTo: string;
  set: (patch: Partial<Omit<FiltersState, 'set' | 'resetAdvanced' | 'resetAll'>>) => void;
  resetAdvanced: () => void;
  resetAll: () => void;
}

const advancedDefaults = {
  categoryId: '',
  amountMin: '',
  amountMax: '',
  datePreset: '' as DatePreset,
  dateFrom: '',
  dateTo: '',
};

const allDefaults = {
  type: 'all' as TypeFilter,
  sortBy: 'date' as SortBy,
  sortDir: 'desc' as const,
  search: '',
  ...advancedDefaults,
};

// Фильтры операций переживают переход на экран редактирования и перезагрузку страницы
export const useTransactionFiltersStore = create<FiltersState>()(
  persist(
    (set) => ({
      ...allDefaults,
      set: (patch) => set(patch),
      resetAdvanced: () => set(advancedDefaults),
      resetAll: () => set(allDefaults),
    }),
    { name: 'transaction-filters-v1' }
  )
);

const toLocalDateStr = (d: Date) =>
  `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;

// Превращает пресет в реальные даты на момент запроса
export const resolveDateRange = (
  preset: DatePreset,
  dateFrom: string,
  dateTo: string
): { from?: string; to?: string } => {
  const now = new Date();
  if (preset === 'today') {
    return { from: toLocalDateStr(now), to: toLocalDateStr(now) };
  }
  if (preset === 'week') {
    const diffToMonday = now.getDay() === 0 ? 6 : now.getDay() - 1;
    const from = new Date(now);
    from.setDate(now.getDate() - diffToMonday);
    return { from: toLocalDateStr(from), to: toLocalDateStr(now) };
  }
  if (preset === 'month') {
    return {
      from: toLocalDateStr(new Date(now.getFullYear(), now.getMonth(), 1)),
      to: toLocalDateStr(now),
    };
  }
  if (preset === 'custom') {
    return { from: dateFrom || undefined, to: dateTo || undefined };
  }
  return {};
};

// Сервер сравнивает дату как момент времени (полночь UTC), поэтому "по 15 ноября" не включало операции 15-го.
// Отправляем границы дня в часовом поясе пользователя.
const parseLocal = (str: string) => {
  const [y, m, d] = str.split('-').map(Number);
  return { y, m: m - 1, d };
};

export const localDayStartISO = (str?: string) => {
  if (!str) return undefined;
  const { y, m, d } = parseLocal(str);
  return new Date(y, m, d, 0, 0, 0, 0).toISOString();
};

export const localDayEndISO = (str?: string) => {
  if (!str) return undefined;
  const { y, m, d } = parseLocal(str);
  return new Date(y, m, d, 23, 59, 59, 999).toISOString();
};
