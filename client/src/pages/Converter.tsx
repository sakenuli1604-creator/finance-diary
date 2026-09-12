import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, ArrowLeftRight } from 'lucide-react';
import { useExchangeRatesStore } from '../store/exchangeRatesStore';
import { Card } from '../components/ui/Card';
import { CURRENCIES, convertAmount } from '../utils/currency';

export const Converter: React.FC = () => {
  const navigate = useNavigate();
  const { rates, fetchRates } = useExchangeRatesStore();

  const [amount, setAmount] = useState('100');
  const [from, setFrom] = useState('$');
  const [to, setTo] = useState('₸');

  useEffect(() => {
    fetchRates();
  }, [fetchRates]);

  const numericAmount = parseFloat(amount) || 0;
  const converted = convertAmount(numericAmount, from, to, rates);

  const swap = () => {
    setFrom(to);
    setTo(from);
  };

  return (
    <div className="min-h-screen bg-app pb-24">
      <div className="bg-surface border-b border-line">
        <div className="max-w-2xl mx-auto px-4 py-4">
          <div className="flex items-center gap-3">
            <button onClick={() => navigate('/')} className="text-secondary hover:text-primary">
              <ArrowLeft size={24} />
            </button>
            <h1 className="text-2xl font-bold text-primary">Конвертер валют</h1>
          </div>
        </div>
      </div>

      <div className="max-w-2xl mx-auto px-4 py-6 space-y-6">
        <Card className="p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-secondary mb-2">Сумма</label>
            <input
              type="number"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              className="w-full text-3xl font-bold text-center py-3 border-b-2 border-line focus:border-blue-500 outline-none bg-transparent text-primary"
              autoFocus
            />
          </div>

          <div className="flex items-center gap-3">
            <select
              value={from}
              onChange={(e) => setFrom(e.target.value)}
              className="flex-1 px-4 py-2 border border-line rounded-lg bg-surface text-primary outline-none"
            >
              {CURRENCIES.map((c) => (
                <option key={c.symbol} value={c.symbol}>
                  {c.symbol} — {c.label}
                </option>
              ))}
            </select>

            <button
              onClick={swap}
              className="p-2 rounded-full bg-muted text-secondary hover:text-primary shrink-0"
              title="Поменять местами"
            >
              <ArrowLeftRight size={18} />
            </button>

            <select
              value={to}
              onChange={(e) => setTo(e.target.value)}
              className="flex-1 px-4 py-2 border border-line rounded-lg bg-surface text-primary outline-none"
            >
              {CURRENCIES.map((c) => (
                <option key={c.symbol} value={c.symbol}>
                  {c.symbol} — {c.label}
                </option>
              ))}
            </select>
          </div>

          <div className="text-center py-4 border-t border-line">
            <p className="text-sm text-secondary mb-1">Результат</p>
            <p className="text-3xl font-bold text-primary">
              {converted.toLocaleString('ru-RU', { maximumFractionDigits: 2 })} {to}
            </p>
          </div>
        </Card>

        <Card className="p-4">
          <p className="text-sm text-secondary mb-3">Курс относительно всех валют</p>
          <div className="space-y-2">
            {CURRENCIES.filter((c) => c.symbol !== from).map((c) => (
              <div key={c.symbol} className="flex justify-between text-sm">
                <span className="text-secondary">1 {from}</span>
                <span className="text-primary font-medium">
                  {convertAmount(1, from, c.symbol, rates).toLocaleString('ru-RU', {
                    maximumFractionDigits: 4,
                  })}{' '}
                  {c.symbol}
                </span>
              </div>
            ))}
          </div>
        </Card>
      </div>
    </div>
  );
};
