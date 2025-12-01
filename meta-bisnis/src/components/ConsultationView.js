'use client';

import { useRef, useState } from 'react';

export default function ConsultationView({ onSetupBusiness, businessData, loading }) {
  const inputRef = useRef(null);
  const [showRecommendation, setShowRecommendation] = useState(false);

  const handleConsultAI = async () => {
    const input = inputRef.current?.value;
    if (!input) {
      alert('Mohon isi ide atau kondisi Anda terlebih dahulu.');
      return;
    }
    // Panggil parent function
    await onSetupBusiness(input);
    setShowRecommendation(true);
  };

  const handleNewSearch = () => {
    if (inputRef.current) {
      inputRef.current.value = '';
    }
    setShowRecommendation(false);
  };

  return (
    <div className="min-h-screen flex flex-col">
      {/* Navbar Sederhana */}
      <nav className="w-full py-4 px-6 flex justify-between items-center bg-white shadow-sm">
        <div className="font-bold text-xl flex items-center gap-2">
          <i className="fas fa-robot text-blue-600"></i> UMKM Pintar AI
        </div>
        <button className="text-sm text-slate-500 hover:text-blue-600">
          Masuk
        </button>
      </nav>

      {/* Hero Section */}
      <main className="flex-grow flex flex-col items-center justify-center px-4 py-10 text-center relative overflow-hidden">
        {/* Background Decoration */}
        <div className="absolute top-0 left-0 w-64 h-64 bg-blue-200 rounded-full mix-blend-multiply filter blur-3xl opacity-30 animate-blob"></div>
        <div className="absolute top-0 right-0 w-64 h-64 bg-purple-200 rounded-full mix-blend-multiply filter blur-3xl opacity-30 animate-blob animation-delay-2000"></div>

        <h1 className="text-4xl md:text-5xl font-extrabold mb-6 tracking-tight relative z-10">
          Bingung Mau Bisnis Apa?
          <br />
          <span className="gradient-text">Tanya AI, Mulai Sekarang.</span>
        </h1>
        <p className="text-lg text-slate-600 max-w-2xl mb-8 relative z-10">
          Ceritakan modal, lokasi, atau minat Anda. Kami akan carikan peluang
          bisnis paling cuan berdasarkan data tren pasar terkini.
        </p>

        {/* Input Konsultasi */}
        <div className="w-full max-w-xl bg-white p-2 rounded-2xl shadow-xl border border-slate-100 flex flex-col md:flex-row gap-2 relative z-10">
          <input
            ref={inputRef}
            type="text"
            placeholder="Cth: Saya punya modal 1 juta, suka masak, lokasi di dekat kampus..."
            className="flex-grow px-4 py-3 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-100 text-slate-700"
          />
          <button
            onClick={handleConsultAI}
            disabled={loading}
            className="bg-blue-600 hover:bg-blue-700 disabled:bg-slate-400 text-white font-semibold py-3 px-6 rounded-xl transition-all flex items-center justify-center gap-2"
          >
            <i className={`fas ${loading ? 'fa-spinner fa-spin' : 'fa-magic'}`}></i>
            {loading ? 'Mencari...' : 'Cari Ide'}
          </button>
        </div>

        {/* Loading Indicator */}
        {loading && (
          <div className="mt-8 flex flex-col items-center animate-fade-in">
            <div className="w-10 h-10 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin"></div>
            <p className="mt-3 text-sm text-slate-500 font-medium">
              Menganalisis tren pasar & kompetitor...
            </p>
          </div>
        )}

        {/* Hasil Rekomendasi (Card) */}
        {showRecommendation && businessData && !loading && (
          <div className="mt-10 w-full max-w-3xl animate-fade-in">
            <div className="bg-white rounded-2xl shadow-lg border border-slate-200 overflow-hidden">
              <div className="bg-gradient-to-r from-blue-50 to-indigo-50 p-6 border-b border-slate-100">
                <div className="flex justify-between items-start">
                  <div>
                    <span className="bg-blue-100 text-blue-700 text-xs font-bold px-2 py-1 rounded uppercase tracking-wide">
                      Rekomendasi Utama
                    </span>
                    <h2 className="text-2xl font-bold mt-2 text-slate-800">
                      {businessData.name}
                    </h2>
                  </div>
                  <div className="text-right">
                    <p className="text-sm text-slate-500">Potensi Pasar</p>
                    <div className="flex text-yellow-400 text-sm justify-end">
                      <i className="fas fa-star"></i>
                      <i className="fas fa-star"></i>
                      <i className="fas fa-star"></i>
                      <i className="fas fa-star"></i>
                      <i className="fas fa-star-half-alt"></i>
                    </div>
                  </div>
                </div>
              </div>
              <div className="p-6">
                <p className="text-slate-600 mb-6 leading-relaxed">
                  {businessData.description}
                </p>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                  <div className="bg-slate-50 p-4 rounded-xl border border-slate-100">
                    <i className="fas fa-wallet text-green-500 mb-2 block"></i>
                    <h4 className="font-semibold text-sm">Estimasi Modal</h4>
                    <p className="text-slate-700 font-bold">{businessData.capital_est}</p>
                  </div>
                  <div className="bg-slate-50 p-4 rounded-xl border border-slate-100">
                    <i className="fas fa-chart-line text-blue-500 mb-2 block"></i>
                    <h4 className="font-semibold text-sm">Target Pasar</h4>
                    <p className="text-slate-700 font-bold">{businessData.target_market}</p>
                  </div>
                  <div className="bg-slate-50 p-4 rounded-xl border border-slate-100">
                    <i className="fas fa-exclamation-triangle text-orange-500 mb-2 block"></i>
                    <h4 className="font-semibold text-sm">Tantangan Utama</h4>
                    <p className="text-xs text-slate-600">{businessData.challenge}</p>
                  </div>
                </div>

                <div className="flex justify-end gap-3">
                  <button
                    onClick={handleNewSearch}
                    className="px-4 py-2 text-slate-500 hover:text-slate-700 font-medium"
                  >
                    Cari Lain
                  </button>
                  <button
                    onClick={() => onSetupBusiness(null, true)}
                    className="bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-2 rounded-lg font-semibold shadow-lg shadow-indigo-200 transition-all transform hover:scale-105"
                  >
                    <i className="fas fa-rocket mr-2"></i> Jalankan Bisnis Ini
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
