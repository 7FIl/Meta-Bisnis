"use client";

import { useEffect, useMemo, useState } from "react";
import PeriodFilter from "./PeriodFilter";


export default function MenuRiwayatPenjualan({
  businessName = "Bisnis Anda",
  period = "2023-10",
  salesHistoryData = null, // [{dateTime, kodeBarang, namaBarang, jumlah}]
}) {
  // Parse initial period (YYYY-MM)
  const [currentYear, setCurrentYear] = useState(parseInt(period.split('-')[0]) || 2023);
  const [currentMonth, setCurrentMonth] = useState(parseInt(period.split('-')[1]) || 10);
  const [filterMode, setFilterMode] = useState('all'); // 'all' | 'single' | 'range'
  const [singleDate, setSingleDate] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [showCalendarPopup, setShowCalendarPopup] = useState(false);
  
  // fallback contoh data bila tidak diberikan
  const SAMPLE_HISTORY = [
    { dateTime: "2023/10/01 - 14:30", kodeBarang: "BRG001", namaBarang: "Buku Tulis", jumlah: 5 },
    { dateTime: "2023/10/02 - 09:15", kodeBarang: "BRG002", namaBarang: "Pensil", jumlah: 2 },
    { dateTime: "2023/10/03 - 16:45", kodeBarang: "BRG003", namaBarang: "Pulpen", jumlah: 10 },
  ];

  // Function to migrate old format data to new format
  const migrateOldData = (data) => {
    return data.map(item => {
      // If it's already in new format, return as is
      if (item.dateTime && item.kodeBarang) return item;
      
      // Convert old format (tanggal, jam) to new format (dateTime)
      if (item.tanggal && item.jam) {
        const [year, month, day] = item.tanggal.split('-');
        const dateTime = `${year}/${month}/${day} - ${item.jam}`;
        return {
          dateTime: dateTime,
          kodeBarang: item.kodeBarang || 'LEGACY',
          namaBarang: item.namaBarang,
          jumlah: item.jumlah
        };
      }
      
      // Fallback for incomplete data
      return {
        dateTime: item.dateTime || 'N/A',
        kodeBarang: item.kodeBarang || 'N/A',
        namaBarang: item.namaBarang || 'N/A',
        jumlah: item.jumlah || 0
      };
    });
  };

  const [history, setHistory] = useState(() => {
    // Try to load from localStorage first
    const savedData = localStorage.getItem(`sales_history_${businessName}_${period}`);
    if (savedData) {
      try {
        const parsed = JSON.parse(savedData);
        return migrateOldData(parsed);
      } catch (e) {
        console.error('Error parsing saved sales data:', e);
      }
    }
    // Fall back to props or sample data
    if (salesHistoryData && salesHistoryData.length) {
      return migrateOldData(salesHistoryData);
    }
    return SAMPLE_HISTORY;
  });

  // Calculate auto date range for current month
  const firstDayOfMonth = `${currentYear}-${String(currentMonth).padStart(2, '0')}-01`;
  const lastDayOfMonth = new Date(currentYear, currentMonth, 0).toISOString().split('T')[0];
  
  // Auto update range dates when month/year changes or filter mode changes
  useEffect(() => {
    if (filterMode === 'range') {
      if (!startDate) setStartDate(firstDayOfMonth);
      if (!endDate) setEndDate(lastDayOfMonth);
    }
  }, [currentMonth, currentYear, filterMode]);

  // Filter history by date
  const filteredHistory = useMemo(() => {
    if (filterMode === 'all') return history;
    
    if (filterMode === 'single' && singleDate) {
      return history.filter(h => {
        const dateOnly = h.dateTime.split(' - ')[0].replace(/\//g, '-'); // Convert YYYY/MM/DD to YYYY-MM-DD
        return dateOnly === singleDate;
      });
    }
    
    if (filterMode === 'range' && startDate && endDate) {
      return history.filter(h => {
        const dateOnly = h.dateTime.split(' - ')[0].replace(/\//g, '-'); // Convert YYYY/MM/DD to YYYY-MM-DD
        return dateOnly >= startDate && dateOnly <= endDate;
      });
    }
    
    return history;
  }, [history, filterMode, singleDate, startDate, endDate]);

  const totals = useMemo(() => {
    const totalItems = filteredHistory.reduce((s, r) => s + (r.jumlah || 0), 0);
    return { totalItems };
  }, [filteredHistory]);

  // Save to localStorage whenever history changes
  useEffect(() => {
    const storageKey = `sales_history_${businessName}_${period}`;
    localStorage.setItem(storageKey, JSON.stringify(history));
  }, [history, businessName, period]);

  const [exporting, setExporting] = useState(false);
  const [showManualInput, setShowManualInput] = useState(false);
  const [newSale, setNewSale] = useState({
    kodeBarang: '',
    namaBarang: '',
    jumlah: ''
  });

  const toCSV = ({ historyRows }) => {
    const rows = [];
    rows.push([`Riwayat Penjualan - ${businessName}`, `Periode: ${period}`]);
    rows.push([]);
    rows.push(["RIWAYAT PENJUALAN"]);
    rows.push(["Tanggal & Waktu", "Kode Barang", "Nama Barang", "Jumlah"]);
    historyRows.forEach((r) =>
      rows.push([r.dateTime || "", r.kodeBarang || "", r.namaBarang || "", r.jumlah ?? ""])
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
      const csv = toCSV({ historyRows: filteredHistory });
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
    if (!newSale.namaBarang.trim() || !newSale.jumlah || !newSale.kodeBarang.trim()) return;

    // Create dateTime in format "YYYY/MM/DD - HH:MM"
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');
    const hours = String(now.getHours()).padStart(2, '0');
    const minutes = String(now.getMinutes()).padStart(2, '0');
    const dateTime = `${year}/${month}/${day} - ${hours}:${minutes}`;

    // Add the new sale to the history
    const saleToAdd = {
      dateTime: dateTime,
      kodeBarang: newSale.kodeBarang.trim(),
      namaBarang: newSale.namaBarang.trim(),
      jumlah: parseInt(newSale.jumlah)
    };

    setHistory(prevHistory => [saleToAdd, ...prevHistory]);

    // Reset form
    setNewSale({
      kodeBarang: '',
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
                <th className="px-3 py-2 text-slate-700 dark:text-slate-900">Tanggal & Waktu</th>
                <th className="px-3 py-2 text-slate-700 dark:text-slate-900">Kode Barang</th>
                <th className="px-3 py-2 text-slate-700 dark:text-slate-900">Nama Barang</th>
                <th className="px-3 py-2 text-slate-700 dark:text-slate-900">Jumlah</th>
              </tr>
            </thead>
            <tbody className="bg-white dark:bg-slate-50">
              {filteredHistory.map((r, i) => (
                <tr key={i} className="border-t border-slate-100 dark:border-slate-700">
                  <td className="px-3 py-2 text-slate-700 dark:text-slate-900">{r.dateTime}</td>
                  <td className="px-3 py-2 text-slate-700 dark:text-slate-900">{r.kodeBarang || "-"}</td>
                  <td className="px-3 py-2 text-slate-700 dark:text-slate-900">{r.namaBarang || "-"}</td>
                  <td className="px-3 py-2 font-semibold text-slate-800 dark:text-slate-900">{r.jumlah ?? "-"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {showManualInput && (
        <div className="mb-6 p-4 border border-slate-200 dark:border-slate-500 rounded-lg bg-slate-50 dark:bg-slate-700">
          <h4 className="text-lg font-bold mb-4">Input Penjualan</h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                Kode Barang
              </label>
              <input
                type="text"
                value={newSale.kodeBarang}
                onChange={(e) => setNewSale({...newSale, kodeBarang: e.target.value})}
                placeholder="Masukkan kode barang"
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
          <div className="text-xs text-slate-600 dark:text-slate-400 mb-4">
            <i className="fas fa-info-circle mr-1"></i>
            Tanggal dan waktu akan otomatis diisi saat penjualan ditambahkan
          </div>
          <div className="flex gap-2">
            <button
              onClick={handleAddSale}
              disabled={!newSale.namaBarang.trim() || !newSale.jumlah || !newSale.kodeBarang.trim()}
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
