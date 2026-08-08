import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Upload, AlertTriangle, CheckCircle2 } from 'lucide-react';
import Papa from 'papaparse';
import * as XLSX from 'xlsx';
import { useAccountsStore } from '../store/accountsStore';
import { useCategoriesStore } from '../store/categoriesStore';
import { transactionsAPI, ImportRow } from '../api/transactions';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';

type Step = 'upload' | 'map' | 'preview' | 'done';
type AmountMode = 'single' | 'split';

function parseDate(raw: string): Date | null {
  const value = String(raw).trim();
  if (!value) return null;

  const native = new Date(value);
  if (!isNaN(native.getTime()) && /\d{4}/.test(value)) return native;

  const match = value.match(/^(\d{1,2})[.\/](\d{1,2})[.\/](\d{2,4})/);
  if (match) {
    const [, d, m, y] = match;
    const year = y.length === 2 ? 2000 + parseInt(y) : parseInt(y);
    const date = new Date(year, parseInt(m) - 1, parseInt(d));
    if (!isNaN(date.getTime())) return date;
  }

  return null;
}

function parseAmount(raw: string): number {
  if (raw === undefined || raw === null) return NaN;
  const cleaned = String(raw)
    .replace(/[^\d,.\-]/g, '')
    .replace(/\s/g, '')
    .replace(',', '.');
  return parseFloat(cleaned);
}

export const ImportTransactions: React.FC = () => {
  const navigate = useNavigate();
  const { accounts, fetchAccounts } = useAccountsStore();
  const { categories, fetchCategories } = useCategoriesStore();

  const [step, setStep] = useState<Step>('upload');
  const [accountId, setAccountId] = useState('');
  const [rawRows, setRawRows] = useState<Record<string, any>[]>([]);
  const [columns, setColumns] = useState<string[]>([]);
  const [error, setError] = useState('');

  const [dateCol, setDateCol] = useState('');
  const [titleCol, setTitleCol] = useState('');
  const [amountMode, setAmountMode] = useState<AmountMode>('single');
  const [amountCol, setAmountCol] = useState('');
  const [invertSign, setInvertSign] = useState(false);
  const [expenseCol, setExpenseCol] = useState('');
  const [incomeCol, setIncomeCol] = useState('');

  const [expenseCategoryId, setExpenseCategoryId] = useState('');
  const [incomeCategoryId, setIncomeCategoryId] = useState('');

  const [isProcessing, setIsProcessing] = useState(false);
  const [importedCount, setImportedCount] = useState(0);

  useEffect(() => {
    fetchAccounts();
    fetchCategories();
  }, [fetchAccounts, fetchCategories]);

  useEffect(() => {
    if (accounts.length > 0 && !accountId) setAccountId(accounts[0].id);
  }, [accounts, accountId]);

  useEffect(() => {
    const expenseCats = categories.filter((c) => c.type === 'expense');
    const incomeCats = categories.filter((c) => c.type === 'income');
    if (expenseCats.length > 0 && !expenseCategoryId) setExpenseCategoryId(expenseCats[0].id);
    if (incomeCats.length > 0 && !incomeCategoryId) setIncomeCategoryId(incomeCats[0].id);
  }, [categories]);

  const handleFile = (file: File) => {
    setError('');
    const isCsv = file.name.toLowerCase().endsWith('.csv');

    if (isCsv) {
      Papa.parse(file, {
        header: true,
        skipEmptyLines: true,
        complete: (result) => {
          const rows = result.data as Record<string, any>[];
          if (rows.length === 0) {
            setError('Файл пустой или не удалось его прочитать');
            return;
          }
          setColumns(Object.keys(rows[0]));
          setRawRows(rows);
          guessColumns(Object.keys(rows[0]));
          setStep('map');
        },
        error: () => setError('Не удалось прочитать CSV-файл'),
      });
    } else {
      const reader = new FileReader();
      reader.onload = (e) => {
        try {
          const data = new Uint8Array(e.target?.result as ArrayBuffer);
          const workbook = XLSX.read(data, { type: 'array' });
          const sheet = workbook.Sheets[workbook.SheetNames[0]];
          const rows = XLSX.utils.sheet_to_json(sheet, { defval: '' }) as Record<string, any>[];
          if (rows.length === 0) {
            setError('Файл пустой или не удалось его прочитать');
            return;
          }
          setColumns(Object.keys(rows[0]));
          setRawRows(rows);
          guessColumns(Object.keys(rows[0]));
          setStep('map');
        } catch {
          setError('Не удалось прочитать Excel-файл');
        }
      };
      reader.readAsArrayBuffer(file);
    }
  };

  const guessColumns = (cols: string[]) => {
    const find = (patterns: RegExp) => cols.find((c) => patterns.test(c.toLowerCase()));
    setDateCol(find(/дата|date/) || '');
    setTitleCol(find(/назв|описан|коммент|title|description|детали/) || '');
    setAmountCol(find(/сумма|amount/) || '');
    setExpenseCol(find(/расход|списан|дебет|debit/) || '');
    setIncomeCol(find(/доход|пополн|кредит|credit/) || '');
  };

  const buildPreview = (): { rows: ImportRow[]; skipped: number } => {
    const parsed: ImportRow[] = [];
    let skipped = 0;

    for (const row of rawRows) {
      const date = dateCol ? parseDate(row[dateCol]) : null;
      if (!date) {
        skipped++;
        continue;
      }

      let amount = 0;
      let type: 'income' | 'expense' = 'expense';

      if (amountMode === 'single') {
        const value = parseAmount(row[amountCol]);
        if (isNaN(value) || value === 0) {
          skipped++;
          continue;
        }
        const signed = invertSign ? -value : value;
        type = signed >= 0 ? 'income' : 'expense';
        amount = Math.abs(signed);
      } else {
        const expenseVal = expenseCol ? parseAmount(row[expenseCol]) : NaN;
        const incomeVal = incomeCol ? parseAmount(row[incomeCol]) : NaN;
        if (!isNaN(expenseVal) && expenseVal > 0) {
          type = 'expense';
          amount = expenseVal;
        } else if (!isNaN(incomeVal) && incomeVal > 0) {
          type = 'income';
          amount = incomeVal;
        } else {
          skipped++;
          continue;
        }
      }

      parsed.push({
        date: date.toISOString(),
        amount,
        type,
        title: titleCol ? String(row[titleCol] || '').slice(0, 200) : undefined,
        categoryId: type === 'income' ? incomeCategoryId : expenseCategoryId,
      });
    }

    return { rows: parsed, skipped };
  };

  const preview = step === 'preview' ? buildPreview() : { rows: [], skipped: 0 };

  const handleImport = async () => {
    const { rows } = buildPreview();
    if (rows.length === 0) {
      setError('Нет ни одной строки, которую можно импортировать');
      return;
    }
    try {
      setIsProcessing(true);
      const result = await transactionsAPI.bulkImport(accountId, rows);
      setImportedCount(result.imported);
      setStep('done');
    } catch (err: any) {
      setError(err.response?.data?.message || 'Не удалось импортировать операции');
    } finally {
      setIsProcessing(false);
    }
  };

  const canProceedToPreview =
    dateCol && (amountMode === 'single' ? amountCol : expenseCol || incomeCol);

  return (
    <div className="min-h-screen bg-app pb-24">
      <div className="bg-surface border-b border-line">
        <div className="max-w-2xl mx-auto px-4 py-4">
          <div className="flex items-center gap-3">
            <button onClick={() => navigate('/transactions')} className="text-secondary hover:text-primary">
              <ArrowLeft size={24} />
            </button>
            <h1 className="text-2xl font-bold text-primary">Импорт из выписки</h1>
          </div>
        </div>
      </div>

      <div className="max-w-2xl mx-auto px-4 py-6 space-y-4">
        {error && (
          <Card className="p-4 bg-expense/10 border-expense/30 flex gap-3">
            <AlertTriangle className="text-expense shrink-0" size={20} />
            <p className="text-sm text-secondary">{error}</p>
          </Card>
        )}

        {step === 'upload' && (
          <Card className="p-6 space-y-4">
            <div>
              <label className="block text-sm font-medium text-secondary mb-2">
                На какой счёт импортировать
              </label>
              <select
                value={accountId}
                onChange={(e) => setAccountId(e.target.value)}
                className="w-full px-4 py-2 border border-line rounded-lg bg-surface text-primary outline-none"
              >
                {accounts.map((a) => (
                  <option key={a.id} value={a.id}>
                    {a.icon} {a.name} ({a.currency})
                  </option>
                ))}
              </select>
            </div>

            <label className="w-full h-32 border-2 border-dashed border-line rounded-lg flex flex-col items-center justify-center gap-2 hover:border-blue-500 transition-colors cursor-pointer">
              <Upload className="text-secondary" size={28} />
              <span className="text-sm text-secondary">
                Выбери файл выписки — CSV или Excel (.xlsx)
              </span>
              <input
                type="file"
                accept=".csv,.xlsx,.xls"
                className="hidden"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) handleFile(file);
                }}
              />
            </label>

            <p className="text-xs text-secondary">
              Выгрузи историю операций из приложения своего банка (обычно в разделе
              «История» → «Экспорт» / «Скачать выписку») и загрузи файл сюда. На следующем шаге
              нужно будет указать, какая колонка — дата, а какая — сумма.
            </p>
          </Card>
        )}

        {step === 'map' && (
          <Card className="p-6 space-y-4">
            <h2 className="font-semibold text-primary">Какая колонка за что отвечает?</h2>

            <div>
              <label className="block text-sm font-medium text-secondary mb-2">Дата операции</label>
              <select
                value={dateCol}
                onChange={(e) => setDateCol(e.target.value)}
                className="w-full px-4 py-2 border border-line rounded-lg bg-surface text-primary outline-none"
              >
                <option value="">Не выбрано</option>
                {columns.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-secondary mb-2">
                Название/описание (необязательно)
              </label>
              <select
                value={titleCol}
                onChange={(e) => setTitleCol(e.target.value)}
                className="w-full px-4 py-2 border border-line rounded-lg bg-surface text-primary outline-none"
              >
                <option value="">Не выбрано</option>
                {columns.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            </div>

            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setAmountMode('single')}
                className={`flex-1 py-2 rounded-lg text-sm font-medium ${
                  amountMode === 'single' ? 'bg-blue-600 text-white' : 'bg-muted text-secondary'
                }`}
              >
                Одна колонка суммы
              </button>
              <button
                type="button"
                onClick={() => setAmountMode('split')}
                className={`flex-1 py-2 rounded-lg text-sm font-medium ${
                  amountMode === 'split' ? 'bg-blue-600 text-white' : 'bg-muted text-secondary'
                }`}
              >
                Отдельно расход/доход
              </button>
            </div>

            {amountMode === 'single' ? (
              <div className="space-y-2">
                <label className="block text-sm font-medium text-secondary mb-2">Сумма</label>
                <select
                  value={amountCol}
                  onChange={(e) => setAmountCol(e.target.value)}
                  className="w-full px-4 py-2 border border-line rounded-lg bg-surface text-primary outline-none"
                >
                  <option value="">Не выбрано</option>
                  {columns.map((c) => (
                    <option key={c} value={c}>
                      {c}
                    </option>
                  ))}
                </select>
                <label className="flex items-center gap-2 text-sm text-secondary">
                  <input
                    type="checkbox"
                    checked={invertSign}
                    onChange={(e) => setInvertSign(e.target.checked)}
                  />
                  Инвертировать знак (если расходы у банка идут как положительные числа)
                </label>
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-secondary mb-2">Расход</label>
                  <select
                    value={expenseCol}
                    onChange={(e) => setExpenseCol(e.target.value)}
                    className="w-full px-3 py-2 border border-line rounded-lg bg-surface text-primary outline-none"
                  >
                    <option value="">Не выбрано</option>
                    {columns.map((c) => (
                      <option key={c} value={c}>
                        {c}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-secondary mb-2">Доход</label>
                  <select
                    value={incomeCol}
                    onChange={(e) => setIncomeCol(e.target.value)}
                    className="w-full px-3 py-2 border border-line rounded-lg bg-surface text-primary outline-none"
                  >
                    <option value="">Не выбрано</option>
                    {columns.map((c) => (
                      <option key={c} value={c}>
                        {c}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            )}

            <div className="grid grid-cols-2 gap-3 pt-2 border-t border-line">
              <div>
                <label className="block text-sm font-medium text-secondary mb-2">
                  Категория для расходов
                </label>
                <select
                  value={expenseCategoryId}
                  onChange={(e) => setExpenseCategoryId(e.target.value)}
                  className="w-full px-3 py-2 border border-line rounded-lg bg-surface text-primary outline-none"
                >
                  {categories
                    .filter((c) => c.type === 'expense')
                    .map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.icon} {c.name}
                      </option>
                    ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-secondary mb-2">
                  Категория для доходов
                </label>
                <select
                  value={incomeCategoryId}
                  onChange={(e) => setIncomeCategoryId(e.target.value)}
                  className="w-full px-3 py-2 border border-line rounded-lg bg-surface text-primary outline-none"
                >
                  {categories
                    .filter((c) => c.type === 'income')
                    .map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.icon} {c.name}
                      </option>
                    ))}
                </select>
              </div>
            </div>
            <p className="text-xs text-secondary">
              Все импортированные операции сначала попадут в эту категорию — потом можно
              перекатегоризировать вручную по одной.
            </p>

            <Button fullWidth disabled={!canProceedToPreview} onClick={() => setStep('preview')}>
              Далее — превью
            </Button>
          </Card>
        )}

        {step === 'preview' && (
          <Card className="p-6 space-y-4">
            <h2 className="font-semibold text-primary">Проверь перед импортом</h2>

            <div className="flex gap-4 text-sm">
              <span className="text-income font-medium">
                Будет добавлено: {preview.rows.length}
              </span>
              {preview.skipped > 0 && (
                <span className="text-expense font-medium">
                  Пропущено (не удалось разобрать): {preview.skipped}
                </span>
              )}
            </div>

            <div className="border border-line rounded-lg overflow-hidden">
              <div className="max-h-80 overflow-y-auto divide-y divide-line">
                {preview.rows.slice(0, 15).map((row, i) => (
                  <div key={i} className="flex items-center justify-between px-3 py-2 text-sm">
                    <div className="min-w-0">
                      <p className="text-primary truncate">{row.title || '—'}</p>
                      <p className="text-secondary text-xs">
                        {new Date(row.date).toLocaleDateString('ru-RU')}
                      </p>
                    </div>
                    <span className={row.type === 'income' ? 'text-income' : 'text-expense'}>
                      {row.type === 'income' ? '+' : '-'}
                      {row.amount.toLocaleString('ru-RU')}
                    </span>
                  </div>
                ))}
              </div>
              {preview.rows.length > 15 && (
                <p className="text-xs text-secondary text-center py-2 bg-muted">
                  ...и ещё {preview.rows.length - 15}
                </p>
              )}
            </div>

            <div className="flex gap-3">
              <Button variant="secondary" fullWidth onClick={() => setStep('map')}>
                Назад
              </Button>
              <Button fullWidth isLoading={isProcessing} onClick={handleImport}>
                Импортировать {preview.rows.length}
              </Button>
            </div>
          </Card>
        )}

        {step === 'done' && (
          <Card className="p-8 text-center space-y-4">
            <CheckCircle2 className="mx-auto text-income" size={48} />
            <p className="text-primary font-semibold">Готово!</p>
            <p className="text-secondary text-sm">
              Импортировано операций: {importedCount}
            </p>
            <Button fullWidth onClick={() => navigate('/transactions')}>
              К списку операций
            </Button>
          </Card>
        )}
      </div>
    </div>
  );
};
