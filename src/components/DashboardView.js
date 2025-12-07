// src/components/DashboardView.js
"use client";

import { useAuth } from "@/lib/auth";
import { useEffect, useRef, useState } from "react";
import { getTheme, setTheme, saveCalendarEvents } from "@/lib/userSettings";
import EmployeeAbsence from "./EmployeeAbsence";
import MarketIntelligence from "./MarketIntelligence";
import MenuPemasaranAI from "./MenuPemasaranAI";
import MenuChatAI from "./MenuChatAI";
import MenuKeuangan from "./MenuKeuangan";
import MenuPengaturan from "./MenuPengaturan";
import MenuRiwayatPenjualan from "./MenuRiwayatPenjualan";
import MenuStokBarang from "./MenuStokBarang";

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
  instagramUsername = "",
  tiktokUsername = "",
  whatsappNumber = "",
  stockItems,
  onAddStockItem,
  onUpdateStockItem,
  onDeleteStockItem,
  salesHistory = [],
  onRecordSale,
  onAddMarketingExpense,
  onAddOtherIncome,
  calendarEvents = {},
  onSetCalendarEvents,
}) {
  const chartRef = useRef(null);
  const [selectedMenu, setSelectedMenu] = useState("beranda");
  const [currentTheme, setCurrentTheme] = useState("light");

  // NEW STATE FOR CALENDAR
  const [currentDate, setCurrentDate] = useState(new Date());
  const [events, setEvents] = useState(calendarEvents || {}); // Object: key is date string (YYYY-MM-DD), value is array of event objects
  const [selectedDate, setSelectedDate] = useState(null); // Selected date for event panel
  const [newEvent, setNewEvent] = useState(""); // Input for new event
  const { user, loading: authLoading } = useAuth();

  // Helper function untuk format mata uang
  const currency = (v) =>
    new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: "IDR",
      maximumFractionDigits: 0,
    }).format(v);

  // Firebase fallback: Jika data props kosong tapi user sudah login, coba ambil dari Firebase
  useEffect(() => {
    if (!user?.uid || authLoading) return;

    // Jika sudah ada data di props, tidak perlu load ulang
    const hasData = (stockItems && stockItems.length > 0) || (salesHistory && salesHistory.length > 0);
    if (hasData) {
      console.log('[DashboardView] Data sudah ada di props, skip Firebase load');
      return;
    }

    console.log('[DashboardView] Data kosong, mencoba diagnostik Firebase...');
    
    (async () => {
      try {
        const settings = await getUserSettings(user.uid);
        if (settings && (settings.stockItems?.length > 0 || settings.salesHistory?.length > 0)) {
          console.log('[DashboardView] Firebase data ditemukan:', {
            stockItems: settings.stockItems?.length || 0,
            salesHistory: settings.salesHistory?.length || 0,
          });
        } else {
          console.log('[DashboardView] Firebase data kosong atau tidak ada');
        }
      } catch (err) {
        console.error('[DashboardView] Gagal ambil dari Firebase:', err?.message || err);
      }
    })();
  }, [user?.uid, authLoading, stockItems, salesHistory]);


  // Hitung total penjualan hari ini
  const calculateTodaySales = () => {
    // Menggunakan tanggal mock '2025-12-07' untuk konsistensi dengan mock data dari page.js
    const today = "2025-12-07";

    // Ambil data sales dari marketData
    const sales = marketData?.sales || [];

    // 1. Filter transaksi hari ini
    const todaySales = sales.filter((item) => item.date === today);

    // 2. Hitung totalnya: qty * price
    const total = todaySales.reduce((sum, item) => {
      const itemTotal =
        item.qty && item.price ? item.qty * item.price : item.amount || 0;
      return sum + itemTotal;
    }, 0);

    return total;
  };

  // NEW: Hitung total barang terjual hari ini
  const calculateTotalItemsToday = () => {
    const today = "2025-12-07";
    const sales = marketData?.sales || [];

    const todaySales = sales.filter((item) => item.date === today);

    const totalItems = todaySales.reduce((sum, item) => {
      return sum + (item.qty || 0);
    }, 0);

    return totalItems;
  };

  const totalSalesToday = calculateTodaySales();
  const totalItemsToday = calculateTotalItemsToday();

  // Theme initialization - dari cookie
  useEffect(() => {
    // Load theme dari cookie (tidak perlu tunggu user login)
    const theme = getTheme();
    setCurrentTheme(theme);
    // Calendar events sudah di-load dari parent (page.js) via props, jadi tidak perlu load di sini
  }, []);

  // Apply theme class immediately when currentTheme changes (includes initial load)
  useEffect(() => {
    if (typeof document === "undefined") return;
    const root = document.documentElement;
    if (currentTheme === "dark") {
      root.classList.add("dark");
    } else {
      root.classList.remove("dark");
    }
  }, [currentTheme]);

  const handleThemeToggle = () => {
    // Toggle theme dan simpan ke cookie (tidak perlu async)
    const newTheme = currentTheme === "light" ? "dark" : "light";
    
    // Apply immediately
    setCurrentTheme(newTheme);
    
    // Persist ke cookie
    setTheme(newTheme);
    
    console.log(`[Theme] Changed to ${newTheme} (saved in cookie)`);
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
    setCurrentDate(
      new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1)
    );
    setSelectedDate(null); // Reset selected date on month change
  };

  const handleNextMonth = () => {
    setCurrentDate(
      new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1)
    );
    setSelectedDate(null); // Reset selected date on month change
  };

  const handleDateClick = (day) => {
    if (!day) return;
    const dateKey = `${currentDate.getFullYear()}-${String(
      currentDate.getMonth() + 1
    ).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
    setSelectedDate(dateKey);
    setNewEvent(""); // Reset input
  };

  const handleAddEvent = () => {
    if (!selectedDate || !newEvent.trim()) return;
    const eventObj = {
      id: `${Date.now()}-${Math.random().toString(16).slice(2)}`,
      title: newEvent.trim(),
      type: "Catatan",
      content: "",
      source: "manual",
    };
    const updatedEvents = {
      ...events,
      [selectedDate]: [...(events[selectedDate] || []), eventObj],
    };
    setEvents(updatedEvents);
    // Sync with parent component
    if (onSetCalendarEvents) {
      onSetCalendarEvents(updatedEvents);
    }
    setNewEvent("");
    // Save to Firebase
    if (user && user.uid) {
      saveCalendarEvents(user.uid, updatedEvents).catch((err) => {
        console.error("Failed to save calendar events:", err);
      });
    }
  };

  const handleDeleteEvent = (dateKey, id) => {
    setEvents((prev) => {
      const newEvents = { ...prev };
      newEvents[dateKey] = (newEvents[dateKey] || []).filter(
        (item) => item.id !== id
      );
      if (newEvents[dateKey]?.length === 0) delete newEvents[dateKey];
      // Sync with parent component
      if (onSetCalendarEvents) {
        onSetCalendarEvents(newEvents);
      }
      // Save to Firebase
      if (user && user.uid) {
        saveCalendarEvents(user.uid, newEvents).catch((err) => {
          console.error("Failed to save calendar events:", err);
        });
      }
      return newEvents;
    });
  };

  const getEventsForDay = (day) => {
    if (!day) return [];
    const dateKey = `${currentDate.getFullYear()}-${String(
      currentDate.getMonth() + 1
    ).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
    return events[dateKey] || [];
  };

  const addMarketingEvent = ({ date, type, content, platform }) => {
    if (!date || !type || !content) return;
    const dateKey = date;
    const eventObj = {
      id: `${Date.now()}-${Math.random().toString(16).slice(2)}`,
      title: `Iklan - ${type}`,
      type,
      content,
      platform,
      source: "marketing",
    };
    const updatedEvents = {
      ...events,
      [dateKey]: [...(events[dateKey] || []), eventObj],
    };
    setEvents(updatedEvents);
    // Sync with parent component
    if (onSetCalendarEvents) {
      onSetCalendarEvents(updatedEvents);
    }
    // Save to Firebase
    if (user && user.uid) {
      saveCalendarEvents(user.uid, updatedEvents).catch((err) => {
        console.error("Failed to save calendar events:", err);
      });
    }
  };

  const monthNames = [
    "Januari",
    "Februari",
    "Maret",
    "April",
    "Mei",
    "Juni",
    "Juli",
    "Agustus",
    "September",
    "Oktober",
    "November",
    "Desember",
  ];
  const dayNames = ["Min", "Sen", "Sel", "Rab", "Kam", "Jum", "Sab"];

  const marketingEntries = Object.entries(events).flatMap(([dateKey, arr]) =>
    (arr || [])
      .filter((item) => item.source === "marketing")
      .map((item) => ({ ...item, date: dateKey }))
  );

  return (
    // Base colors set to pure light (white) by default, dark remains for toggle
    <div className="min-h-screen flex bg-white dark:bg-slate-900">
      {/* Sidebar - base colors set to light mode: bg-white */}
      <aside className="w-64 bg-white bg-slate-00 border-r border-slate-200 dark:border-slate-700 hidden md:flex flex-col fixed h-full z-10">
        <div className="p-6 border-b border-slate-300 dark:border-slate-700">
          <div className="flex items-center gap-2 font-bold text-l text-indigo-700 dark:text-indigo-700">
            <i className="fas fa-store"></i> <span>{businessName}</span>
          </div>
          <p className="text-xs text-slate-600 dark:text-slate-500 mt-1">
            Managed by Meta Bisnis
          </p>
        </div>

        <nav className="p-4 space-y-1 flex-1">
          {[
            { name: "Beranda", icon: "fa-home", menu: "beranda" },
            { name: "Pemasaran AI", icon: "fa-bullhorn", menu: "pemasaran" },
            { name: "Laporan keuangan", icon: "fa-calculator", menu: "keuangan" },
            { name: "Stok Barang", icon: "fa-boxes", menu: "stok" },
            {
              name: "Riwayat Penjualan",
              icon: "fa-shopping-cart",
              menu: "riwayat",
            },
            { name: "Chat AI", icon: "fa-comments", menu: "chat" },
            { name: "Pengaturan", icon: "fa-cog", menu: "pengaturan" },
          ].map((item) => (
            <button
              key={item.menu}
              onClick={() => setSelectedMenu(item.menu)}
              className={`w-full text-left flex items-center justify-between gap-3 px-4 py-3 rounded-lg font-medium transition-colors
            ${
              selectedMenu === item.menu
                ? // KONDISI KETIKA MENU AKTIF: Latar belakang biru muda, font-weight diatur di <span>
                  ""
                : // KONDISI KETIKA MENU TIDAK AKTIF: Teks abu-abu
                  "text-slate-600 hover:bg-slate-100"
            }
          `}
            >
              <div className="flex items-center gap-3">
                {/* 1. KONTROL IKON: Warna biru ketika aktif, abu-abu ketika tidak */}
                <i
                  className={`fas ${item.icon} w-5 
                ${
                  selectedMenu === item.menu
                    ? "text-blue-700" // IKON TETAP BIRU
                    : "text-slate-500"
                }
              `}
                ></i>

                {/* 2. KONTROL TEKS: Bold dan warna hitam ketika aktif */}
                <span
                  className={`${
                    selectedMenu === item.menu
                      ? "font-bold text-slate-800" // TEKS JADI BOLD DAN WARNA HITAM
                      : "font-medium" // Teks tidak aktif
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
            className="flex items-center gap-3 px-4 py-2 text-slate-600 dark:text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg w-full transition-colors text-sm font-medium"
            // Ganti isDarkMode di sini
            title={
              currentTheme === "dark"
                ? "Ganti ke Mode Terang"
                : "Ganti ke Mode Gelap"
            }
          >
            <i
              className={`fas ${
                // Ganti isDarkMode di sini
                currentTheme === "dark"
                  ? "fa-moon text-indigo-700"
                  : "fa-sun text-yellow-500"
              } w-5`}
            ></i>
            {/* Ganti isDarkMode di sini */}
            {currentTheme === "dark" ? "Mode Gelap" : "Mode Terang"}
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
      <main className="main-content-bg flex-1 md:ml-64 p-4 md:p-8 overflow-y-auto">
        {selectedMenu === "stok" ? ( // NEW RENDER CONDITION
          <div>
            <div className="flex items-center gap-3 mb-4">
              <button
                onClick={() => setSelectedMenu("beranda")}
                className="text-sm text-slate-600 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-900"
              >
                ← Kembali ke Dashboard
              </button>
            </div>
            <MenuStokBarang
              businessName={businessName}
              stockItems={stockItems}
              onAddStockItem={onAddStockItem}
              onUpdateStockItem={onUpdateStockItem}
              onDeleteStockItem={onDeleteStockItem}
            />
          </div>
        ) : selectedMenu === "pemasaran" ? (
          <MenuPemasaranAI
            businessName={businessName}
            businessLocation={businessLocation}
            businessType={businessType}
            instagramUsername={instagramUsername}
            tiktokUsername={tiktokUsername}
            whatsappNumber={whatsappNumber}
            calendarEntries={marketingEntries}
            onAddCalendarItem={addMarketingEvent}
            onDeleteCalendarItem={handleDeleteEvent}
            salesData={marketData?.sales}
            onSave={(payload) => {
              console.log("Konten disimpan:", payload);
            }}
            onBack={() => setSelectedMenu("beranda")}
          />
        ) : selectedMenu === "chat" ? (
          <div className="flex flex-col h-full">
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
        ) : selectedMenu === "riwayat" ? (
          // Riwayat Penjualan view
          <div>
            <div className="flex items-center gap-3 mb-4">
              <button
                onClick={() => setSelectedMenu("beranda")}
                className="text-sm text-slate-600 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-900"
              >
                ← Kembali ke Dashboard
              </button>
            </div>
            <MenuRiwayatPenjualan
              businessName={businessName}
              period={marketData?.period || new Date().toISOString().slice(0, 7)}
              salesHistoryData={marketData?.salesHistory || null}
              stockItems={stockItems}
              onAddSale={onRecordSale}
              onAddMarketingExpense={onAddMarketingExpense}
              onAddOtherIncome={onAddOtherIncome}
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
              currentInstagramUsername={instagramUsername}
              currentTiktokUsername={tiktokUsername}
              currentWhatsappNumber={whatsappNumber}
              onUpdateSettings={onUpdateSettings}
              onDeleteAccount={onDeleteAccount}
            />
          </div>
        ) : (
          <>
            <div className="bg-white text-slate-900 rounded-2xl p-6 mb-8 border shadow-sm border-slate-200 flex justify-between items-center">
              <div>
                <h1 className="text-xl font-bold">Halo, {userName}!</h1>
                <p className="text-sm text-slate-700">
                  AI telah menyiapkan strategi hari ini untuk{" "}
                  <span className="font-bold underline">{businessName}</span>.
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Kolom Kiri: Total Penjualan & Kehadiran Karyawan */}
              <div className="lg:col-span-1 space-y-6">
                {/* KOTAK BARU: TOTAL PENJUALAN HARI INI */}
                <div className="bg-white p-6 rounded-2xl shadow-sm border-slate-200 border h-fit">
                  <h3 className="font-bold text-slate-800 dark:text-slate-900 mb-4 flex items-center gap-2">
                    <i className="fas fa-sack-dollar text-green-600"></i> Total
                    Penjualan Hari Ini
                  </h3>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="rounded-xl p-4 border bg-slate-50 dark:border-blue-200 dark:bg-white">
                      <p className="text-xs text-slate-800 dark:text-slate-700 uppercase font-semibold text-center">
                        Penjualan Kotor
                      </p>
                      <h2 className="text-xl font-bold text-green-800 dark:text-green-600 mt-2 text-center">
                        {currency(totalSalesToday)}
                      </h2>
                    </div>
                    {/* NEW CARD: Total Produk Terjual */}
                    <div className="rounded-xl p-4 border border-indigo-300 bg-slate-50 dark:border-blue-200 dark:bg-white">
                      <p className="text-xs text-slate-800 dark:text-slate-700 uppercase font-semibold text-center">
                        Total Produk Terjual
                      </p>
                      <h2 className="text-xl font-bold text-indigo-800 dark:text-red-600 mt-1 text-center">
                        {totalItemsToday}
                      </h2>
                    </div>
                  </div>
                  <p className="text-xs text-slate-600 dark:text-slate-400 mt-3 text-center">
                    Per{" "}
                    {new Date().toLocaleDateString("id-ID", {
                      day: "numeric",
                      month: "short",
                      year: "numeric",
                    })}
                  </p>
                </div>

                {/* KOMPONEN ASLI: Kehadiran Karyawan */}
                <EmployeeAbsence
                  absences={absences}
                  onAddAbsence={onAddAbsence}
                  employees={employees}
                  onAddEmployee={onAddEmployee}
                  onDeleteEmployee={onDeleteEmployee}
                />
              </div>

              {/* Kolom Kanan: Market Intelligence & Kalender */}
              <div className="lg:col-span-2 space-y-6">
                <MarketIntelligence
                  businessName={businessName}
                  marketData={marketData}
                  businessLocation={businessLocation}
                  businessDescription={businessDescription}
                  businessType={businessType}
                  salesHistory={salesHistory}
                />
                {/* NEW: Custom Calendar below the MarketIntelligence (grafik toko) - Full width like the graph */}
                <div className="bg-white rounded-lg shadow p-4">
                  <h2 className="text-lg font-semibold mb-4 text-slate-800 dark:text-slate-700">
                    Kalender Acara
                  </h2>
                  <div className="flex flex-col lg:flex-row gap-4">
                    {/* Calendar Grid (Tanggal di sebelah kiri) */}
                    <div className="flex-1">
                      <div className="flex justify-between items-center mb-4">
                        <button
                          onClick={handlePrevMonth}
                          className="text-slate-600 dark:text-slate-600 hover:text-slate-800 dark:hover:text-slate-200"
                        >
                          <i className="fas fa-chevron-left"></i>
                        </button>
                        <h3 className="text-lg font-semibold text-slate-800 dark:text-slate-700">
                          {monthNames[currentDate.getMonth()]}{" "}
                          {currentDate.getFullYear()}
                        </h3>
                        <button
                          onClick={handleNextMonth}
                          className="text-slate-600 dark:text-slate-600 hover:text-slate-800 dark:hover:text-slate-200"
                        >
                          <i className="fas fa-chevron-right"></i>
                        </button>
                      </div>
                      <div className="grid grid-cols-7 gap-1 mb-2">
                        {dayNames.map((day) => (
                          <div
                            key={day}
                            className="text-center text-sm font-medium text-slate-500 dark:text-slate-600"
                          >
                            {day}
                          </div>
                        ))}
                      </div>
                      <div className="grid grid-cols-7 gap-1">
                        {getDaysInMonth(currentDate).map((day, index) => {
                          const eventCount = getEventsForDay(day).length;
                          const badgeClass = (() => {
                            switch (true) {
                              case eventCount === 1:
                                // REKOMENDASI 3: SLATE (Terang)
                                return "bg-slate-200 text-slate-900";
                              case eventCount === 2:
                                // REKOMENDASI 3: BLUE
                                return "bg-blue-100 text-blue-800";
                              case eventCount === 3:
                                // REKOMENDASI 3: BLUE MEDIUM
                                return "bg-blue-300 text-blue-900";
                              case eventCount === 4:
                                // REKOMENDASI 3: INDIGO (Gelap)
                                return "bg-indigo-600 text-white";
                              case eventCount >= 5:
                                // REKOMENDASI 3: RED (Kritis)
                                return "bg-red-600 text-white";
                              default:
                                return "";
                            }
                          })();
                          return (
                            <div
                              key={index}
                              onClick={() => handleDateClick(day)}
                              className={`text-center py-2 px-1 text-sm cursor-pointer rounded hover:bg-slate-100 dark:hover:bg-slate-300 ${
                                day ? "text-slate-800 dark:text-slate-700" : ""
                              } ${
                                selectedDate ===
                                `${currentDate.getFullYear()}-${String(
                                  currentDate.getMonth() + 1
                                ).padStart(2, "0")}-${String(day).padStart(
                                  2,
                                  "0"
                                )}`
                                  ? "bg-blue-100 dark:bg-blue-300"
                                  : ""
                              }`}
                            >
                              {day}
                              {eventCount > 0 && (
                                <div className="mt-1">
                                  <div
                                    className={`${badgeClass} text-xs rounded-full px-2 py-0.5 font-semibold`}
                                  >
                                    {eventCount}
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
                          <h3 className="text-md font-semibold mb-2 text-slate-800 dark:text-slate-700">
                            Acara pada {selectedDate}
                          </h3>
                          <div className="space-y-2 max-h-48 overflow-y-auto mb-4">
                            {(events[selectedDate] || []).map((event) => (
                              <div
                                key={event.id}
                                className="flex justify-between items-start dark:bg-slate-50 bg-white rounded px-2 py-2 gap-3"
                              >
                                <div className="flex-1">
                                  <div className="flex items-center gap-2">
                                    <p className="text-sm font-semibold text-slate-800 dark:text-slate-600">
                                      {event.title}
                                    </p>
                                    {event.type && (
                                      <span className="text-[11px] px-2 py-0.5 rounded-full bg-indigo-50 text-indigo-700 border border-indigo-100">
                                        {event.type}
                                      </span>
                                    )}
                                  </div>
                                  {event.content && (
                                    <p className="text-xs text-slate-600 overflow-hidden text-ellipsis">
                                      {event.content}
                                    </p>
                                  )}
                                </div>
                                <button
                                  onClick={() =>
                                    handleDeleteEvent(selectedDate, event.id)
                                  }
                                  className="text-red-500 hover:text-red-700 text-sm"
                                  title="Hapus Acara"
                                >
                                  <i className="fas fa-trash-alt"></i>
                                </button>
                              </div>
                            ))}
                            {(!events[selectedDate] ||
                              events[selectedDate].length === 0) && (
                              <p className="text-sm text-slate-500 dark:text-slate-600">
                                Tidak ada acara untuk tanggal ini.
                              </p>
                            )}
                          </div>
                          <div className="flex gap-2">
                            <input
                              type="text"
                              value={newEvent}
                              onChange={(e) => setNewEvent(e.target.value)}
                              className="flex-1 border border-slate-300 dark:border-slate-600 rounded px-2 py-1 text-sm bg-white dark:bg-slate-100 text-slate-800 dark:text-slate-700"
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
                        <p className="text-sm text-slate-500 dark:text-slate-400">
                          Pilih tanggal untuk melihat atau menambah acara.
                        </p>
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
