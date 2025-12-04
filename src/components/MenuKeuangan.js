// src/components/MenuKeuangan.js
"use client";

import { useEffect, useMemo, useRef, useState } from "react";

export default function MenuKeuangan({
  businessName = "Bisnis Anda",
  period = "2025-12",
  salesData = null, // [{date, orderId, product, qty, price}]
  incomes = null,   // [{date, source, amount}]
  marketingExpenses = null, // [{date, channel, amount, note}]
}) {
  // fallback contoh data bila tidak diberikan
  const SAMPLE_SALES = [
    { date: "2025-11-24", orderId: "ORD001", product: "Nasi Goreng", qty: 10, price: 25000 },
    { date: "2025-11-25", orderId: "ORD002", product: "Es Teh", qty: 20, price: 5000 },
  ];
  const SAMPLE_INCOMES = [
    { date: "2025-11-24", source: "Penjualan offline", amount: 200000 },
    { date: "2025-11-25", source: "Penjualan online", amount: 150000 },
  ];
  const SAMPLE_MARKETING = [
    { date: "2025-11-20", channel: "Instagram Ads", amount: 50000, note: "Promo weekend" },
    { date: "2025-11-22", channel: "Flyer", amount: 20000, note: "Distribusi lokal" },
  ];

  const sales = salesData && salesData.length ? salesData : SAMPLE_SALES;
  const incs = incomes && incomes.length ? incomes : SAMPLE_INCOMES;
  const mkt = marketingExpenses && marketingExpenses.length ? marketingExpenses : SAMPLE_MARKETING;

  const currency = (v) =>
    new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", maximumFractionDigits: 0 }).format(v);

  const totals = useMemo(() => {
    const totalSales = sales.reduce((s, r) => s + (r.qty ? r.qty * (r.price || 0) : (r.amount || 0)), 0);
    const totalIncome = incs.reduce((s, r) => s + (r.amount || 0), 0);
    const totalMarketing = mkt.reduce((s, r) => s + (r.amount || 0), 0);
    const net = totalIncome - totalMarketing;
    return { totalSales, totalIncome, totalMarketing, net };
  }, [sales, incs, mkt]);

  const downloadRef = useRef(null);
  const [exporting, setExporting] = useState(false);

  const toCSV = ({ salesRows, incomeRows, marketingRows }) => {
    const rows = [];
    rows.push([`Laporan Keuangan - ${businessName}`, `Periode: ${period}`]);
    rows.push([]);
    rows.push(["PENJUALAN"]);
    rows.push(["Tanggal", "OrderId", "Produk", "Qty", "Harga Satuan", "Total"]);
    salesRows.forEach((r) =>
      rows.push([r.date, r.orderId || "", r.product || "", r.qty ?? "", r.price ?? "", r.total ?? ""])
    );
    rows.push([]);
    rows.push(["PENDAPATAN LAIN"]);
    rows.push(["Tanggal", "Sumber", "Jumlah"]);
    incomeRows.forEach((r) => rows.push([r.date, r.source || "", r.amount ?? ""]));
    rows.push([]);
    rows.push(["PENGELUARAN PEMASARAN"]);
    rows.push(["Tanggal", "Kanal", "Jumlah", "Catatan"]);
    marketingRows.forEach((r) => rows.push([r.date, r.channel || "", r.amount ?? "", r.note || ""]));
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
    <div className="bg-white bg-slate-800 p-6 rounded-2xl shadow-sm border border-slate-200 border-slate-700">
      <div className="flex items-start justify-between mb-4">
        <div>
          <h3 className="text-xl font-bold">Laporan Keuangan</h3>
          <div className="text-l font-bold">{businessName} • Periode: {period}</div>
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
          <div className="block text-xl font-bold text-slate-800 dark:text-slate-900 mt-1">{currency(totals.totalSales)}</div>
        </div>
        <div className="p-4 border border-slate-100 dark:border-slate-700 rounded-lg">
          <div className="block text-s font-semibold text-slate-700 dark:text-slate-900">Total Pendapatan</div>
          <div className="block text-xl font-bold text-slate-800 dark:text-slate-900 mt-1">{currency(totals.totalIncome)}</div>
        </div>
        <div className="p-4 border border-slate-100 dark:border-slate-700 rounded-lg">
          <div className="block text-s font-semibold text-slate-700 dark:text-slate-900">Total Pemasaran</div>
          <div className="block text-xl font-bold text-slate-800 dark:text-slate-900 mt-1">{currency(totals.totalMarketing)}</div>
        </div>
      </div>

      <div className="mb-6">
        <h4 className="text-xl font-bold">Rincian Penjualan</h4>
        <div className="overflow-x-auto border border-slate-200 dark:border-slate-500 rounded-lg">
          <table className="w-full text-sm">
            <thead className="p-4 border border-slate-100 dark:border-slate-100 rounded-lg text-left">
              <tr>
                <th className="px-3 py-2 text-slate-700 dark:text-slate-900">Tanggal</th>
                <th className="px-3 py-2 text-slate-700 dark:text-slate-900">Order</th>
                <th className="px-3 py-2 text-slate-700 dark:text-slate-900">Produk</th>
                <th className="px-3 py-2 text-slate-700 dark:text-slate-900">Qty</th>
                <th className="px-3 py-2 text-slate-700 dark:text-slate-900">Harga</th>
                <th className="px-3 py-2 text-slate-700 dark:text-slate-900">Total</th>
              </tr>
            </thead>
            <tbody className="bg-white dark:bg-slate-50">
              {sales.map((r, i) => {
                const total = r.qty ? r.qty * (r.price || 0) : r.amount || 0;
                return (
                  <tr key={i} className="border-t border-slate-100 dark:border-slate-700">
                    <td className="px-3 py-2 text-slate-700 dark:text-slate-900">{r.date}</td>
                    <td className="px-3 py-2 text-slate-700 dark:text-slate-900">{r.orderId || "-"}</td>
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
        <h4 className="text-xl font-bold">Pendapatan Lain</h4>
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
              {incs.map((r, i) => (
                <tr key={i} className="border-t border-slate-100 dark:border-slate-700">
                  <td className="px-3 py-2 text-slate-700 dark:text-slate-900">{r.date}</td>
                  <td className="px-3 py-2 text-slate-700 dark:text-slate-900">{r.source}</td>
                  <td className="px-3 py-2 font-semibold text-slate-800 dark:text-slate-900">{currency(r.amount)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div className="mb-4">
        <h4 className="text-xl font-bold">Pengeluaran Pemasaran</h4>
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
              {mkt.map((r, i) => (
                <tr key={i} className="border-t border-slate-100 dark:border-slate-700">
                  <td className="px-3 py-2 text-slate-700 dark:text-slate-900">{r.date}</td>
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
          <div className="text-xl font-bold">NET (Pendapatan - Pemasaran)</div>
          <div className="text-xl font-bold">{currency(totals.net)}</div>
        </div>
      </div>
    </div>
  );
}