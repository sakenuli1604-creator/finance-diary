import * as pdfjsLib from 'pdfjs-dist';
// @ts-ignore — vite отдаёт URL воркера как строку
import pdfWorkerUrl from 'pdfjs-dist/build/pdf.worker.min.js?url';

pdfjsLib.GlobalWorkerOptions.workerSrc = pdfWorkerUrl;

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
const AMOUNT_RE = /-?\d{1,3}(?:[\s\u00A0.,]\d{3})*(?:[.,]\d{2})?/g;

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
    const numberMatches = Array.from(rest.matchAll(AMOUNT_RE))
      .map((m) => m[0])
      .filter((n) => {
        const value = toNumber(n);
        // отсекаем мелкие числа-мусор (номера страниц, часть номера карты и т.п.);
        // суммы с копейками пропускаем всегда, целые — только если не совсем крошечные
        return !isNaN(value) && (/[.,]\d{2}$/.test(n) || Math.abs(value) >= 10);
      });

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
