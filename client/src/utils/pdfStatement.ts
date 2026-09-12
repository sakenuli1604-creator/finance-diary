import { pdfjsLib } from './pdfWorkerSetup';

export interface PdfParseResult {
  rows: Record<string, string>[];
  columns: string[];
}

// dd.mm.yyyy / dd/mm/yyyy / dd.mm.yy — самый частый формат в банковских выписках РФ/КЗ
const DATE_RE_1 = /^(\d{2})[.\/](\d{2})[.\/](\d{2,4})/;
// yyyy-mm-dd
const DATE_RE_2 = /^(\d{4})-(\d{2})-(\d{2})/;

// Число с пробелом/точкой/запятой как разделителем тысяч и опциональными копейками.
// Ищем все вхождения в строке — по ним определяем сумму(ы) операции.

// Валютные коды/символы, которые банки обычно ставят рядом с суммой —
// сильный сигнал, что это именно сумма, а не дата/номер карты/остаток.
const CURRENCY_HINT_RE = /(UAH|KZT|RUB|USD|EUR|₴|₸|₽|\$|€)/i;

function matchLeadingDate(line: string): string | null {
  const m1 = line.match(DATE_RE_1);
  if (m1) return m1[0];
  const m2 = line.match(DATE_RE_2);
  if (m2) return m2[0];
  return null;
}

function toNumber(raw: string): number {
  const cleaned = raw.replace(/[\s\u00A0]/g, '').replace(/\.(?=\d{3}(?:\D|$))/g, '');
  const normalized = cleaned.replace(',', '.');
  return parseFloat(normalized);
}

// Числа со знаком — это почти всегда сумма операции (банки подписывают
// расход "-123.45", доход "+123.45"). Даты, номера карт, остатки на счету
// знака перед собой не имеют — поэтому раньше без этой проверки парсер
// иногда путал вторую дату в строке (дату обработки/списания) с суммой.
const SIGNED_AMOUNT_RE = /[-+]\s?\d{1,3}(?:[\s\u00A0.,]\d{3})*(?:[.,]\d{2})?/g;
// Запасной вариант без знака — используем только если подписанных чисел
// вообще не нашлось (какие-то банки печатают суммы без знака "+").
const UNSIGNED_AMOUNT_RE = /\d{1,3}(?:[\s\u00A0.,]\d{3})*(?:[.,]\d{2})?/g;

function looksLikeDateFragment(raw: string): boolean {
  // "21.07", "8.04" и т.п. — ровно похоже на день.месяц без знака.
  // Настоящие суммы почти никогда не выглядят как "21.07" без копеек-нуля,
  // но перестрахуемся отдельно, а не полагаемся только на это.
  const m = raw.replace(/^[-+]\s?/, '').match(/^(\d{1,2})[.,](\d{2})$/);
  if (!m) return false;
  const day = parseInt(m[1], 10);
  const month = parseInt(m[2], 10);
  return day >= 1 && day <= 31 && month >= 1 && month <= 12;
}

/**
 * Извлекает текст из PDF постранично, группируя фрагменты в строки по
 * координате Y — так восстанавливается табличная структура выписки
 * (столбцы одной строки в PDF физически разбросаны на отдельные text-items).
 */
export async function extractPdfLines(file: File): Promise<string[]> {
  const buffer = await file.arrayBuffer();
  const pdf = await pdfjsLib.getDocument({ data: buffer }).promise;
  const lines: string[] = [];

  for (let pageNum = 1; pageNum <= pdf.numPages; pageNum++) {
    const page = await pdf.getPage(pageNum);
    const content = await page.getTextContent();

    const rowsByY = new Map<number, { x: number; str: string }[]>();

    for (const item of content.items as any[]) {
      if (!item.str || !item.str.trim()) continue;
      // округляем Y, чтобы фрагменты одной визуальной строки объединились
      // даже при небольшом дрожании координат
      const y = Math.round(item.transform[5] / 2) * 2;
      const x = item.transform[4];
      if (!rowsByY.has(y)) rowsByY.set(y, []);
      rowsByY.get(y)!.push({ x, str: item.str });
    }

    const sortedY = Array.from(rowsByY.keys()).sort((a, b) => b - a);
    for (const y of sortedY) {
      const line = rowsByY
        .get(y)!
        .sort((a, b) => a.x - b.x)
        .map((p) => p.str)
        .join(' ')
        .replace(/\s+/g, ' ')
        .trim();
      if (line) lines.push(line);
    }
  }

  return lines;
}

/**
 * Из текстовых строк выписки собирает строки в формате, совместимом с
 * шагом сопоставления колонок ImportTransactions — та же логика "Дата",
 * "Сумма" / "Расход"+"Доход", "Описание", что и у CSV/Excel импорта.
 *
 * Эвристика (у разных банков PDF устроен по-разному, гарантий нет):
 * строка операции = начинается с даты, дальше где-то в строке есть
 * 1-2 числа, похожих на сумму. Если чисел два — считаем, что это
 * отдельные колонки расход/доход. Описание — всё, что осталось.
 */
export function parsePdfStatementLines(lines: string[]): PdfParseResult {
  const rows: Record<string, string>[] = [];

  for (const line of lines) {
    const dateStr = matchLeadingDate(line);
    if (!dateStr) continue;

    const rest = line.slice(dateStr.length).trim();

    // 1) Сначала ищем числа с явным знаком — это почти всегда сумма
    let numberMatches = Array.from(rest.matchAll(SIGNED_AMOUNT_RE))
      .map((m) => m[0].trim())
      .filter((n) => {
        const value = toNumber(n);
        return !isNaN(value) && !looksLikeDateFragment(n);
      });

    // 2) Если подписанных чисел нет — берём обычные, но стараемся выбрать
    //    те, что стоят рядом с кодом/символом валюты (надёжнее, чем просто
    //    "последнее число в строке")
    if (numberMatches.length === 0) {
      const candidates = Array.from(rest.matchAll(UNSIGNED_AMOUNT_RE))
        .map((m) => ({ str: m[0], index: m.index ?? 0 }))
        .filter(({ str }) => {
          const value = toNumber(str);
          return !isNaN(value) && !looksLikeDateFragment(str) && (/[.,]\d{2}$/.test(str) || Math.abs(value) >= 10);
        });

      const withCurrency = candidates.filter(({ str, index }) => {
        const tail = rest.slice(index + str.length, index + str.length + 6);
        const head = rest.slice(Math.max(0, index - 6), index);
        return CURRENCY_HINT_RE.test(tail) || CURRENCY_HINT_RE.test(head);
      });

      numberMatches = (withCurrency.length > 0 ? withCurrency : candidates).map((c) => c.str);
    }

    if (numberMatches.length === 0) continue;

    const amountCandidates = numberMatches.slice(-2); // последние 1-2 числа в строке
    const firstIdx = rest.indexOf(amountCandidates[0]);
    const description = rest.slice(0, firstIdx).trim().replace(/\s{2,}/g, ' ');

    const row: Record<string, string> = {
      Дата: dateStr,
      Описание: description || rest,
    };

    if (amountCandidates.length >= 2) {
      row['Расход'] = amountCandidates[0];
      row['Доход'] = amountCandidates[1];
    } else {
      row['Сумма'] = amountCandidates[0];
    }

    rows.push(row);
  }

  const columnsSet = new Set<string>();
  rows.forEach((r) => Object.keys(r).forEach((k) => columnsSet.add(k)));
  const columns = Array.from(columnsSet);
  rows.forEach((r) => columns.forEach((c) => { if (!(c in r)) r[c] = ''; }));

  return { rows, columns };
}
