// src/components/DashboardView.js
"use client";

import { useEffect, useRef, useState } from "react";
import EmployeeAbsence from "./EmployeeAbsence";
import MarketIntelligence from "./MarketIntelligence";
import MenuPemasaranAI from "./MenuPemasaranAI";
import MenuChatAI from "./MenuChatAI";
import MenuKeuangan from "./MenuKeuangan";
import MenuPengaturan from "./MenuPengaturan";

// Helper to set/get theme outside of React flow (for instant effect)
const applyTheme = (isDark) => {
  if (isDark) {
    document.documentElement.classList.add("dark");
    localStorage.setItem("theme", "dark");
  } else {
    document.documentElement.classList.remove("dark");
    localStorage.setItem("theme", "light");
  }
};

export default function DashboardView({
  businessName,
  userName,
  onLogout,
  absences,
  onAddAbsence,
  employees,
  onAddEmployee,
  onDeleteEmployee,
  marketData,
  onUpdateSettings,
  currentUserEmail,
  onDeleteAccount,
  // NEW PROPS
  businessLocation,
  businessDescription,
  businessType = "",
}) {
  const chartRef = useRef(null);
  const [selectedMenu, setSelectedMenu] = useState("beranda");
  const [isDarkMode, setIsDarkMode] = useState(false); // NEW STATE

  // NEW STATE FOR CALENDAR
  const [currentDate, setCurrentDate] = useState(new Date());
  const [events, setEvents] = useState({}); // Object: key is date string (YYYY-MM-DD), value is array of event strings
  const [selectedDate, setSelectedDate] = useState(null); // Selected date for event panel
  const [newEvent, setNewEvent] = useState(''); // Input for new event

  // Theme initialization - default light, honor saved preference
  useEffect(() => {
    const savedTheme = localStorage.getItem("theme");
    const initialDark = savedTheme === "dark";
    setIsDarkMode(initialDark);
    applyTheme(initialDark);
  }, []);

  const handleThemeToggle = () => {
    const newMode = !isDarkMode;
    setIsDarkMode(newMode);
    applyTheme(newMode);
  };

  // NEW FUNCTIONS FOR CALENDAR
  const getDaysInMonth = (date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();
    const startingDayOfWeek = firstDay.getDay(); // 0 = Sunday

    const days = [];
    // Add empty cells for days before the first day of the month
    for (let i = 0; i < startingDayOfWeek; i++) {
      days.push(null);
    }
    // Add days of the month
    for (let day = 1; day <= daysInMonth; day++) {
      days.push(day);
    }
    return days;
  };

  const handlePrevMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1));
    setSelectedDate(null); // Reset selected date on month change
  };

  const handleNextMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1));
    setSelectedDate(null); // Reset selected date on month change
  };

  const handleDateClick = (day) => {
    if (!day) return;
    const dateKey = `${currentDate.getFullYear()}-${String(currentDate.getMonth() + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    setSelectedDate(dateKey);
    setNewEvent(''); // Reset input
  };

  const handleAddEvent = () => {
    if (!selectedDate || !newEvent.trim()) return;
    setEvents(prev => ({
      ...prev,
      [selectedDate]: [...(prev[selectedDate] || []), newEvent.trim()]
    }));
    setNewEvent('');
  };

  const handleDeleteEvent = (dateKey, index) => {
    setEvents((prev) => {
      const newEvents = { ...prev };
      newEvents[dateKey] = newEvents[dateKey].filter((_, i) => i !== index);
      if (newEvents[dateKey].length === 0) delete newEvents[dateKey];
      return newEvents;
    });
  };

  const getEventsForDay = (day) => {
    if (!day) return [];
    const dateKey = `${currentDate.getFullYear()}-${String(currentDate.getMonth() + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    return events[dateKey] || [];
  };

  const monthNames = [
    'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
    'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'
  ];
  const dayNames = ['Min', 'Sen', 'Sel', 'Rab', 'Kam', 'Jum', 'Sab'];

  return (
    // Base colors set to pure light (white) by default, dark remains for toggle
    <div className="min-h-screen flex bg-white dark:bg-slate-900">
      {/* Sidebar - base colors set to light mode: bg-white */}
      <aside className="w-64 bg-white dark:bg-slate-800 border-r border-slate-200 dark:border-slate-700 hidden md:flex flex-col fixed h-full z-10">
        <div className="p-6 border-b border-slate-100 dark:border-slate-700">
          <div className="flex items-center gap-2 font-bold text-xl text-indigo-700 dark:text-indigo-400">
            <i className="fas fa-store"></i> <span>{businessName}</span>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">Managed by Meta Bisnis</p>
        </div>

        <nav className="p-4 space-y-1 flex-1">
          {[
            { name: "Beranda", icon: "fa-home", menu: "beranda" },
            { name: "Pemasaran AI", icon: "fa-bullhorn", menu: "pemasaran" },
            { name: "Keuangan", icon: "fa-calculator", menu: "keuangan" },
            { name: "Chat AI", icon: "fa-comments", menu: "chat" },
            { name: "Pengaturan", icon: "fa-cog", menu: "pengaturan" },
          ].map((item) => (
            <button
              key={item.menu}
              onClick={() => setSelectedMenu(item.menu)}
              className={`w-full text-left flex items-center justify-between gap-3 px-4 py-3 rounded-lg font-medium transition-colors
            ${
              selectedMenu === item.menu
                ? "bg-blue-50 text-blue-700 dark:bg-slate-700/60 dark:text-blue-200"
                : "text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-700"
            }
          `}
            >
              <div className="flex items-center gap-3">
                <i
                  className={`fas ${item.icon} w-5 
                ${
                  selectedMenu === item.menu
                    ? "text-blue-700 dark:text-blue-300"
                    : "text-slate-500 dark:text-slate-400"
                }
              `}
                ></i>
                <span
                  className={`${
                    selectedMenu === item.menu
                      ? "font-semibold text-slate-900 dark:text-slate-100"
                      : "font-medium text-slate-700 dark:text-slate-300"
                  }`}
                >
                  {item.name}
                </span>
              </div>
            </button>
          ))}
        </nav>

        {/* Theme Toggle Button & Logout Button */}
        <div className="p-4 border-t border-slate-100 dark:border-slate-700 space-y-2">
          {/* Theme Toggle Button (Master Toggle - 'Disetiap menu' access point) */}
          <button
            onClick={handleThemeToggle}
            className="flex items-center gap-3 px-4 py-2 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg w-full transition-colors text-sm font-medium"
            title={isDarkMode ? "Ganti ke Mode Terang" : "Ganti ke Mode Gelap"}
          >
            <i
              className={`fas ${
                isDarkMode
                  ? "fa-sun text-yellow-500"
                  : "fa-moon text-indigo-700"
              } w-5`}
            ></i>
            {isDarkMode ? "Mode Terang" : "Mode Gelap"}
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
      <main className="flex-1 md:ml-64 p-4 md:p-8 overflow-y-auto bg-white dark:bg-slate-900">
        {selectedMenu === "pemasaran" ? (
          <MenuPemasaranAI
            businessName={businessName}
            salesData={marketData?.sales}
            isDarkMode={isDarkMode}
            onSave={(payload) => {
              console.log("Konten disimpan:", payload);
            }}
            onBack={() => setSelectedMenu("beranda")}
          />
        ) : selectedMenu === "chat" ? (
          <div className="flex flex-col h-[calc(100vh-120px)]">
            <div className="flex items-center gap-3 mb-4">
              <button
                onClick={() => setSelectedMenu("beranda")}
                className="text-sm text-slate-600 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-900"
              >
                ← Kembali ke Dashboard
              </button>
            </div>

            <MenuChatAI
              businessName={businessName}
              onSend={async ({ topic, prompt, history = [] }) => {
                // Integrasi: panggil API server `/api/chat` (sesuai route yang tersedia)
                try {
                  const url = new URL("/api/chat", window.location.origin).href;
                  const businessContext = {
                    name: businessName || "Bisnis pengguna",
                    location: businessLocation || "Lokasi tidak ditentukan",
                    description: businessDescription || "Belum ada deskripsi",
                    type: businessType || "Tipe tidak ditentukan",
                  };
                  const recent = history.slice(-12); // limit history to keep payload light
                  const payload = {
                    // include both `message` and `messages` for compatibility with the server route
                    message: prompt,
                    messages: [
                      {
                        role: "system",
                        content: `Gunakan konteks bisnis: nama=${businessContext.name}; tipe=${businessContext.type}; lokasi=${businessContext.location}; deskripsi=${businessContext.description}. Jangan memaksakan penyebutan nama bisnis jika tidak relevan; gunakan hanya ketika membantu jawaban. Utamakan penalaran dan sampaikan jawaban singkat, terstruktur, dan langsung.`,
                      },
                      ...recent.map((m) => ({
                        role: m.role === "ai" ? "assistant" : "user",
                        content: m.text,
                      })),
                      { role: "user", content: prompt },
                    ],
                    topic,
                    context: businessContext,
                    businessName,
                    businessType,
                  };

                  const res = await fetch(url, {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify(payload),
                  });

                  if (!res.ok) {
                    const txt = await res.text().catch(() => "");
                    throw new Error(`Server returned ${res.status}: ${txt}`);
                  }

                  const json = await res.json().catch(() => null);
                  // Prefer structured summary or reply field
                  if (json && json.structured && json.structured.summary)
                    return { text: json.structured.summary };
                  if (json && json.reply) return { text: json.reply };
                  if (json && json.text) return { text: json.text };

                  return {
                    text: "AI tidak mengembalikan jawaban yang dapat diproses.",
                  };
                } catch (err) {
                  return { text: `Gagal memanggil AI: ${err.message}` };
                }
              }}
            />
          </div>
        ) : selectedMenu === "keuangan" ? (
          // Keuangan view
          <div>
            <div className="flex items-center gap-3 mb-4">
              <button
                onClick={() => setSelectedMenu("beranda")}
                className="text-sm text-slate-600 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-900"
              >
                ← Kembali ke Dashboard
              </button>
            </div>

            <MenuKeuangan
              businessName={businessName}
              period={
                marketData?.period || new Date().toISOString().slice(0, 7)
              }
              salesData={marketData?.sales || []}
              incomes={marketData?.incomes || []}
              marketingExpenses={marketData?.marketing || []}
            />
          </div>
        ) : selectedMenu === "pengaturan" ? (
          // Pengaturan view
          <div>
            <div className="flex items-center gap-3 mb-4">
              <button
                onClick={() => setSelectedMenu("beranda")}
                className="text-sm text-slate-600 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-900"
              >
                ← Kembali ke Dashboard
              </button>
            </div>
            <MenuPengaturan
              currentBusinessName={businessName}
              currentUserName={userName}
              currentUserEmail={currentUserEmail}
              currentBusinessLocation={businessLocation}
              currentBusinessDescription={businessDescription}
              currentBusinessType={businessType}
              onUpdateSettings={onUpdateSettings}
              onDeleteAccount={onDeleteAccount}
            />
          </div>
        ) : (
          <>
            <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white rounded-2xl p-6 mb-8 shadow-lg flex justify-between items-center">
              <div>
                <h1 className="text-xl font-bold">Halo, {userName}!</h1>
                <p className="text-sm text-slate-700 dark:text-white/90">
                  AI telah menyiapkan strategi hari ini untuk{" "}
                  <span className="font-bold underline">{businessName}</span>.
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <EmployeeAbsence
                absences={absences}
                onAddAbsence={onAddAbsence}
                employees={employees}
                onAddEmployee={onAddEmployee}
                onDeleteEmployee={onDeleteEmployee}
              />
              <div className="lg:col-span-2 space-y-6">
                <MarketIntelligence
                  businessName={businessName}
                  marketData={marketData}
                  businessLocation={businessLocation}
                  businessDescription={businessDescription}
                  businessType={businessType}
                />
                {/* NEW: Custom Calendar below the MarketIntelligence (grafik toko) - Full width like the graph */}
                <div className="bg-white dark:bg-slate-800 rounded-lg shadow p-4">
                  <h2 className="text-lg font-semibold mb-4 text-slate-800 dark:text-slate-200">Kalender Acara</h2>
                  <div className="flex flex-col lg:flex-row gap-4">
                    {/* Calendar Grid (Tanggal di sebelah kiri) */}
                    <div className="flex-1">
                      <div className="flex justify-between items-center mb-4">
                        <button onClick={handlePrevMonth} className="text-slate-600 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200">
                          <i className="fas fa-chevron-left"></i>
                        </button>
                        <h3 className="text-lg font-semibold text-slate-800 dark:text-slate-200">
                          {monthNames[currentDate.getMonth()]} {currentDate.getFullYear()}
                        </h3>
                        <button onClick={handleNextMonth} className="text-slate-600 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200">
                          <i className="fas fa-chevron-right"></i>
                        </button>
                      </div>
                      <div className="grid grid-cols-7 gap-1 mb-2">
                        {dayNames.map(day => (
                          <div key={day} className="text-center text-sm font-medium text-slate-500 dark:text-slate-400">
                            {day}
                          </div>
                        ))}
                      </div>
                      <div className="grid grid-cols-7 gap-1">
                        {getDaysInMonth(currentDate).map((day, index) => {
                          const eventCount = getEventsForDay(day).length;
                          const dots = eventCount > 0 ? '.'.repeat(Math.min(eventCount, 5)) : '';
                          return (
                            <div
                              key={index}
                              onClick={() => handleDateClick(day)}
                              className={`text-center py-2 px-1 text-sm cursor-pointer rounded hover:bg-slate-100 dark:hover:bg-slate-700 ${day ? 'text-slate-800 dark:text-slate-200' : ''
                                } ${selectedDate === `${currentDate.getFullYear()}-${String(currentDate.getMonth() + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}` ? 'bg-blue-100 dark:bg-blue-900' : ''}`}
                            >
                              {day}
                              {dots && (
                                <div className="mt-1">
                                  <div className="bg-blue-200 dark:bg-blue-800 text-blue-800 dark:text-blue-200 text-xs rounded-full px-1">
                                    {dots}
                                  </div>
                                </div>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    </div>
                    {/* Event Panel (Di sebelah kanan) */}
                    <div className="flex-1 border-l border-slate-200 dark:border-slate-700 pl-4">
                      {selectedDate ? (
                        <>
                          <h3 className="text-md font-semibold mb-2 text-slate-800 dark:text-slate-200">
                            Acara pada {selectedDate}
                          </h3>
                          <div className="space-y-2 max-h-48 overflow-y-auto mb-4">
                            {(events[selectedDate] || []).map((event, index) => (
                              <div key={index} className="flex justify-between items-center bg-slate-100 dark:bg-slate-700 rounded px-2 py-1">
                                <span className="text-sm text-slate-800 dark:text-slate-200">{event}</span>
                                <button
                                  onClick={() => handleDeleteEvent(selectedDate, index)}
                                  className="text-red-500 hover:text-red-700 text-sm"
                                  title="Hapus Acara"
                                >
                                  <i className="fas fa-trash-alt"></i>
                                </button>
                              </div>
                            ))}
                            {(!events[selectedDate] || events[selectedDate].length === 0) && (
                              <p className="text-sm text-slate-500 dark:text-slate-400">Tidak ada acara untuk tanggal ini.</p>
                            )}
                          </div>
                          <div className="flex gap-2">
                            <input
                              type="text"
                              value={newEvent}
                              onChange={(e) => setNewEvent(e.target.value)}
                              className="flex-1 border border-slate-300 dark:border-slate-600 rounded px-2 py-1 text-sm bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200"
                              placeholder="Tambah acara baru..."
                            />
                            <button
                              onClick={handleAddEvent}
                              className="bg-blue-600 text-white px-3 py-1 rounded text-sm hover:bg-blue-700 dark:bg-blue-700 dark:hover:bg-blue-600"
                            >
                              Tambah
                            </button>
                          </div>
                        </>
                      ) : (
                        <p className="text-sm text-slate-500 dark:text-slate-400">Pilih tanggal untuk melihat atau menambah acara.</p>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </>
        )}
      </main>
    </div>
  );
}
