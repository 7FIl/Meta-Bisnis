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
  businessTitle,
  businessLocation,
  businessImage,
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
                    ? 'bg-blue-50 text-blue-700 bg-indigo-900/50 text-blue-300 rounded-lg font-medium' 
                    : 'text-slate-600 text-slate-300 hover:bg-slate-50 hover:bg-slate-700 rounded-lg font-medium transition-colors'
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
                className="flex items-center gap-3 px-4 py-2 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700 rounded-lg w-full transition-colors text-sm font-medium"
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
            onSave={(payload) => {
              console.log('Konten disimpan:', payload);
            }}
          />
        ) : selectedMenu === 'chat' ? (
          <div className="space-y-4">
            <div className="flex items-center gap-3 mb-2">
              <button onClick={() => setSelectedMenu('beranda')} className="text-sm text-slate-600 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200">
                ← Kembali ke Dashboard
              </button>
              <h2 className="text-xl font-bold">Chat AI — {businessName}</h2>
            </div>

            <MenuChatAI
              businessName={businessName}
              onSend={async ({ topic, prompt }) => {
                // contoh integrasi: panggil API server untuk response AI (ubah sesuai backend)
                try {
                  const res = await fetch('/api/ai', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ topic, prompt }),
                  });
                  if (!res.ok) throw new Error('AI API error');
                  const json = await res.json();
                  return { text: json.text };
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
              <button onClick={() => setSelectedMenu('beranda')} className="text-sm text-slate-600 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200">
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
              <button onClick={() => setSelectedMenu('beranda')} className="text-sm text-slate-600 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200">
                ← Kembali ke Dashboard
              </button>
              <h2 className="text-xl font-bold">Pengaturan — {businessName}</h2>
            </div>
            <MenuPengaturan
                currentBusinessName={businessName}
                currentUserName={userName}
                currentUserEmail={currentUserEmail}
                currentBusinessTitle={businessTitle}
                currentBusinessLocation={businessLocation}
                currentBusinessImage={businessImage}
                onUpdateSettings={onUpdateSettings}
                onDeleteAccount={onDeleteAccount}
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