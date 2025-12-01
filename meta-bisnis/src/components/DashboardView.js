'use client';

import { useEffect, useRef } from 'react';
import FinancePanel from './FinancePanel';
import MarketIntelligence from './MarketIntelligence';
import MarketingStudio from './MarketingStudio';
import AdModal from './AdModal';

export default function DashboardView({
  businessName,
  onLogout,
  transactions,
  onAddTransaction,
  marketData,
  showAdModal,
  onShowAdModal,
  onCloseAdModal,
}) {
  const chartRef = useRef(null);

  useEffect(() => {
    // Chart akan diinisialisasi di MarketIntelligence component
  }, []);

  return (
    <div className="min-h-screen flex bg-slate-50">
      {/* Sidebar */}
      <aside className="w-64 bg-white border-r border-slate-200 hidden md:flex flex-col fixed h-full z-10">
        <div className="p-6 border-b border-slate-100">
          <div className="flex items-center gap-2 font-bold text-xl text-indigo-700">
            <i className="fas fa-store"></i> <span>{businessName}</span>
          </div>
          <p className="text-xs text-slate-500 mt-1">Managed by AI</p>
        </div>
        <nav className="p-4 space-y-1">
          <a
            href="#"
            className="flex items-center gap-3 px-4 py-3 bg-blue-50 text-blue-700 rounded-lg font-medium"
          >
            <i className="fas fa-home w-5"></i> Beranda
          </a>
          <a
            href="#"
            className="flex items-center gap-3 px-4 py-3 text-slate-600 hover:bg-slate-50 rounded-lg font-medium transition-colors"
          >
            <i className="fas fa-bullhorn w-5"></i> Pemasaran AI
          </a>
          <a
            href="#"
            className="flex items-center gap-3 px-4 py-3 text-slate-600 hover:bg-slate-50 rounded-lg font-medium transition-colors"
          >
            <i className="fas fa-calculator w-5"></i> Keuangan
          </a>
          <a
            href="#"
            className="flex items-center gap-3 px-4 py-3 text-slate-600 hover:bg-slate-50 rounded-lg font-medium transition-colors"
          >
            <i className="fas fa-cog w-5"></i> Pengaturan
          </a>
        </nav>
        <div className="mt-auto p-4 border-t border-slate-100">
          <button
            onClick={onLogout}
            className="flex items-center gap-3 px-4 py-2 text-red-500 hover:bg-red-50 rounded-lg w-full transition-colors text-sm font-medium"
          >
            <i className="fas fa-sign-out-alt"></i> Keluar
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 md:ml-64 p-4 md:p-8 overflow-y-auto">
        {/* Header Mobile */}
        <div className="md:hidden flex justify-between items-center mb-6">
          <h1 className="font-bold text-lg">{businessName}</h1>
          <button className="text-slate-600">
            <i className="fas fa-bars"></i>
          </button>
        </div>

        {/* Welcome Banner */}
        <div className="bg-gradient-to-r from-indigo-600 to-blue-600 rounded-2xl p-6 mb-8 shadow-lg flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold mb-1 text-slate-900">Halo, Bos! 👋</h1>
            <p className="text-slate-800 text-sm">
              AI telah menyiapkan strategi hari ini untuk{' '}
              <span className="font-bold underline">{businessName}</span>.
            </p>
          </div>
          <div className="hidden sm:block">
            <button
              onClick={onShowAdModal}
              className="bg-white text-indigo-600 px-4 py-2 rounded-lg font-bold text-sm shadow hover:bg-blue-50 transition"
            >
              <i className="fas fa-ad mr-1"></i> Buat Iklan Cepat
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* KOLOM 1: KEUANGAN (Input & Ringkasan) */}
          <FinancePanel
            transactions={transactions}
            onAddTransaction={onAddTransaction}
          />

          {/* KOLOM 2 & 3: MARKET INTELLIGENCE & MARKETING */}
          <div className="lg:col-span-2 space-y-6">
            <MarketIntelligence businessName={businessName} marketData={marketData} />
            <MarketingStudio businessName={businessName} />
          </div>
        </div>
      </main>

      {/* Ad Modal */}
      {showAdModal && <AdModal onClose={onCloseAdModal} />}
    </div>
  );
}
