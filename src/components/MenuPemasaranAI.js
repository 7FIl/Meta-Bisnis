// src/components/MenuPemasaranAI.js
"use client";

import { useEffect, useRef, useState } from "react";

export default function MenuPemasaranAI({
  businessName = "",
  businessLocation = "",
  businessType = "",
  brandTone = "",
  targetAudience = "",
  uniqueSellingPoints = "",
  instagramUsername = "",
  tiktokUsername = "",
  whatsappNumber = "",
  calendarEntries = [],
  onAddCalendarItem,
  onDeleteCalendarItem,
  onSave,
  salesData,
  onBack,
}) {
  // keep props signature stable even if unused for now
  void onSave;
  void salesData;

  const [activeTab, setActiveTab] = useState("generate"); // generate | calendar | ads
  const [platform, setPlatform] = useState("instagram");
  const [brief, setBrief] = useState("");
  const [contentType, setContentType] = useState("Instagram");
  const [saveDate, setSaveDate] = useState(() => new Date().toISOString().slice(0, 10));
  const [result, setResult] = useState("");
  const [loading, setLoading] = useState(false);
  const [toast, setToast] = useState("");
  const toastRef = useRef(null);

  const showToast = (msg = "Sukses") => {
    setToast(msg);
    clearTimeout(toastRef.current);
    toastRef.current = setTimeout(() => setToast(""), 2500);
  };

  const handleGenerate = async () => {
    if (!brief.trim()) {
      showToast("Isi ide atau detail konten terlebih dahulu");
      return;
    }
    setLoading(true);
    setResult("");
    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          topic: "content_creation",
          platform,
          message: brief,
          businessName,
          businessLocation,
          businessType,
          brandTone,
          targetAudience,
          uniqueSellingPoints,
          instagramUsername,
          tiktokUsername,
          whatsappNumber,
        }),
      });

      const json = await res.json();
      if (!res.ok || !json.success) {
        showToast(json.error || "Gagal membuat konten");
        return;
      }
      setResult(json.reply || "");
      setContentType(platform.charAt(0).toUpperCase() + platform.slice(1));
    } catch (err) {
      console.error("generate error", err);
      showToast("Gagal memanggil AI");
    } finally {
      setLoading(false);
    }
  };

  const handleCopy = () => {
    if (!result) return;
    navigator.clipboard.writeText(result).then(() => showToast("Disalin"));
  };

  const handleSaveToCalendar = () => {
    if (!result) {
      showToast("Generate konten dulu");
      return;
    }
    if (!saveDate) {
      showToast("Pilih tanggal publikasi");
      return;
    }
    if (typeof onAddCalendarItem === "function") {
      onAddCalendarItem({
        date: saveDate,
        type: contentType || platform,
        content: result,
        platform,
      });
      showToast("Disimpan ke kalender");
    }
  };

  useEffect(() => () => clearTimeout(toastRef.current), []);

  const brandContext = [
    businessName ? `Nama brand: ${businessName}` : "",
    businessLocation ? `Lokasi: ${businessLocation}` : "",
    businessType ? `Kategori: ${businessType}` : "",
    targetAudience ? `Audiens: ${targetAudience}` : "",
    uniqueSellingPoints ? `Keunggulan: ${uniqueSellingPoints}` : "",
    brandTone ? `Gaya komunikasi: ${brandTone}` : "",
  ].filter(Boolean);

  const tabs = [
    { key: "generate", label: "Buat Konten" },
    { key: "calendar", label: "Kalender" },
    { key: "ads", label: "Iklan & Data" },
  ];

  const formatDate = (dateStr) => {
    if (!dateStr) return "";
    const [y, m, d] = dateStr.split("-");
    if (!y || !m || !d) return dateStr;
    const monthNames = [
      "Jan",
      "Feb",
      "Mar",
      "Apr",
      "Mei",
      "Jun",
      "Jul",
      "Agu",
      "Sep",
      "Okt",
      "Nov",
      "Des",
    ];
    return `${d} ${monthNames[Number(m) - 1]} ${y}`;
  };

  return (
    <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
      <div className="flex items-center justify-between mb-6">
        <button
          onClick={() => {
            if (typeof onBack === "function") return onBack();
            if (typeof window !== "undefined" && window.history && window.history.length) window.history.back();
          }}
          className="text-sm text-slate-600 hover:text-slate-900 flex items-center gap-2"
        >
          <i className="fas fa-arrow-left"></i>
          <span>Kembali ke Dashboard</span>
        </button>
        {businessName && <span className="text-xs text-slate-500">{businessName}</span>}
      </div>

      <div className="flex gap-2 mb-6">
        {tabs.map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className={`px-4 py-2 rounded-full text-sm border transition-colors ${
              activeTab === tab.key
                ? "bg-slate-900 text-white border-slate-900"
                : "bg-white text-slate-700 border-slate-200 hover:border-slate-300"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {activeTab === "generate" && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="space-y-4">
            <div className="p-4 rounded-2xl border border-slate-100">
              <div className="flex items-center justify-between mb-3">
                <div>
                  <p className="text-xs text-slate-800">Platform</p>
                  <p className="text-sm font-semibold text-slate-700">Pilih target distribusi</p>
                </div>
                <i className="far fa-paper-plane text-slate-500"></i>
              </div>
              <div className="flex flex-wrap gap-2">
                {["instagram", "tiktok", "whatsapp"].map((p) => (
                  <button
                    key={p}
                    onClick={() => {
                      setPlatform(p);
                      setContentType(p.charAt(0).toUpperCase() + p.slice(1));
                    }}
                    className={`px-4 py-2 rounded-xl text-sm border capitalize transition-colors ${
                      platform === p
                        ? "bg-indigo-600 text-white border-indigo-600"
                        : "bg-white text-slate-700 border-slate-200 hover:border-slate-300"
                    }`}
                  >
                    {p}
                  </button>
                ))}
              </div>
            </div>

            <div className="p-4 rounded-2xl bg-white border border-slate-200">
              <div className="flex items-center justify-between mb-3">
                <div>
                  <p className="text-xs text-slate-700">Profil Brand</p>
                  <p className="text-sm font-semibold text-slate-600">Disisipkan otomatis ke prompt</p>
                </div>
                <i className="far fa-id-card text-slate-500"></i>
              </div>
              {brandContext.length ? (
                <div className="flex flex-wrap gap-2">
                  {brandContext.map((item) => (
                    <span key={item} className="px-3 py-1 rounded-full text-xs bg-white dark:bg-slate-300 dark:text-slate-800 text-slate-200 border border-slate-200">
                      {item}
                    </span>
                  ))}
                </div>
              ) : (
                <p className="text-xs text-slate-900">Lengkapi nama bisnis, lokasi, dan detail brand di pengaturan supaya konten lebih konsisten.</p>
              )}
            </div>

            <div className="space-y-2">
              <label className="text-xs font-semibold text-slate-700">Brief Konten</label>
              <textarea
                value={brief}
                onChange={(e) => setBrief(e.target.value)}
                placeholder="Ceritakan produk, promo, dan audiens. Contoh: Promo diskon 20% kopi susu untuk pelanggan kantor, highlight pakai kopi lokal."
                rows={8}
                className="w-full px-3 py-2 border border-slate-300 rounded-xl text-sm bg-white focus:outline-none focus:ring-2 focus:ring-indigo-200"
              />
              <div className="text-xs text-slate-700">Semakin spesifik detailnya, semakin tajam copywriting dari AI.</div>
            </div>

            <div className="flex flex-wrap gap-3 items-center">
              <button
                onClick={handleGenerate}
                disabled={loading}
                className={`px-4 py-2 rounded-xl text-sm text-white flex items-center gap-2 shadow-sm ${
                  loading ? "bg-slate-400 cursor-not-allowed" : "bg-indigo-600 hover:bg-indigo-700"
                }`}
              >
                {loading ? <i className="fas fa-spinner fa-spin"></i> : <i className="far fa-magic"></i>}
                {loading ? "Membuat..." : "Generate Konten"}
              </button>
              <span className="text-xs text-slate-700">Tunggu beberapa detik, hasil akan muncul di panel kanan.</span>
            </div>
          </div>

          <div className="h-full">
            <div className="p-4 h-full rounded-2xl border border-slate-200 bg-slate-50 flex flex-col gap-3">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs dark:text-slate-700 text-slate-800">Hasil AI</p>
                  <p className="text-sm font-semibold text-slate-700 dark:text-slate-700">Copy siap posting</p>
                </div>
                <div className="flex gap-2 text-slate-500">
                  <button
                    onClick={handleCopy}
                    disabled={!result}
                    className={`px-3 py-2 text-xs rounded-lg border flex items-center gap-2 ${
                      result ? "text-slate-700 border-slate-300 hover:border-slate-400" : "text-slate-00 border-slate-00 cursor-not-allowed"
                    }`}
                  >
                    <i className="far fa-copy"></i>
                    Salin
                  </button>
                  <button
                    onClick={handleSaveToCalendar}
                    disabled={!result}
                    className={`px-3 py-2 text-xs rounded-lg border flex items-center gap-2 ${
                      result ? "text-green-700 border-green-300 hover:border-green-400" : "text-slate-00 border-slate-00 cursor-not-allowed"
                    }`}
                  >
                    <i className="far fa-calendar-plus"></i>
                    Simpan
                  </button>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3 text-xs">
                <div className="space-y-1">
                  <label className="block text-slate-600">Tanggal publish</label>
                  <input
                    type="date"
                    value={saveDate}
                    onChange={(e) => setSaveDate(e.target.value)}
                    className="w-full px-2 py-1 border border-slate-300 rounded-lg text-sm"
                  />
                </div>
                <div className="space-y-1">
                  <label className="block text-slate-600">Jenis konten</label>
                  <input
                    type="text"
                    value={contentType}
                    onChange={(e) => setContentType(e.target.value)}
                    placeholder="Contoh: TikTok - Soft selling"
                    className="w-full px-2 py-1 border border-slate-300 rounded-lg text-sm"
                  />
                </div>
              </div>
              <div className="flex-1 rounded-xl bg-white border border-slate-100 p-3 text-sm text-slate-800 overflow-y-auto whitespace-pre-wrap min-h-[240px]">
                {result || <span className="text-slate-600">Hasil akan tampil di sini setelah generate.</span>}
              </div>
            </div>
          </div>
        </div>
      )}

      {activeTab === "calendar" && (
        <div className="space-y-4">
          <div className="p-4 border border-slate-200 rounded-2xl bg-slate-50">
            <p className="font-semibold text-slate-800 mb-1">Kalender Konten</p>
            <p className="text-sm text-slate-600">Simpan ide AI dan lihat jadwal posting.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {calendarEntries && calendarEntries.length > 0 ? (
              calendarEntries.map((item, idx) => (
                <div key={idx} className="border border-slate-200 rounded-xl bg-white shadow-sm p-4 flex flex-col gap-2 relative">
                  <button
                    onClick={() => {
                      if (typeof onDeleteCalendarItem === "function") {
                        onDeleteCalendarItem(item.date || item.dateKey, item.id);
                        showToast("Dihapus dari kalender");
                      }
                    }}
                    className="absolute top-2 right-2 text-red-500 hover:text-red-700 text-xs p-1 rounded hover:bg-red-50 transition-colors"
                    title="Hapus"
                  >
                    <i className="fas fa-times"></i>
                  </button>
                  <div className="flex items-center justify-between text-xs font-semibold text-slate-700 pr-6">
                    <span>{formatDate(item.date || item.dateKey)}</span>
                    <span className="px-2 py-1 rounded-full bg-indigo-50 text-indigo-700 border border-indigo-100 text-[11px]">
                      {item.type || "Konten"}
                    </span>
                  </div>
                  <div className="text-sm text-slate-800 whitespace-pre-wrap leading-relaxed">
                    {item.content || item.title}
                  </div>
                </div>
              ))
            ) : (
              <div className="md:col-span-2 lg:col-span-3">
                <div className="border border-dashed border-slate-300 rounded-2xl p-6 text-center text-slate-500 bg-white">
                  Belum ada konten yang disimpan. Generate dulu, lalu klik "Simpan".
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {activeTab === "ads" && (
        <div className="p-6 border border-dashed border-slate-300 rounded-2xl text-center text-slate-500 bg-slate-50">
          <p className="font-semibold text-slate-700 mb-1">Iklan & Data</p>
          <p className="text-sm">Segmentasi audiens, ide iklan, dan analitik akan muncul di sini.</p>
        </div>
      )}

      {toast && (
        <div className="fixed right-6 bottom-6 z-50">
          <div className="bg-slate-900 text-white text-sm px-4 py-2 rounded shadow">{toast}</div>
        </div>
      )}
    </div>
  );
}