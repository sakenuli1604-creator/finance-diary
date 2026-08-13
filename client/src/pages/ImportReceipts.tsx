import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Upload, Trash2, CheckCircle2, AlertTriangle } from 'lucide-react';
import { useAccountsStore } from '../store/accountsStore';
import { useCategoriesStore } from '../store/categoriesStore';
import { transactionsAPI, ImportRow } from '../api/transactions';
import { ocrFile, parseReceiptText, terminateOcrWorker } from '../utils/receiptOcr';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';

interface ReceiptRow {
  id: string;
  fileName: string;
  status: 'processing' | 'ok' | 'failed';
  date: string;
  amount: number;
  type: 'income' | 'expense';
  title: string;
  rawText?: string;
}

export const ImportReceipts: React.FC = () => {
  const navigate = useNavigate();
  const { accounts, fetchAccounts } = useAccountsStore();
  const { categories, fetchCategories } = useCategoriesStore();

  const [accountId, setAccountId] = useState('');
  const [expenseCategoryId, setExpenseCategoryId] = useState('');
  const [incomeCategoryId, setIncomeCategoryId] = useState('');
  const [rows, setRows] = useState<ReceiptRow[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isImporting, setIsImporting] = useState(false);
  const [imported, setImported] = useState<number | null>(null);
  const [error, setError] = useState('');

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

  useEffect(() => {
    return () => {
      terminateOcrWorker();
    };
  }, []);

  const handleFiles = async (files: FileList) => {
    setError('');
    setIsProcessing(true);

    for (const file of Array.from(files)) {
      const id = `${file.name}-${Date.now()}-${Math.random()}`;
      setRows((prev) => [
        ...prev,
        {
          id,
          fileName: file.name,
          status: 'processing',
          date: new Date().toISOString().split('T')[0],
          amount: 0,
          type: 'expense',
          title: '',
        },
      ]);

      try {
        const text = await ocrFile(file);
        const parsed = parseReceiptText(text);

        if (!parsed) {
          setRows((prev) =>
            prev.map((r) => (r.id === id ? { ...r, status: 'failed', rawText: text } : r))
          );
          continue;
        }

        setRows((prev) =>
          prev.map((r) =>
            r.id === id
              ? {
                  ...r,
                  status: 'ok',
                  date: parsed.date.split('T')[0],
                  amount: parsed.amount,
                  type: parsed.type,
                  title: parsed.title,
                  rawText: parsed.rawText,
                }
              : r
          )
        );
      } catch (err) {
        console.error('OCR failed for', file.name, err);
        setRows((prev) => prev.map((r) => (r.id === id ? { ...r, status: 'failed' } : r)));
      }
    }

    setIsProcessing(false);
  };

  const updateRow = (id: string, patch: Partial<ReceiptRow>) => {
    setRows((prev) => prev.map((r) => (r.id === id ? { ...r, ...patch } : r)));
  };

  const removeRow = (id: string) => {
    setRows((prev) => prev.filter((r) => r.id !== id));
  };

  const okRows = rows.filter((r) => r.status === 'ok');

  const handleImport = async () => {
    if (okRows.length === 0) return;
    setError('');

    const importRows: ImportRow[] = okRows.map((r) => ({
      date: new Date(r.date).toISOString(),
      amount: r.amount,
      type: r.type,
      title: r.title,
      categoryId: r.type === 'income' ? incomeCategoryId : expenseCategoryId,
    }));

    try {
      setIsImporting(true);
      const result = await transactionsAPI.bulkImport(accountId, importRows);
      setImported(result.imported);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Не удалось импортировать чеки');
    } finally {
      setIsImporting(false);
    }
  };

  if (imported !== null) {
    return (
      <div className="min-h-screen bg-app pb-24">
        <div className="max-w-2xl mx-auto px-4 py-6">
          <Card className="p-8 text-center space-y-4">
            <CheckCircle2 className="mx-auto text-income" size={48} />
            <p className="text-primary font-semibold">Готово!</p>
            <p className="text-secondary text-sm">Импортировано операций: {imported}</p>
            <Button fullWidth onClick={() => navigate('/transactions')}>
              К списку операций
            </Button>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-app pb-24">
      <div className="bg-surface border-b border-line">
        <div className="max-w-2xl mx-auto px-4 py-4">
          <div className="flex items-center gap-3">
            <button
              onClick={() => navigate('/transactions/import')}
              className="text-secondary hover:text-primary"
            >
              <ArrowLeft size={24} />
            </button>
            <h1 className="text-2xl font-bold text-primary">Импорт чеков</h1>
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

        <Card className="p-6 space-y-4">
          <p className="text-sm text-secondary">
            Загрузи сразу несколько чеков (PDF или скриншот) — на каждый файл одна операция.
            Работает офлайн, прямо в браузере, распознаёт текст с картинки (это может занять
            несколько секунд на файл).
          </p>

          <div>
            <label className="block text-sm font-medium text-secondary mb-2">Счёт</label>
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

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium text-secondary mb-2">
                Категория расходов
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
                Категория доходов
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

          <label className="w-full h-28 border-2 border-dashed border-line rounded-lg flex flex-col items-center justify-center gap-2 hover:border-blue-500 transition-colors cursor-pointer">
            <Upload className="text-secondary" size={26} />
            <span className="text-sm text-secondary">Выбрать чеки (можно сразу несколько)</span>
            <input
              type="file"
              accept="image/*,.pdf"
              multiple
              className="hidden"
              onChange={(e) => {
                if (e.target.files && e.target.files.length > 0) {
                  handleFiles(e.target.files);
                  e.target.value = '';
                }
              }}
            />
          </label>
        </Card>

        {rows.length > 0 && (
          <Card className="p-4 space-y-3">
            <h2 className="font-semibold text-primary">
              Распознано: {okRows.length} из {rows.length}
              {isProcessing && ' (обработка...)'}
            </h2>

            <div className="space-y-3">
              {rows.map((row) => (
                <div key={row.id} className="border border-line rounded-lg p-3">
                  <div className="flex items-center justify-between mb-2">
                    <p className="text-xs text-secondary truncate">{row.fileName}</p>
                    <button
                      onClick={() => removeRow(row.id)}
                      className="text-secondary hover:text-expense shrink-0"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>

                  {row.status === 'processing' && (
                    <p className="text-sm text-secondary">Распознаём...</p>
                  )}

                  {row.status === 'failed' && (
                    <p className="text-sm text-expense">
                      Не удалось распознать сумму — проверь качество файла или удали эту строку
                    </p>
                  )}

                  {row.status === 'ok' && (
                    <div className="grid grid-cols-2 gap-2">
                      <input
                        type="date"
                        value={row.date}
                        onChange={(e) => updateRow(row.id, { date: e.target.value })}
                        className="px-2 py-1.5 text-sm border border-line rounded-lg bg-surface text-primary outline-none"
                      />
                      <div className="flex items-center gap-1">
                        <button
                          type="button"
                          onClick={() =>
                            updateRow(row.id, {
                              type: row.type === 'expense' ? 'income' : 'expense',
                            })
                          }
                          className={`px-2 py-1.5 text-sm rounded-lg font-medium shrink-0 ${
                            row.type === 'expense'
                              ? 'bg-expense/10 text-expense'
                              : 'bg-income/10 text-income'
                          }`}
                        >
                          {row.type === 'expense' ? 'Расход' : 'Доход'}
                        </button>
                        <input
                          type="number"
                          value={row.amount || ''}
                          onChange={(e) =>
                            updateRow(row.id, { amount: parseFloat(e.target.value) || 0 })
                          }
                          className="w-full px-2 py-1.5 text-sm border border-line rounded-lg bg-surface text-primary outline-none text-right"
                        />
                      </div>
                      <input
                        value={row.title}
                        onChange={(e) => updateRow(row.id, { title: e.target.value })}
                        placeholder="Название"
                        className="col-span-2 px-2 py-1.5 text-sm border border-line rounded-lg bg-surface text-primary outline-none"
                      />
                    </div>
                  )}
                </div>
              ))}
            </div>

            <Button
              fullWidth
              isLoading={isImporting}
              disabled={okRows.length === 0 || isProcessing}
              onClick={handleImport}
            >
              Импортировать {okRows.length}
            </Button>
          </Card>
        )}
      </div>
    </div>
  );
};
