// src/components/MenuKeuangan.js
"use client";

import { useEffect, useMemo, useState } from "react";
import PeriodFilter from "./PeriodFilter";

export default function MenuKeuangan({
  businessName = "Bisnis Anda",
  period = "2025-12",
  salesData = null, // [{itemCode, product, qty, price}]
  incomes = null,   // [{source, amount}]
  marketingExpenses = null, // [{channel, amount, note}]
}) {
  // Parse initial period (YYYY-MM)
  const [currentYear, setCurrentYear] = useState(parseInt(period.split('-')[0]) || 2025);
  const [currentMonth, setCurrentMonth] = useState(parseInt(period.split('-')[1]) || 12);
  const [filterMode, setFilterMode] = useState('all'); // 'all' | 'single' | 'range'
  const [singleDate, setSingleDate] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [showCalendarPopup, setShowCalendarPopup] = useState(false);
  
  // fallback contoh data bila tidak diberikan
  const SAMPLE_SALES = [
    { date: "2025-12-05", itemCode: "BRG001", product: "Nasi Goreng", qty: 10, price: 25000 },
    { date: "2025-12-06", itemCode: "BRG002", product: "Es Teh", qty: 20, price: 5000 },
  ];
  const SAMPLE_INCOMES = [
    { date: "2025-12-05", source: "Penjualan offline", amount: 200000 },
    { date: "2025-12-06", source: "Penjualan online", amount: 150000 },
  ];
  const SAMPLE_MARKETING = [
    { date: "2025-12-03", channel: "Instagram Ads", amount: 50000, note: "Promo weekend" },
    { date: "2025-12-04", channel: "Flyer", amount: 20000, note: "Distribusi lokal" },
  ];

  const sales = salesData && salesData.length ? salesData : SAMPLE_SALES;
  const incs = incomes && incomes.length ? incomes : SAMPLE_INCOMES;
  const mkt = marketingExpenses && marketingExpenses.length ? marketingExpenses : SAMPLE_MARKETING;

  const currency = (v) =>
    new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", maximumFractionDigits: 0 }).format(v);

  // Calculate auto date range for current month
  const firstDayOfMonth = new Date(currentYear, currentMonth - 1, 1).toISOString().split('T')[0];
  const lastDayOfMonth = new Date(currentYear, currentMonth, 0).toISOString().split('T')[0];
  
  // Auto update range dates when month/year changes or filter mode changes
  useEffect(() => {
    if (filterMode === 'range') {
      // Initialize dengan hari pertama dan terakhir bulan jika belum ada
      if (!startDate) setStartDate(firstDayOfMonth);
      if (!endDate) setEndDate(lastDayOfMonth);
    }
  }, [currentMonth, currentYear, filterMode]);

  // Apply date filter to all data
  const filteredSales = useMemo(() => {
    if (filterMode === 'all') return sales;
    
    if (filterMode === 'single' && singleDate) {
      return sales.filter(s => s.date === singleDate);
    }
    
    if (filterMode === 'range' && startDate && endDate) {
      return sales.filter(s => s.date >= startDate && s.date <= endDate);
    }
    
    return sales;
  }, [sales, filterMode, singleDate, startDate, endDate]);

  const filteredIncomes = useMemo(() => {
    if (filterMode === 'all') return incs;
    
    if (filterMode === 'single' && singleDate) {
      return incs.filter(i => i.date === singleDate);
    }
    
    if (filterMode === 'range' && startDate && endDate) {
      return incs.filter(i => i.date >= startDate && i.date <= endDate);
    }
    
    return incs;
  }, [incs, filterMode, singleDate, startDate, endDate]);

  const filteredMarketing = useMemo(() => {
    if (filterMode === 'all') return mkt;
    
    if (filterMode === 'single' && singleDate) {
      return mkt.filter(m => m.date === singleDate);
    }
    
    if (filterMode === 'range' && startDate && endDate) {
      return mkt.filter(m => m.date >= startDate && m.date <= endDate);
    }
    
    return mkt;
  }, [mkt, filterMode, singleDate, startDate, endDate]);

  const totals = useMemo(() => {
    const totalSales = filteredSales.reduce((s, r) => s + (r.qty ? r.qty * (r.price || 0) : (r.amount || 0)), 0);
    const totalIncome = filteredIncomes.reduce((s, r) => s + (r.amount || 0), 0);
    const totalMarketing = filteredMarketing.reduce((s, r) => s + (r.amount || 0), 0);
    const net = totalIncome - totalMarketing;
    return { totalSales, totalIncome, totalMarketing, net };
  }, [filteredSales, filteredIncomes, filteredMarketing]);

  const [exporting, setExporting] = useState(false);

  const toCSV = ({ salesRows, incomeRows, marketingRows }) => {
    const rows = [];
    rows.push([`Laporan Keuangan - ${businessName}`, `Periode: ${period}`]);
    rows.push([]);
    rows.push(["PENJUALAN"]);
    rows.push(["Tanggal", "Kode Barang", "Produk", "Qty", "Harga Satuan", "Total"]);
    salesRows.forEach((r) =>
      rows.push([r.date || "", r.itemCode || "", r.product || "", r.qty ?? "", r.price ?? "", r.total ?? ""])
    );
    rows.push([]);
    rows.push(["PENDAPATAN LAIN"]);
    rows.push(["Tanggal", "Sumber", "Jumlah"]);
    incomeRows.forEach((r) => rows.push([r.date || "", r.source || "", r.amount ?? ""]));
    rows.push([]);
    rows.push(["PENGELUARAN PEMASARAN"]);
    rows.push(["Tanggal", "Kanal", "Jumlah", "Catatan"]);
    marketingRows.forEach((r) => rows.push([r.date || "", r.channel || "", r.amount ?? "", r.note || ""]));
    rows.push([]);
    rows.push(["RINGKASAN"]);
    rows.push(["Total Penjualan", totals.totalSales]);
    rows.push(["Total Pendapatan", totals.totalIncome]);
    rows.push(["Total Pemasaran", totals.totalMarketing]);
    rows.push(["NET (Pendapatan - Pemasaran)", totals.net]);

    // Convert rows to CSV string
    return rows
      .map((r) =>
        r
          .map((cell) => {
            if (cell === null || cell === undefined) return "";
            const s = String(cell).replace(/"/g, '""');
            return `"${s}"`;
          })
          .join(",")
      )
      .join("\r\n");
  };

  const handleExportCSV = async () => {
    setExporting(true);
    try {
      const salesRows = sales.map((s) => ({
        ...s,
        total: s.qty ? s.qty * (s.price || 0) : s.amount || 0,
      }));
      const csv = toCSV({ salesRows, incomeRows: incs, marketingRows: mkt });
      const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      const filename = `${businessName.replace(/\s+/g, "_")}_laporan_keuangan_${period}.csv`;
      a.setAttribute("download", filename);
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
    } catch (err) {
      console.error(err);
    } finally {
      setExporting(false);
    }
  };

  return (
    <div className="bg-white bg-slate-00 p-6 rounded-2xl shadow-sm border border-slate-200 border-slate-700">
      <div className="flex items-start justify-between mb-4">
        <div>
          <h3 className="text-1 font-bold">Laporan Keuangan</h3>
          <div className="text-l font-bold flex items-center gap-4 mt-2">
            <span>{businessName}</span>
            
            <PeriodFilter
              currentYear={currentYear}
              currentMonth={currentMonth}
              onYearChange={setCurrentYear}
              onMonthChange={setCurrentMonth}
              filterMode={filterMode}
              onFilterModeChange={setFilterMode}
              singleDate={singleDate}
              onSingleDateChange={setSingleDate}
              startDate={startDate}
              endDate={endDate}
              onStartDateChange={setStartDate}
              onEndDateChange={setEndDate}
              showCalendarPopup={showCalendarPopup}
              onCalendarPopupToggle={setShowCalendarPopup}
            />
          </div>
        </div>

        <div className="flex gap-2">
          <button onClick={handleExportCSV} disabled={exporting} className="text-sm bg-green-600 hover:bg-green-700 text-white px-3 py-2 rounded-lg">
            {exporting ? "Mengekspor..." : "Export ke Excel (CSV)"}
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <div className="p-4 border border-slate-100 dark:border-slate-700 rounded-lg">
          <div className="block text-s font-semibold text-slate-700 dark:text-slate-900">Total Penjualan</div>
          <div className="block text-s font-bold text-slate-800 dark:text-slate-900 mt-1">{currency(totals.totalSales)}</div>
        </div>
        <div className="p-4 border border-slate-100 dark:border-slate-700 rounded-lg">
          <div className="block text-s font-semibold text-slate-700 dark:text-slate-900">Total Pendapatan</div>
          <div className="block text-s font-bold text-slate-800 dark:text-slate-900 mt-1">{currency(totals.totalIncome)}</div>
        </div>
        <div className="p-4 border border-slate-100 dark:border-slate-700 rounded-lg">
          <div className="block text-s font-semibold text-slate-700 dark:text-slate-900">Total Pemasaran</div>
          <div className="block text-s font-bold text-slate-800 dark:text-slate-900 mt-1">{currency(totals.totalMarketing)}</div>
        </div>
      </div>

      <div className="mb-6">
        <h3 className="text-1 font-bold">Rincian Penjualan</h3>
        <div className="overflow-x-auto border border-slate-200 dark:border-slate-500 rounded-lg">
          <table className="w-full text-sm">
            <thead className="p-4 border border-slate-100 dark:border-slate-100 rounded-lg text-left">
              <tr>
                <th className="px-3 py-2 text-slate-700 dark:text-slate-900">Tanggal</th>
                <th className="px-3 py-2 text-slate-700 dark:text-slate-900">Kode Barang</th>
                <th className="px-3 py-2 text-slate-700 dark:text-slate-900">Produk</th>
                <th className="px-3 py-2 text-slate-700 dark:text-slate-900">Qty</th>
                <th className="px-3 py-2 text-slate-700 dark:text-slate-900">Harga</th>
                <th className="px-3 py-2 text-slate-700 dark:text-slate-900">Total</th>
              </tr>
            </thead>
            <tbody className="bg-white dark:bg-slate-50">
              {filteredSales.map((r, i) => {
                const total = r.qty ? r.qty * (r.price || 0) : r.amount || 0;
                return (
                  <tr key={i} className="border-t border-slate-100 dark:border-slate-700">
                    <td className="px-3 py-2 text-slate-700 dark:text-slate-900">{r.date || "-"}</td>
                    <td className="px-3 py-2 text-slate-700 dark:text-slate-900">{r.itemCode || "-"}</td>
                    <td className="px-3 py-2 text-slate-700 dark:text-slate-900">{r.product || "-"}</td>
                    <td className="px-3 py-2 text-slate-700 dark:text-slate-900">{r.qty ?? "-"}</td>
                    <td className="px-3 py-2 text-slate-700 dark:text-slate-900">{r.price ? currency(r.price) : "-"}</td>
                    <td className="px-3 py-2 font-semibold text-slate-800 dark:text-slate-900">{currency(total)}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      <div className="mb-6">
        <h3 className="text-l font-bold">Pendapatan Lain</h3>
        <div className="overflow-x-auto border border-slate-200 dark:border-slate-500 rounded-lg">
          <table className="w-full text-sm">
            <thead className="p-4 border border-slate-100 dark:border-slate-100 rounded-lg text-left">
              <tr>
                <th className="px-3 py-2 text-slate-700 dark:text-slate-900">Tanggal</th>
                <th className="px-3 py-2 text-slate-700 dark:text-slate-900">Sumber</th>
                <th className="px-3 py-2 text-slate-700 dark:text-slate-900">Jumlah</th>
              </tr>
            </thead>
            <tbody className="bg-white dark:bg-slate-50">
              {filteredIncomes.map((r, i) => (
                <tr key={i} className="border-t border-slate-100 dark:border-slate-700">
                  <td className="px-3 py-2 text-slate-700 dark:text-slate-900">{r.date || "-"}</td>
                  <td className="px-3 py-2 text-slate-700 dark:text-slate-900">{r.source}</td>
                  <td className="px-3 py-2 font-semibold text-slate-800 dark:text-slate-900">{currency(r.amount)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div className="mb-4">
        <h3 className="text-l font-bold">Pengeluaran Pemasaran</h3>
        <div className="overflow-x-auto border border-slate-200 dark:border-slate-500 rounded-lg">
          <table className="w-full text-sm">
            <thead className="p-4 border border-slate-100 dark:border-slate-100 rounded-lg text-left">
              <tr>
                <th className="px-3 py-2 text-slate-700 dark:text-slate-900">Tanggal</th>
                <th className="px-3 py-2 text-slate-700 dark:text-slate-900">Kanal</th>
                <th className="px-3 py-2 text-slate-700 dark:text-slate-900">Jumlah</th>
                <th className="px-3 py-2 text-slate-700 dark:text-slate-900">Catatan</th>
              </tr>
            </thead>
            <tbody className="bg-white dark:bg-slate-50">
              {filteredMarketing.map((r, i) => (
                <tr key={i} className="border-t border-slate-100 dark:border-slate-700">
                  <td className="px-3 py-2 text-slate-700 dark:text-slate-900">{r.date || "-"}</td>
                  <td className="px-3 py-2 text-slate-700 dark:text-slate-900">{r.channel}</td>
                  <td className="px-3 py-2 font-semibold text-slate-800 dark:text-slate-900">{currency(r.amount)}</td>
                  <td className="px-3 py-2 text-slate-700 dark:text-slate-900">{r.note || "-"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div className="pt-3 border-t border-slate-200 dark:border-slate-700">
        <div className="flex justify-between items-center">
          <div className="text-s font-bold">NET (Pendapatan - Pemasaran)</div>
          <div className="text-s font-bold">{currency(totals.net)}</div>
        </div>
      </div>
    </div>
  );
}