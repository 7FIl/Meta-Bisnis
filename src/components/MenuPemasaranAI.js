"use client";

import { useEffect, useRef, useState } from "react";

export default function MenuPemasaranAI({ businessName, onSave, salesData }) {
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [duration, setDuration] = useState("00:30"); // format mm:ss
  const [igUrl, setIgUrl] = useState("");
  const [tiktokUrl, setTiktokUrl] = useState("");
  const [fbUrl, setFbUrl] = useState("");
  const [toast, setToast] = useState("");
  const toastRef = useRef(null);

  // Chart refs & state
  const chartRef = useRef(null);
  const chartInstanceRef = useRef(null);
  const [chartType, setChartType] = useState("radar"); // 'radar' | 'line' | 'bar'

  // fallback sample sales data (weekly)
  const SAMPLE_SALES = {
    labels: ["Sen", "Sel", "Rab", "Kam", "Jum", "Sab", "Min"],
    values: [12, 19, 7, 14, 22, 18, 16],
  };

  const sales = salesData && salesData.length
    ? { labels: salesData.map(s => s.label), values: salesData.map(s => s.value) }
    : SAMPLE_SALES;

  const showToast = (msg = "Sukses") => {
    setToast(msg);
    clearTimeout(toastRef.current);
    toastRef.current = setTimeout(() => setToast(""), 2500);
  };

  const handleGenerate = () => {
    if (!title) {
      showToast("Isi judul konten terlebih dahulu");
      return;
    }
    setContent(
      `Judul: ${title}\n\nDeskripsi singkat: Ide konten untuk "${title}" — tampilkan keunggulan ${businessName || "bisnis Anda"}, CTA ke WhatsApp/IG. Durasi: ${duration}.`
    );
    showToast("Konten dibuat");
  };

  const handleCopy = async () => {
    try {
      if (navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(content);
      } else {
        const ta = document.createElement("textarea");
        ta.value = content;
        document.body.appendChild(ta);
        ta.select();
        document.execCommand("copy");
        document.body.removeChild(ta);
      }
      showToast("Teks berhasil disalin");
    } catch {
      showToast("Gagal menyalin");
    }
  };

  const handleSave = () => {
    const payload = { title, content, duration, igUrl, tiktokUrl, fbUrl };
    if (onSave) onSave(payload);
    showToast("Konten disimpan");
  };

  // render chart helper
  const renderChart = (type = chartType) => {
    if (typeof window === "undefined" || !window.Chart || !chartRef.current) return;

    if (chartInstanceRef.current) {
      chartInstanceRef.current.destroy();
      chartInstanceRef.current = null;
    }

    const ctx = chartRef.current.getContext("2d");

    const commonDataset = {
      label: "Penjualan",
      data: sales.values,
      backgroundColor: type === "radar"
        ? "rgba(59,130,246,0.15)"
        : "rgba(59,130,246,0.25)",
      borderColor: "rgb(59,130,246)",
      tension: 0.3,
      fill: type !== "bar" ? true : false,
    };

    const config = {
      type: type,
      data: {
        labels: sales.labels,
        datasets: [commonDataset],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: { legend: { display: type !== "line" ? true : false } },
        scales: type === "radar" ? {} : {
          y: { beginAtZero: true, grid: { color: "rgba(15,23,42,0.05)" } },
          x: { grid: { display: false } },
        },
      },
    };

    chartInstanceRef.current = new window.Chart(ctx, config);
  };

  useEffect(() => {
    // initial render
    renderChart(chartType);
    return () => {
      if (chartInstanceRef.current) chartInstanceRef.current.destroy();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    // re-render when chart type or sales data changes
    renderChart(chartType);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [chartType, sales.labels.join(","), sales.values.join(",")]);

  useEffect(() => {
    return () => clearTimeout(toastRef.current);
  }, []);

  return (
    <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-bold text-slate-800">Studio Konten Otomatis</h3>
        <span className="text-xs text-slate-500">{businessName}</span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-3">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Judul Konten</label>
            <input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Contoh: Promo Nasi Goreng Spesial"
              className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Durasi (mm:ss)</label>
            <input
              value={duration}
              onChange={(e) => setDuration(e.target.value)}
              className="w-40 px-3 py-2 border border-slate-300 rounded-lg text-sm"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Tautan IG</label>
            <input
              value={igUrl}
              onChange={(e) => setIgUrl(e.target.value)}
              placeholder="https://instagram.com/username"
              className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Tautan TikTok</label>
            <input
              value={tiktokUrl}
              onChange={(e) => setTiktokUrl(e.target.value)}
              placeholder="https://tiktok.com/@username"
              className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Tautan Facebook</label>
            <input
              value={fbUrl}
              onChange={(e) => setFbUrl(e.target.value)}
              placeholder="https://facebook.com/page"
              className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm"
            />
          </div>

          <div className="flex gap-2 mt-2">
            <button
              onClick={handleGenerate}
              className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg text-sm"
            >
              Generate
            </button>
            <button
              onClick={handleCopy}
              disabled={!content}
              className="bg-slate-100 hover:bg-slate-200 text-slate-800 px-4 py-2 rounded-lg text-sm"
            >
              Copy
            </button>
            <button
              onClick={handleSave}
              className="ml-auto bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg text-sm"
            >
              Simpan
            </button>
          </div>
        </div>

        <div className="space-y-3">
          {/* Chart controls */}
          <div className="flex items-center justify-between">
            <div>
              <label className="block text-xs font-semibold text-slate-700">Grafik Penjualan</label>
              <div className="text-xs text-slate-500">Tampilkan data penjualan dalam bentuk grafik</div>
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => setChartType("radar")}
                className={`px-3 py-1 text-xs rounded ${chartType === "radar" ? "bg-slate-900 text-white" : "bg-slate-100 text-slate-700"}`}
              >
                Radar
              </button>
              <button
                onClick={() => setChartType("line")}
                className={`px-3 py-1 text-xs rounded ${chartType === "line" ? "bg-slate-900 text-white" : "bg-slate-100 text-slate-700"}`}
              >
                Line
              </button>
              <button
                onClick={() => setChartType("bar")}
                className={`px-3 py-1 text-xs rounded ${chartType === "bar" ? "bg-slate-900 text-white" : "bg-slate-100 text-slate-700"}`}
              >
                Bar
              </button>
            </div>
          </div>

          <div className="w-full h-44 p-2 border border-slate-100 rounded-lg bg-white">
            <canvas ref={chartRef} className="w-full h-full" />
          </div>

          <label className="block text-xs font-semibold text-slate-700 mb-1">Preview Isi Konten</label>
          <div className="w-full h-44 p-3 border border-slate-100 rounded-lg bg-slate-50 text-sm overflow-y-auto whitespace-pre-wrap">
            {content || <span className="text-slate-400">Preview akan muncul di sini setelah generate.</span>}
          </div>

          <div className="pt-2 text-xs text-slate-500">
            Tips: tambahkan CTA jelas dan gunakan durasi sesuai platform (IG Reels 15-60s, TikTok 15-60s, FB 30-120s).
          </div>

          <div className="flex gap-2 pt-3">
            <a href={igUrl || "#"} target="_blank" rel="noreferrer" className="text-xs text-pink-600 hover:underline">
              Buka IG
            </a>
            <a href={tiktokUrl || "#"} target="_blank" rel="noreferrer" className="text-xs text-red-600 hover:underline">
              Buka TikTok
            </a>
            <a href={fbUrl || "#"} target="_blank" rel="noreferrer" className="text-xs text-blue-600 hover:underline">
              Buka Facebook
            </a>
          </div>
        </div>
      </div>

      {/* Toast */}
      {toast && (
        <div className="fixed right-6 bottom-6 z-50">
          <div className="bg-slate-900 text-white text-sm px-4 py-2 rounded shadow">
            {toast}
          </div>
        </div>
      )}
    </div>
  );
}