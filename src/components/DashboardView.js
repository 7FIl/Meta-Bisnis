'use client';

import { useEffect, useRef, useState } from 'react';
import EmployeeAbsence from './EmployeeAbsence';
import MarketIntelligence from './MarketIntelligence';
import MarketingStudio from './MarketingStudio';
import MenuPemasaranAI from './MenuPemasaranAI';
import MenuChatAI from './MenuChatAI';
import MenuKeuangan from './MenuKeuangan'; // <-- added import

export default function DashboardView({
  businessName,
  userName,
  onLogout,
  absences,
  onAddAbsence,
  marketData,
}) {
  const chartRef = useRef(null);
  const [selectedMenu, setSelectedMenu] = useState('beranda'); // 'beranda' | 'pemasaran' | 'chat' | 'keuangan' | ...

  useEffect(() => {
    // initializations...
  }, []);

  return (
    <div className="min-h-screen flex bg-slate-50">
      {/* Sidebar */}
      <aside className="w-64 bg-white border-r border-slate-200 hidden md:flex flex-col fixed h-full z-10">
        <div className="p-6 border-b border-slate-100">
          <div className="flex items-center gap-2 font-bold text-xl text-indigo-700">
            <i className="fas fa-store"></i> <span>{businessName}</span>
          </div>
          <p className="text-xs text-slate-500 mt-1">Managed by Meta Bisnis</p>
        </div>

        <nav className="p-4 space-y-1">
          <button
            onClick={() => setSelectedMenu('beranda')}
            className={`w-full text-left flex items-center gap-3 px-4 py-3 ${selectedMenu === 'beranda' ? 'bg-blue-50 text-blue-700 rounded-lg font-medium' : 'text-slate-600 hover:bg-slate-50 rounded-lg font-medium transition-colors'}`}
          >
            <i className="fas fa-home w-5"></i> Beranda
          </button>

          <button
            onClick={() => setSelectedMenu('pemasaran')}
            className={`w-full text-left flex items-center gap-3 px-4 py-3 ${selectedMenu === 'pemasaran' ? 'bg-blue-50 text-blue-700 rounded-lg font-medium' : 'text-slate-600 hover:bg-slate-50 rounded-lg font-medium transition-colors'}`}
          >
            <i className="fas fa-bullhorn w-5"></i> Pemasaran AI
          </button>

          <button
            onClick={() => setSelectedMenu('keuangan')}
            className={`w-full text-left flex items-center gap-3 px-4 py-3 ${selectedMenu === 'keuangan' ? 'bg-blue-50 text-blue-700 rounded-lg font-medium' : 'text-slate-600 hover:bg-slate-50 rounded-lg font-medium transition-colors'}`}
          >
            <i className="fas fa-calculator w-5"></i> Keuangan
          </button>

          <button
            onClick={() => setSelectedMenu('chat')}
            className={`w-full text-left flex items-center gap-3 px-4 py-3 ${selectedMenu === 'chat' ? 'bg-blue-50 text-blue-700 rounded-lg font-medium' : 'text-slate-600 hover:bg-slate-50 rounded-lg font-medium transition-colors'}`}
          >
            <i className="fas fa-comments w-5"></i> Chat AI
          </button>

          <button
            onClick={() => setSelectedMenu('pengaturan')}
            className={`w-full text-left flex items-center gap-3 px-4 py-3 ${selectedMenu === 'pengaturan' ? 'bg-blue-50 text-blue-700 rounded-lg font-medium' : 'text-slate-600 hover:bg-slate-50 rounded-lg font-medium transition-colors'}`}
          >
            <i className="fas fa-cog w-5"></i> Pengaturan
          </button>
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
        {selectedMenu === 'pemasaran' ? (
          <MenuPemasaranAI
            businessName={businessName}
            salesData={marketData?.sales}
            onSave={(payload) => {
              console.log('Konten disimpan:', payload);
            }}
          />
        ) : selectedMenu === 'chat' ? (
          <div className="space-y-4">
            <div className="flex items-center gap-3 mb-2">
              <button onClick={() => setSelectedMenu('beranda')} className="text-sm text-slate-600 hover:text-slate-800">
                ← Kembali ke Dashboard
              </button>
              <h2 className="text-xl font-bold">Chat AI — {businessName}</h2>
            </div>

            <MenuChatAI
              businessName={businessName}
              onSend={async ({ topic, prompt }) => {
                // Integrasi: panggil API server `/api/chat` (sesuai route yang tersedia)
                try {
                  const url = new URL('/api/chat', window.location.origin).href;
                  const payload = {
                    // include both `message` and `messages` for compatibility with the server route
                    message: prompt,
                    messages: [{ role: 'user', content: prompt }],
                    topic,
                  };

                  const res = await fetch(url, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(payload),
                  });

                  if (!res.ok) {
                    const txt = await res.text().catch(() => '');
                    throw new Error(`Server returned ${res.status}: ${txt}`);
                  }

                  const json = await res.json().catch(() => null);
                  // Prefer structured summary or reply field
                  if (json && json.structured && json.structured.summary) return { text: json.structured.summary };
                  if (json && json.reply) return { text: json.reply };
                  if (json && json.text) return { text: json.text };

                  return { text: 'AI tidak mengembalikan jawaban yang dapat diproses.' };
                } catch (err) {
                  return { text: `Gagal memanggil AI: ${err.message}` };
                }
              }}
            />
          </div>
        ) : selectedMenu === 'keuangan' ? (
          // NEW: Keuangan view
          <div>
            <div className="flex items-center gap-3 mb-4">
              <button onClick={() => setSelectedMenu('beranda')} className="text-sm text-slate-600 hover:text-slate-800">
                ← Kembali ke Dashboard
              </button>
              <h2 className="text-xl font-bold">Keuangan — {businessName}</h2>
            </div>

            <MenuKeuangan
              businessName={businessName}
              period={marketData?.period || new Date().toISOString().slice(0,7)}
              salesData={marketData?.sales || []}
              incomes={marketData?.incomes || []}
              marketingExpenses={marketData?.marketing || []}
            />
          </div>
        ) : (
          <>
            <div className="bg-gradient-to-r from-indigo-600 to-blue-600 rounded-2xl p-6 mb-8 shadow-lg flex justify-between items-center">
              <div>
                <h1 className="text-2xl font-bold mb-1 text-slate-900">Halo, {userName}!</h1>
                <p className="text-slate-800 text-sm">
                  AI telah menyiapkan strategi hari ini untuk{' '}
                  <span className="font-bold underline">{businessName}</span>.
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <EmployeeAbsence absences={absences} onAddAbsence={onAddAbsence} />
              <div className="lg:col-span-2 space-y-6">
                <MarketIntelligence businessName={businessName} marketData={marketData} />
                <MarketingStudio businessName={businessName} />
              </div>
            </div>
          </>
        )}
      </main>
    </div>
  );
}
