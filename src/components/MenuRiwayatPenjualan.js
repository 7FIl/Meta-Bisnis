"use client";

import { useEffect, useMemo, useRef, useState } from "react";

export default function MenuRiwayatPenjualan({
  businessName = "Bisnis Anda",
  period = "2023-10",
  salesHistoryData = null, // [{tanggal, jam, namaBarang, jumlah}]
}) {
  // fallback contoh data bila tidak diberikan
  const SAMPLE_HISTORY = [
    { tanggal: "2023-10-01", jam: "14:30", namaBarang: "Buku Tulis", jumlah: 5 },
    { tanggal: "2023-10-02", jam: "09:15", namaBarang: "Pensil", jumlah: 2 },
    { tanggal: "2023-10-03", jam: "16:45", namaBarang: "Pulpen", jumlah: 10 },
  ];

  const [history, setHistory] = useState(() => {
    // Try to load from localStorage first
    const savedData = localStorage.getItem(`sales_history_${businessName}_${period}`);
    if (savedData) {
      try {
        return JSON.parse(savedData);
      } catch (e) {
        console.error('Error parsing saved sales data:', e);
      }
    }
    // Fall back to props or sample data
    return salesHistoryData && salesHistoryData.length ? salesHistoryData : SAMPLE_HISTORY;
  });

  const totals = useMemo(() => {
    const totalItems = history.reduce((s, r) => s + (r.jumlah || 0), 0);
    return { totalItems };
  }, [history]);

  // Save to localStorage whenever history changes
  useEffect(() => {
    const storageKey = `sales_history_${businessName}_${period}`;
    localStorage.setItem(storageKey, JSON.stringify(history));
  }, [history, businessName, period]);

  const downloadRef = useRef(null);
  const [exporting, setExporting] = useState(false);
  const [showManualInput, setShowManualInput] = useState(false);
  const [newSale, setNewSale] = useState({
    tanggal: new Date().toISOString().split('T')[0],
    jam: new Date().toTimeString().slice(0, 5),
    namaBarang: '',
    jumlah: ''
  });

  const toCSV = ({ historyRows }) => {
    const rows = [];
    rows.push([`Riwayat Penjualan - ${businessName}`, `Periode: ${period}`]);
    rows.push([]);
    rows.push(["RIWAYAT PENJUALAN"]);
    rows.push(["Tanggal", "Jam", "Nama Barang", "Jumlah"]);
    historyRows.forEach((r) =>
      rows.push([r.tanggal, r.jam || "", r.namaBarang || "", r.jumlah ?? ""])
    );
    rows.push([]);
    rows.push(["RINGKASAN"]);
    rows.push(["Total Barang Terjual", totals.totalItems]);

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
      const csv = toCSV({ historyRows: history });
      const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      const filename = `${businessName.replace(/\s+/g, "_")}_riwayat_penjualan_${period}.csv`;
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

  const handleAddSale = () => {
    if (!newSale.namaBarang.trim() || !newSale.jumlah) return;

    // Add the new sale to the history
    const saleToAdd = {
      tanggal: newSale.tanggal,
      jam: newSale.jam,
      namaBarang: newSale.namaBarang.trim(),
      jumlah: parseInt(newSale.jumlah)
    };

    setHistory(prevHistory => [saleToAdd, ...prevHistory]);

    // Reset form
    setNewSale({
      tanggal: new Date().toISOString().split('T')[0],
      jam: new Date().toTimeString().slice(0, 5),
      namaBarang: '',
      jumlah: ''
    });

    // Hide the form
    setShowManualInput(false);

    console.log('New sale added:', saleToAdd);
  };

  return (
    <div className="bg-white bg-slate-00 p-6 rounded-2xl shadow-sm border border-slate-200 border-slate-700">
      <div className="flex items-start justify-between mb-4">
        <div>
          <h3 className="text-1 font-bold">Riwayat Penjualan</h3>
          <div className="text-l font-bold">{businessName} • Periode: {period}</div>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => setShowManualInput(!showManualInput)}
            className="text-sm bg-blue-600 hover:bg-blue-700 text-white px-3 py-2 rounded-lg"
          >
            <i className="fas fa-plus mr-1"></i>
            Tambahkan
          </button>
          <button onClick={handleExportCSV} disabled={exporting} className="text-sm bg-green-600 hover:bg-green-700 text-white px-3 py-2 rounded-lg">
            {exporting ? "Mengekspor..." : "Export ke Excel (CSV)"}
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-1 gap-4 mb-6">
        <div className="p-4 border border-slate-100 dark:border-slate-700 rounded-lg">
          <div className="block text-s font-semibold text-slate-700 dark:text-slate-900">Total Barang Terjual</div>
          <div className="block text-s font-bold text-slate-800 dark:text-slate-900 mt-1">{totals.totalItems}</div>
        </div>
      </div>

      <div className="mb-6">
        <h3 className="text-1 font-bold">Rincian Riwayat Penjualan</h3>
        <div className="overflow-x-auto border border-slate-200 dark:border-slate-500 rounded-lg">
          <table className="w-full text-sm">
            <thead className="p-4 border border-slate-100 dark:border-slate-100 rounded-lg text-left">
              <tr>
                <th className="px-3 py-2 text-slate-700 dark:text-slate-900">Tanggal</th>
                <th className="px-3 py-2 text-slate-700 dark:text-slate-900">Jam</th>
                <th className="px-3 py-2 text-slate-700 dark:text-slate-900">Nama Barang</th>
                <th className="px-3 py-2 text-slate-700 dark:text-slate-900">Jumlah</th>
              </tr>
            </thead>
            <tbody className="bg-white dark:bg-slate-50">
              {history.map((r, i) => (
                <tr key={i} className="border-t border-slate-100 dark:border-slate-700">
                  <td className="px-3 py-2 text-slate-700 dark:text-slate-900">{r.tanggal}</td>
                  <td className="px-3 py-2 text-slate-700 dark:text-slate-900">{r.jam || "-"}</td>
                  <td className="px-3 py-2 text-slate-700 dark:text-slate-900">{r.namaBarang || "-"}</td>
                  <td className="px-3 py-2 font-semibold text-slate-800 dark:text-slate-900">{r.jumlah ?? "-"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {showManualInput && (
        <div className="mb-6 p-4 border border-slate-200 dark:border-slate-500 rounded-lg bg-slate-50 dark:bg-slate-100">
          <h4 className="text-lg font-bold mb-4">Input Penjualan</h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                Tanggal
              </label>
              <input
                type="date"
                value={newSale.tanggal}
                onChange={(e) => setNewSale({...newSale, tanggal: e.target.value})}
                className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-100 text-slate-800 dark:text-slate-700"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                Jam
              </label>
              <input
                type="time"
                value={newSale.jam}
                onChange={(e) => setNewSale({...newSale, jam: e.target.value})}
                className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-100 text-slate-800 dark:text-slate-700"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                Nama Barang
              </label>
              <input
                type="text"
                value={newSale.namaBarang}
                onChange={(e) => setNewSale({...newSale, namaBarang: e.target.value})}
                placeholder="Masukkan nama barang"
                className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-100 text-slate-800 dark:text-slate-700"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                Jumlah
              </label>
              <input
                type="number"
                value={newSale.jumlah}
                onChange={(e) => setNewSale({...newSale, jumlah: parseInt(e.target.value) || ''})}
                placeholder="Masukkan jumlah"
                min="1"
                className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-100 text-slate-800 dark:text-slate-700"
              />
            </div>
          </div>
          <div className="flex gap-2">
            <button
              onClick={handleAddSale}
              disabled={!newSale.namaBarang.trim() || !newSale.jumlah}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-slate-400 text-white rounded-lg"
            >
              Tambah Penjualan
            </button>
            <button
              onClick={() => setShowManualInput(false)}
              className="px-4 py-2 bg-slate-500 hover:bg-slate-600 text-white rounded-lg"
            >
              Batal
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
