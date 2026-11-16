// Границы дня/недели/месяца/года в часовом поясе ПОЛЬЗОВАТЕЛЯ, а не сервера.
// Сервер на Railway живёт в UTC, поэтому для Казахстана (UTC+5) "сегодня" иначе начиналось бы в 05:00.
// Без внешних зависимостей: только встроенный Intl.

export const DEFAULT_TIMEZONE = 'Asia/Almaty';

export function isValidTimeZone(tz: unknown): tz is string {
  if (typeof tz !== 'string' || !tz) return false;
  try {
    new Intl.DateTimeFormat('en-US', { timeZone: tz });
    return true;
  } catch {
    return false;
  }
}

const formatters = new Map<string, Intl.DateTimeFormat>();

function formatterFor(tz: string): Intl.DateTimeFormat {
  let f = formatters.get(tz);
  if (!f) {
    f = new Intl.DateTimeFormat('en-US', {
      timeZone: tz,
      hourCycle: 'h23',
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    });
    formatters.set(tz, f);
  }
  return f;
}

function getParts(date: Date, tz: string) {
  const parts = formatterFor(tz).formatToParts(date);
  const get = (type: string) => Number(parts.find((p) => p.type === type)!.value);
  return { y: get('year'), m: get('month'), d: get('day'), h: get('hour'), mi: get('minute'), s: get('second') };
}

// Смещение пояса относительно UTC (в мс) в данный момент
function offsetMs(date: Date, tz: string): number {
  const p = getParts(date, tz);
  const asUtc = Date.UTC(p.y, p.m - 1, p.d, p.h, p.mi, p.s);
  return asUtc - (date.getTime() - date.getMilliseconds());
}

// Момент 00:00 календарной даты (y, m, d) в поясе tz. m и d могут выходить за диапазон — Date.UTC их нормализует
function zonedMidnight(y: number, m: number, d: number, tz: string): Date {
  const guess = Date.UTC(y, m - 1, d);
  let t = guess - offsetMs(new Date(guess), tz);
  const second = offsetMs(new Date(t), tz);
  if (guess - second !== t) t = guess - second; // граница перехода на летнее время
  return new Date(t);
}

export function startOfDayTz(date: Date, tz: string): Date {
  const { y, m, d } = getParts(date, tz);
  return zonedMidnight(y, m, d, tz);
}

export function addDaysTz(date: Date, days: number, tz: string): Date {
  const { y, m, d } = getParts(date, tz);
  return zonedMidnight(y, m, d + days, tz);
}

// Неделя с понедельника
export function startOfWeekTz(date: Date, tz: string, weekOffset = 0): Date {
  const { y, m, d } = getParts(date, tz);
  const dow = new Date(Date.UTC(y, m - 1, d)).getUTCDay();
  const diffToMonday = dow === 0 ? 6 : dow - 1;
  return zonedMidnight(y, m, d - diffToMonday + weekOffset * 7, tz);
}

export function startOfMonthTz(date: Date, tz: string, monthOffset = 0): Date {
  const { y, m } = getParts(date, tz);
  return zonedMidnight(y, m + monthOffset, 1, tz);
}

export function startOfYearTz(date: Date, tz: string, yearOffset = 0): Date {
  const { y } = getParts(date, tz);
  return zonedMidnight(y + yearOffset, 1, 1, tz);
}
