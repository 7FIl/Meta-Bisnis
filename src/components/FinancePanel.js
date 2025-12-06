// src/components/FinancePanel.js
'use client';

import { useState, useEffect } from 'react';

export default function FinancePanel({ transactions, onAddTransaction }) {
  const [desc, setDesc] = useState('');
  const [amount, setAmount] = useState('');
  const [type, setType] = useState('in');
  const [balance, setBalance] = useState(0);
  const [income, setIncome] = useState(0);
  const [expense, setExpense] = useState(0);

  useEffect(() => {
    // Hitung balance dari transactions
    let totalBalance = 0;
    let totalIncome = 0;
    let totalExpense = 0;

    transactions.forEach((t) => {
      if (t.type === 'in') {
        totalBalance += t.amount;
        totalIncome += t.amount;
      } else {
        totalBalance -= t.amount;
        totalExpense += t.amount;
      }
    });

    setBalance(totalBalance);
    setIncome(totalIncome);
    setExpense(totalExpense);
  }, [transactions]);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!desc || !amount) return;

    const transaction = {
      id: Date.now(),
      desc,
      amount: parseInt(amount),
      type,
      date: new Date().toLocaleDateString('id-ID'),
    };

    onAddTransaction(transaction);
    setDesc('');
    setAmount('');
    setType('in');
  };

  return (
    <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-700 lg:col-span-1 h-fit">
      <h3 className="font-bold text-slate-800 dark:text-slate-100 mb-4 flex items-center gap-2">
        <i className="fas fa-cash-register text-green-500"></i> Kasir & Keuangan
      </h3>

      {/* Summary Card */}
      <div className="bg-slate-50 dark:bg-slate-700 rounded-xl p-4 mb-6 border border-slate-100 dark:border-slate-600">
        <p className="text-xs text-slate-500 dark:text-slate-400 uppercase font-semibold">Saldo Saat Ini</p>
        <h2 className="text-2xl font-bold text-slate-800 dark:text-slate-100 mt-1">
          Rp {balance.toLocaleString('id-ID')}
        </h2>
        <div className="flex gap-2 mt-2 text-xs">
          <span className="text-green-600 bg-green-100 px-2 py-0.5 rounded flex items-center">
            <i className="fas fa-arrow-up mr-1"></i> {income.toLocaleString('id-ID')}
          </span>
          <span className="text-red-600 bg-red-100 px-2 py-0.5 rounded flex items-center">
            <i className="fas fa-arrow-down mr-1"></i> {expense.toLocaleString('id-ID')}
          </span>
        </div>
      </div>

      {/* Input Form */}
      <form onSubmit={handleSubmit} className="space-y-3">
        <div>
          <label className="block text-xs font-medium text-slate-600 dark:text-slate-300 mb-1">
            Keterangan
          </label>
          <input
            type="text"
            value={desc}
            onChange={(e) => setDesc(e.target.value)}
            required
            placeholder="Cth: Jual Kopi, Beli Susu"
            className="w-full text-sm p-2 border border-slate-300 dark:border-slate-600 rounded-lg focus:ring-1 focus:ring-blue-500 outline-none bg-white dark:bg-slate-700 dark:text-slate-200"
          />
        </div>
        <div className="flex gap-2">
          <div className="flex-1">
            <label className="block text-xs font-medium text-slate-600 dark:text-slate-300 mb-1">
              Jumlah (Rp)
            </label>
            <input
              type="number"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              required
              placeholder="0"
              className="w-full text-sm p-2 border border-slate-300 dark:border-slate-600 rounded-lg focus:ring-1 focus:ring-blue-500 outline-none bg-white dark:bg-slate-700 dark:text-slate-200"
            />
          </div>
          <div className="w-1/3">
            <label className="block text-xs font-medium text-slate-600 dark:text-slate-300 mb-1">
              Tipe
            </label>
            <select
              value={type}
              onChange={(e) => setType(e.target.value)}
              className="w-full text-sm p-2 border border-slate-300 dark:border-slate-600 rounded-lg outline-none bg-white dark:bg-slate-700 dark:text-slate-200"
            >
              <option value="in">Masuk</option>
              <option value="out">Keluar</option>
            </select>
          </div>
        </div>
        <button
          type="submit"
          className="w-full bg-slate-800 hover:bg-slate-900 dark:bg-blue-600 dark:hover:bg-blue-700 text-white py-2 rounded-lg text-sm font-medium transition-colors"
        >
          Catat Transaksi
        </button>
      </form>

      {/* Recent List */}
      <div className="mt-6">
        <h4 className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase mb-2">
          Riwayat Terakhir
        </h4>
        <ul className="space-y-2 text-sm max-h-40 overflow-y-auto pr-1">
          {transactions.length === 0 ? (
            <li className="text-center text-slate-400 text-xs py-2 italic">
              Belum ada transaksi
            </li>
          ) : (
            transactions.map((t) => (
              <li
                key={t.id}
                className="flex justify-between items-center bg-slate-50 dark:bg-slate-900 p-2 rounded border border-slate-100 dark:border-slate-700"
              >
                <span className="text-slate-700 dark:text-slate-300 truncate w-1/2">{t.desc}</span>
                <span
                  className={`font-bold ${t.type === 'in' ? 'text-green-600' : 'text-red-600'
                    }`}
                >
                  {t.type === 'in' ? '+' : '-'} {t.amount.toLocaleString('id-ID')}
                </span>
              </li>
            ))
          )}
        </ul>
      </div>
    </div>
  );
}