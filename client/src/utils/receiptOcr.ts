import { pdfjsLib } from './pdfWorkerSetup';
import { createWorker } from 'tesseract.js';

export interface ParsedReceipt {
  date: string; // ISO
  amount: number;
  type: 'income' | 'expense';
  title: string;
  rawText: string; // на случай если распознало не то — покажем пользователю для сверки
}

// Многие банковские чеки (в частности Kaspi) — это картинка, вшитая в PDF,
// без единого текстового слоя. Поэтому обычный pdfjs-текстовый парсер тут
// бессилен — рендерим страницу в canvas и прогоняем через OCR.
async function pdfFileToCanvas(file: File): Promise<HTMLCanvasElement> {
  const buffer = await file.arrayBuffer();
  const pdf = await pdfjsLib.getDocument({ data: buffer }).promise;
  const page = await pdf.getPage(1);
  // Увеличенный масштаб — OCR заметно точнее на изображении с более высоким
  // разрешением, чем на "естественном" размере страницы
  const viewport = page.getViewport({ scale: 3 });
  const canvas = document.createElement('canvas');
  canvas.width = viewport.width;
  canvas.height = viewport.height;
  const ctx = canvas.getContext('2d')!;
  await page.render({ canvasContext: ctx, viewport }).promise;
  return canvas;
}

let sharedWorker: Awaited<ReturnType<typeof createWorker>> | null = null;

async function getWorker() {
  if (!sharedWorker) {
    // rus+eng — большинство банковских чеков в СНГ используют русский текст,
    // но цифры/латиница (Kaspi, KZT и т.п.) тоже встречаются
    sharedWorker = await createWorker('rus+eng');
  }
  return sharedWorker;
}

export async function terminateOcrWorker() {
  if (sharedWorker) {
    await sharedWorker.terminate();
    sharedWorker = null;
  }
}

export async function ocrFile(file: File): Promise<string> {
  const worker = await getWorker();
  const isPdf = file.type === 'application/pdf' || file.name.toLowerCase().endsWith('.pdf');
  const source: any = isPdf ? await pdfFileToCanvas(file) : file;
  const { data } = await worker.recognize(source);
  return data.text;
}

function parseAmountFromLine(line: string): number | null {
  const m = line.match(
    /(\d[\d\s\u00A0]*(?:[.,]\d{1,2})?)\s*(?:тг|kzt|₸|uah|₴|usd|\$|eur|€|руб|₽|[тt])\b/i
  );
  if (!m) return null;
  const cleaned = m[1].replace(/[\s\u00A0]/g, '').replace(',', '.');
  const value = parseFloat(cleaned);
  return isNaN(value) || value <= 0 ? null : value;
}

/**
 * Разбирает распознанный OCR-текст чека (пока настроено под шаблон Kaspi,
 * но большинство банковских чеков устроены похоже: крупная сумма вверху,
 * дальше имя получателя/отправителя, потом таблица "поле: значение").
 *
 * Это эвристика на одном реальном примере — на других типах чеков
 * (пополнение, оплата по QR и т.п.) может потребоваться донастройка.
 */
export function parseReceiptText(text: string): ParsedReceipt | null {
  const lines = text
    .split('\n')
    .map((l) => l.trim())
    .filter(Boolean);

  let amount: number | null = null;
  let amountLineIndex = -1;
  for (let i = 0; i < lines.length; i++) {
    const found = parseAmountFromLine(lines[i]);
    if (found !== null) {
      amount = found;
      amountLineIndex = i;
      break;
    }
  }
  if (amount === null) return null;

  const dateMatch = text.match(/(\d{2})\.(\d{2})\.(\d{4})(?:\D+(\d{1,2}):(\d{2}))?/);
  let date: Date;
  if (dateMatch) {
    const [, d, m, y, h, min] = dateMatch;
    date = new Date(
      parseInt(y),
      parseInt(m) - 1,
      parseInt(d),
      h ? parseInt(h) : 0,
      min ? parseInt(min) : 0
    );
  } else {
    date = new Date();
  }

  const nextLine = lines[amountLineIndex + 1];
  const title = nextLine && !/\d{2}\.\d{2}\.\d{4}/.test(nextLine) ? nextLine : 'Чек';

  // "Откуда" (счёт-источник указан) — деньги ушли со счёта — расход.
  // "Куда" (счёт-получатель указан) — деньги пришли на счёт — доход.
  const lowerText = text.toLowerCase();
  const hasFrom = /откуда/.test(lowerText);
  const hasTo = /\bкуда\b/.test(lowerText);
  const type: 'income' | 'expense' = hasTo && !hasFrom ? 'income' : 'expense';

  return {
    date: date.toISOString(),
    amount,
    type,
    title,
    rawText: text,
  };
}
