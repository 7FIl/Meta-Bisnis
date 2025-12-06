// src/components/DashboardView.js
'use client';

import { useEffect, useRef, useState } from 'react';
import EmployeeAbsence from './EmployeeAbsence';
import MarketIntelligence from './MarketIntelligence';
import MarketingStudio from './MarketingStudio';
import MenuPemasaranAI from './MenuPemasaranAI';
import MenuChatAI from './MenuChatAI';
import MenuKeuangan from './MenuKeuangan';
import MenuPengaturan from './MenuPengaturan';

// Helper to set/get theme outside of React flow (for instant effect)
const applyTheme = (isDark) => {
  if (isDark) {
    document.documentElement.classList.add('dark');
    localStorage.setItem('theme', 'dark');
  } else {
    document.documentElement.classList.remove('dark');
    localStorage.setItem('theme', 'light');
  }
};

export default function DashboardView({
  businessName,
  userName,
  onLogout,
  absences,
  onAddAbsence,
  marketData,
  onUpdateSettings,
  currentUserEmail,
  onDeleteAccount,
  // NEW PROPS
  businessLocation,
  businessDescription,
}) {
  const chartRef = useRef(null);
  const [selectedMenu, setSelectedMenu] = useState('beranda');
  const [isDarkMode, setIsDarkMode] = useState(false); // NEW STATE

  // Theme initialization
  useEffect(() => {
    const savedTheme = localStorage.getItem('theme');
    const systemPrefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    // Set Light Mode as initial default, unless "dark" is explicitly saved
    const initialDark = savedTheme === 'dark' || (savedTheme === null && systemPrefersDark);
    
    setIsDarkMode(initialDark);
    applyTheme(initialDark); // Ensure it's applied on mount
    
    // Clean up function for system preference changes
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    const handler = (e) => {
        if (!localStorage.getItem('theme')) { // Only react to system changes if no preference is saved
            setIsDarkMode(e.matches);
            applyTheme(e.matches);
        }
    };
    mediaQuery.addEventListener('change', handler);
    return () => mediaQuery.removeEventListener('change', handler);
  }, []);

  const handleThemeToggle = () => {
    const newMode = !isDarkMode;
    setIsDarkMode(newMode);
    applyTheme(newMode);
  };

  return (
    // Base colors set to light mode: bg-slate-50
    <div className="min-h-screen flex bg-slate-50">
      {/* Sidebar - base colors set to light mode: bg-white */}
      <aside className="w-64 bg-white bg-slate-800 border-r border-slate-200 border-slate-700 hidden md:flex flex-col fixed h-full z-10">
        <div className="p-6 border-b border-slate-100 border-slate-700">
          <div className="flex items-center gap-2 font-bold text-xl text-indigo-700 text-indigo-400">
            <i className="fas fa-store"></i> <span>{businessName}</span>
          </div>
          <p className="text-xs text-slate-500 text-slate-400 mt-1">Managed by Meta Bisnis</p>
        </div>

        <nav className="p-4 space-y-1 flex-1">
          {
            [
              { name: 'Beranda', icon: 'fa-home', menu: 'beranda' },
              { name: 'Pemasaran AI', icon: 'fa-bullhorn', menu: 'pemasaran' },
              { name: 'Keuangan', icon: 'fa-calculator', menu: 'keuangan' },
              { name: 'Chat AI', icon: 'fa-comments', menu: 'chat' },
              { name: 'Pengaturan', icon: 'fa-cog', menu: 'pengaturan' },
            ].map(item => (
              <button
                key={item.menu}
                onClick={() => setSelectedMenu(item.menu)}
                className={`w-full text-left flex items-center justify-between gap-3 px-4 py-3 
                  ${selectedMenu === item.menu 
                    ? 'bg-blue-50 text-blue-700 bg-indigo-600/50 text-blue-300 rounded-lg font-medium' 
                    : 'text-slate-600 text-slate-500 hover:bg-slate-100 hover:bg-slate-300 rounded-lg font-medium transition-colors'
                  }`}
              >
                <div className="flex items-center gap-3">
                    <i className={`fas ${item.icon} w-5`}></i> {item.name}
                </div>
              </button>
            ))
          }
        </nav>

        {/* Theme Toggle Button & Logout Button */}
        <div className="p-4 border-t border-slate-100 dark:border-slate-700 space-y-2">
            {/* Theme Toggle Button (Master Toggle - 'Disetiap menu' access point) */}
            <button
                onClick={handleThemeToggle}
                className="flex items-center gap-3 px-4 py-2 text-slate-600 dark:text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-300 rounded-lg w-full transition-colors text-sm font-medium"
                title={isDarkMode ? 'Ganti ke Mode Terang' : 'Ganti ke Mode Gelap'}
            >
                <i className={`fas ${isDarkMode ? 'fa-sun text-yellow-500' : 'fa-moon text-indigo-700'} w-5`}></i>
                {isDarkMode ? 'Mode Terang' : 'Mode Gelap'}
            </button>
            
            {/* Logout Button */}
            <button
                onClick={onLogout}
                className="flex items-center gap-3 px-4 py-2 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/50 rounded-lg w-full transition-colors text-sm font-medium"
            >
                <i className="fas fa-sign-out-alt w-5"></i> Keluar
            </button>
        </div>
      </aside>

      {/* Main Content (All content will adapt via global CSS and dark: utilities) */}
      <main className="flex-1 md:ml-64 p-4 md:p-8 overflow-y-auto">
        {selectedMenu === 'pemasaran' ? (
          <MenuPemasaranAI
            businessName={businessName}
            salesData={marketData?.sales}
            isDarkMode={isDarkMode}
            onSave={(payload) => {
              console.log('Konten disimpan:', payload);
            }}
            onBack={() => setSelectedMenu('beranda')} 
          />
        ) : selectedMenu === 'chat' ? (
          <div className="flex flex-col h-[calc(100vh-120px)]">
            <div className="flex items-center gap-3 mb-4">
              <button onClick={() => setSelectedMenu('beranda')} className="text-sm text-slate-600 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-900">
                ← Kembali ke Dashboard
              </button>
            </div>

            <MenuChatAI
              businessName={businessName}
              onSend={async ({ topic, prompt, history = [] }) => {
                // Integrasi: panggil API server `/api/chat` (sesuai route yang tersedia)
                try {
                  const url = new URL('/api/chat', window.location.origin).href;
                  const businessContext = {
                    name: businessName || 'Bisnis pengguna',
                    location: businessLocation || 'Lokasi tidak ditentukan',
                    description: businessDescription || 'Belum ada deskripsi',
                  };
                  const recent = history.slice(-12); // limit history to keep payload light
                  const payload = {
                    // include both `message` and `messages` for compatibility with the server route
                    message: prompt,
                    messages: [
                      {
                        role: 'system',
                        content: `Gunakan konteks bisnis: nama=${businessContext.name}; lokasi=${businessContext.location}; deskripsi=${businessContext.description}. Jangan memaksakan penyebutan nama bisnis jika tidak relevan; gunakan hanya ketika membantu jawaban. Utamakan penalaran dan sampaikan jawaban singkat, terstruktur, dan langsung.`
                      },
                      ...recent.map((m) => ({
                        role: m.role === 'ai' ? 'assistant' : 'user',
                        content: m.text,
                      })),
                      { role: 'user', content: prompt }
                    ],
                    topic,
                    context: businessContext,
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
          // Keuangan view
          <div>
            <div className="flex items-center gap-3 mb-4">
              <button onClick={() => setSelectedMenu('beranda')} className="text-sm text-slate-600 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-900">
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
        ) : selectedMenu === 'pengaturan' ? (
           // Pengaturan view
          <div>
            <div className="flex items-center gap-3 mb-4">
              <button onClick={() => setSelectedMenu('beranda')} className="text-sm text-slate-600 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-900">
                ← Kembali ke Dashboard
              </button>
              <h2 className="text-xl font-bold">Pengaturan — {businessName}</h2>
            </div>
            <MenuPengaturan
                currentBusinessName={businessName}
                currentUserName={userName}
                currentUserEmail={currentUserEmail}
                currentBusinessLocation={businessLocation}
              currentBusinessDescription={businessDescription}
                onUpdateSettings={onUpdateSettings}
                onDeleteAccount={onDeleteAccount}
            />
          </div>
        ) : (
          <>
            <div className="bg-gradient-to-r from-indigo-600 to-blue-600 rounded-2xl p-6 mb-8 shadow-lg flex justify-between items-center">
              <div>
                <h1 className="text-xl font-bold">Halo, {userName}!</h1>
                <p className="text-slate-800 text-sm">
                  AI telah menyiapkan strategi hari ini untuk{' '}
                  <span className="font-bold underline">{businessName}</span>.
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <EmployeeAbsence absences={absences} onAddAbsence={onAddAbsence} />
              <div className="lg:col-span-2 space-y-6">
                <MarketIntelligence 
                  businessName={businessName} 
                  marketData={marketData}
                  businessLocation={businessLocation}
                  businessDescription={businessDescription}
                />
                <MarketingStudio businessName={businessName} />
              </div>
            </div>
          </>
        )}
      </main>
    </div>
  );
}