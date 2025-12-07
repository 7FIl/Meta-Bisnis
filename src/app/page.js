// src/app/page.js
'use client';

import { useState, useEffect, useRef } from 'react';
import { onAuthStateChanged, deleteUser } from 'firebase/auth'; 
import { auth } from '@/lib/firebase';
import { saveUserSettings, getUserSettings } from '@/lib/userSettings';
import { loginWithGoogle, logoutUser } from '@/lib/auth';
import { useToast } from '@/components/Toast';
import { useAlert } from '@/components/Alert';
import { setTempData, getTempData, removeTempData } from '@/lib/cookies';
import { fetchBusinessData, saveBusinessData, DEFAULT_BUSINESS_DATA } from '@/lib/businessData';

import ConsultationView from '@/components/ConsultationView';
import DashboardView from '@/components/DashboardView';
import OnboardingView from '@/components/OnboardingView';

const mapSalesHistoryToFinance = (history = []) =>
  history.map((s) => {
    const date = s.dateTime?.split(" - ")[0]?.replace(/\//g, "-") || "";
    return {
      date,
      itemCode: s.kodeBarang,
      product: s.namaBarang,
      qty: s.jumlah,
      price: s.hargaJual,
    };
  });

export default function Home() {
  const toast = useToast();
  const alert = useAlert();
  const [user, setUser] = useState(null);
  const [currentView, setCurrentView] = useState('consultation'); // 'consultation', 'onboarding', atau 'dashboard'
  const [shouldSkipOnboarding, setShouldSkipOnboarding] = useState(false); // Flag untuk skip onboarding jika dari AI
  const [businessData, setBusinessData] = useState(null);
  const [absences, setAbsences] = useState([]);
  const [calendarEvents, setCalendarEvents] = useState({}); // Calendar events: { 'YYYY-MM-DD': [{ id, title, type, content, source }] }
  const [employees, setEmployees] = useState([]);
  const [showAdModal, setShowAdModal] = useState(false);

  // Persediaan & penjualan terpusat
  const [stockItems, setStockItems] = useState([]);
  const [salesHistory, setSalesHistory] = useState([]);
  const [marketData, setMarketData] = useState({
    period: new Date().toISOString().slice(0, 7),
    sales: [],
    incomes: [],
    marketing: [],
    salesHistory: [],
  });
  const [loading, setLoading] = useState(false);
  const [dataLoaded, setDataLoaded] = useState(false);
  const [onboardingCompleted, setOnboardingCompleted] = useState(false);
  // State mock untuk nama pengguna dan bisnis yang bisa diubah di Pengaturan
  const [currentUserName, setCurrentUserName] = useState('Pengguna');
  const [currentBusinessName, setCurrentBusinessName] = useState('Dashboard');
  const [currentBusinessLocation, setCurrentBusinessLocation] = useState('Lokasi Tidak Diketahui');
  const [currentBusinessDescription, setCurrentBusinessDescription] = useState('');
  const [currentBusinessType, setCurrentBusinessType] = useState('');
  const [currentInstagramUsername, setCurrentInstagramUsername] = useState('');
  const [currentTiktokUsername, setCurrentTiktokUsername] = useState('');
  const [currentWhatsappNumber, setCurrentWhatsappNumber] = useState('');
  const autoSaveTimerRef = useRef(null);
  const persistTimerRef = useRef(null); // Timer untuk debounce persist
  
  
  // Auth listener
  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      if (currentUser) {
        // Set initial user name from firebase/email
        setCurrentUserName(currentUser.displayName || currentUser.email.split('@')[0]);
        
        (async () => {
          let hasBusinessData = false;
          try {
            // CEK TEMP DATA: Jika ada data temporary dari consultation view, transfer ke Firebase
            const tempData = getTempData('meta_bisnis_temp');
            if (tempData && tempData.businessName) {
              // Cek apakah user dari AI recommendation (skipOnboarding = true)
              if (tempData.skipOnboarding) {
                setShouldSkipOnboarding(true);
              }
              // Merge dengan default settings
              const mergedSettings = {
                businessName: tempData.businessName,
                userName: tempData.userName || currentUser.displayName || currentUser.email.split('@')[0],
                businessLocation: tempData.businessLocation || 'Lokasi Tidak Diketahui',
                businessDescription: tempData.businessDescription || '',
                businessType: tempData.businessType || '',
                businessData: tempData.businessData || {
                  name: tempData.businessName,
                  description: tempData.businessDescription || 'Dari konsultasi AI',
                  capital_est: tempData.capital_est || 'N/A',
                  target_market: tempData.target_market || 'N/A',
                  challenge: tempData.challenge || 'N/A',
                  location: tempData.businessLocation || 'N/A',
                  businessType: tempData.businessType || ''
                },
                employees: [],
              };
              
              // Save ke Firebase
              await saveUserSettings(currentUser.uid, mergedSettings);
              
              // Apply ke state
              setCurrentBusinessName(mergedSettings.businessName);
              setCurrentUserName(mergedSettings.userName);
              setCurrentBusinessLocation(mergedSettings.businessLocation);
              setCurrentBusinessDescription(mergedSettings.businessDescription);
              setCurrentBusinessType(mergedSettings.businessType);
              setBusinessData(mergedSettings.businessData);
              
              // Hapus temp data
              removeTempData('meta_bisnis_temp');
              hasBusinessData = true;
            }
            
            // Jika belum ada business data dari temp (artinya ini refresh page atau login biasa)
            if (!hasBusinessData) {
              const settings = await getUserSettings(currentUser.uid);
              
              if (settings) {
                // 1. Masukkan data dari Firebase ke State
                setCurrentBusinessName(settings.businessName || 'Dashboard Bisnis');
                setCurrentUserName(settings.userName || currentUser.displayName || 'Pengguna');
                setCurrentBusinessLocation(settings.businessLocation || 'Lokasi Tidak Diketahui');
                setCurrentBusinessDescription(settings.businessDescription || '');
                setCurrentBusinessType(settings.businessType || '');
                setEmployees(settings.employees || []);
                // Load social media usernames
                setCurrentInstagramUsername(settings.instagramUsername || '');
                setCurrentTiktokUsername(settings.tiktokUsername || '');
                setCurrentWhatsappNumber(settings.whatsappNumber || '');
                // Load absences
                setAbsences(settings.absences || []);
                // Load calendar events
                setCalendarEvents(settings.calendarEvents || {});

                if (settings.businessData) {
                  setBusinessData(settings.businessData);
                }

                // Returning user: langsung ke dashboard
                setCurrentView('dashboard');
                setOnboardingCompleted(true);
              } else {
                // Jika dokumen settings tidak ada di Firebase -> User Baru
                // Cek apakah dari AI temp data dengan skipOnboarding flag
                if (shouldSkipOnboarding) {
                  // User dari AI di ConsultationView -> langsung ke dashboard tanpa onboarding
                  setCurrentView('dashboard');
                  setOnboardingCompleted(false); // Masih dianggap baru tapi skip onboarding
                } else {
                  // User baru murni (dari registration flow) -> show onboarding
                  setCurrentView('onboarding');
                  setOnboardingCompleted(false);
                }
              }
            }

          } catch (e) {
            console.error('Failed to load user settings:', e);
            // Pada error, default ke dashboard agar tidak mengganggu alur login existing
            setCurrentView('dashboard');
          }
        })();
      } else {
        // Reset ke default dan kembali ke consultation view
        setCurrentView('consultation');
        setCurrentUserName('Pengguna');
        setCurrentBusinessName('Dashboard');
        setCurrentBusinessLocation('Lokasi Tidak Diketahui');
        setCurrentBusinessDescription('');
        setEmployees([]);
        setBusinessData(null); 
      }
    });
    return () => unsub();
  }, []);

  // Load business data from Firestore when user is ready
  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      setDataLoaded(false);
      if (!user?.uid) {
        setStockItems([]);
        setSalesHistory([]);
        setMarketData(DEFAULT_BUSINESS_DATA.marketData);
        setDataLoaded(true);
        return;
      }
      setLoading(true);
      try {
        // Prefer reading from the user's settings doc (same place MenuPengaturan writes)
        let data = null;
        try {
          const settings = await getUserSettings(user.uid);
          if (settings) {
            data = {
              stockItems: settings.stockItems || settings.businessData?.stockItems || [],
              salesHistory: settings.salesHistory || settings.businessData?.salesHistory || [],
              marketData: settings.marketData || settings.businessData?.marketData || DEFAULT_BUSINESS_DATA.marketData,
            };
          }
        } catch (e) {
          // ignore - we'll fallback to legacy collection
          data = null;
        }

        if (!data) {
          // fallback to legacy businessData collection
          data = await fetchBusinessData(user.uid);
        }

        const mappedSales = data.marketData?.sales?.length
          ? data.marketData.sales
          : mapSalesHistoryToFinance(data.salesHistory || []);

        if (cancelled) return;
        
        setStockItems(data.stockItems || []);
        setSalesHistory(data.salesHistory || []);
        setMarketData({
          period: data.marketData?.period || new Date().toISOString().slice(0, 7),
          sales: mappedSales,
          incomes: data.marketData?.incomes || [],
          marketing: data.marketData?.marketing || [],
          salesHistory: data.salesHistory || [],
        });
        // Jika ada data operasional, tandai onboarding selesai
        const hasOps = (data.stockItems && data.stockItems.length > 0) || (data.salesHistory && data.salesHistory.length > 0) || (data.marketData && (
          (data.marketData.sales && data.marketData.sales.length > 0) ||
          (data.marketData.incomes && data.marketData.incomes.length > 0) ||
          (data.marketData.marketing && data.marketData.marketing.length > 0) ||
          (data.marketData.salesHistory && data.marketData.salesHistory.length > 0)
        ));
        if (hasOps && !onboardingCompleted) {
          setOnboardingCompleted(true);
        }
        setDataLoaded(true);
      } catch (err) {
        console.warn('Failed to load business data (fallback):', err?.message || err);
      } finally {
        if (!cancelled) setLoading(false);
      }
    };
    load();
    return () => {
      cancelled = true;
    };
  }, [user?.uid]);

  // Persist business data whenever it changes (and user logged in)
  useEffect(() => {
    // PENTING: Jangan save jika data belum di-load atau masih loading
    // Ini mencegah state kosong menimpa data yang ada di Firebase
    if (!user?.uid || !dataLoaded || loading) {
      return;
    }
    
    // Clear previous timer untuk debounce
    if (persistTimerRef.current) {
      clearTimeout(persistTimerRef.current);
    }
    
    // Debounce 3 detik - tunggu sampai user selesai melakukan perubahan
    persistTimerRef.current = setTimeout(() => {
      // PERBAIKAN: Hanya save field yang spesifik, merge akan mempertahankan field lain
      const payload = {
        stockItems,
        salesHistory,
        marketData,
        // Save social media usernames
        instagramUsername: currentInstagramUsername,
        tiktokUsername: currentTiktokUsername,
        whatsappNumber: currentWhatsappNumber,
        // Save absences
        absences: absences,
        // Save calendar events
        calendarEvents: calendarEvents,
        lastUpdated: new Date().toISOString(), // Track terakhir update
      };
      
      // Save to the users doc (same place MenuPengaturan writes) to avoid
      // permission mismatches. If that fails or is not allowed, fall back
      // to the legacy businessData collection.
      (async () => {
        try {
          const ok = await saveUserSettings(user.uid, payload);
          if (!ok) {
            // legacy fallback
            await saveBusinessData(user.uid, payload);
          }
        } catch (e) {
          console.warn('[Persist] Failed to save to users doc, trying legacy collection:', e?.message || e);
          try { await saveBusinessData(user.uid, payload); } catch (_) {}
        }
      })();
    }, 3000); // 3 detik debounce
    
    // Cleanup timer saat component unmount atau dependency berubah
    return () => {
      if (persistTimerRef.current) {
        clearTimeout(persistTimerRef.current);
      }
    };
  }, [user?.uid, dataLoaded, loading, stockItems, salesHistory, marketData, currentInstagramUsername, currentTiktokUsername, currentWhatsappNumber, absences, calendarEvents]);

  const handleLogin = async () => {
    try {
      await loginWithGoogle();
      // onAuthStateChanged akan mengurus transisi (termasuk onboarding check)
    } catch (err) {
      console.error('Login failed', err);
      toast.error('Gagal login: ' + err.message);
    }
  };

  const handleLogout = async () => {
    await alert.warning(
      'Keluar Akun?',
      'Apakah Anda yakin ingin keluar dari dashboard bisnis?',
      async () => {
        try {
          await logoutUser();
          
          // Reset state lokal
          setCurrentView('consultation');
          setBusinessData(null);
          setAbsences([]);
          setShowAdModal(false);
          setMarketData(null);
          setCurrentBusinessName('Dashboard'); // Reset custom name
          setCurrentUserName('Pengguna'); // Reset custom name
          setCurrentBusinessLocation('Lokasi Tidak Diketahui');
          setCurrentBusinessDescription('');
          setEmployees([]);
          
          // 🚨 PERBAIKAN: Lakukan Hard Refresh setelah state direset dan logout berhasil
          if (typeof window !== 'undefined') {
              window.location.reload(); 
          }

        } catch (err) {
          console.error('Logout failed', err);
          alert.error('Gagal Keluar', 'Gagal logout: ' + err.message, () => {
            // Optional callback setelah error alert ditutup
          }, null);
        }
      },
      null, // onCancel
      'Keluar',
      'Batal'
    );
  };
  
  // Handler to delete account (existing)
  const handleDeleteAccount = async () => {
      if (auth.currentUser) {
          try {
              // Delete user in Firebase
              await deleteUser(auth.currentUser);
              // Clear local state and force logout view
              await handleLogout(); 
              toast.success("Akun berhasil dihapus permanen.");
          } catch (error) {
              console.error("Delete account error:", error);
              // Firebase requires recent re-authentication for deletion
              if (error.code === 'auth/requires-recent-login') {
                alert.error(
                  'Gagal Hapus', 
                  'Untuk keamanan, silakan logout dan login kembali sebelum mencoba menghapus akun.',
                  null, null
                );
              } else {
                alert.error(
                  'Gagal Hapus', 
                  error.message || 'Terjadi kesalahan saat menghapus akun. Coba lagi nanti.',
                  null, null
                );
              }
              throw error; // Re-throw to handle error state in MenuPengaturan
          }
      } else {
          // Should not happen if coming from DashboardView
          toast.error("Tidak ada user aktif untuk dihapus.");
      }
  };

  // --- STOCK & SALES HANDLERS ---
  const syncSalesToFinance = (newHistory) => {
    const salesForFinance = mapSalesHistoryToFinance(newHistory);
    setMarketData((prev) => ({
      ...(prev || {}),
      period: prev?.period || new Date().toISOString().slice(0, 7),
      sales: salesForFinance,
      incomes: prev?.incomes || [],
      marketing: prev?.marketing || [],
      salesHistory: newHistory,
    }));
  };

  const handleAddStockItem = (item) => {
    // Pastikan kodeBarang dan id ter-set dengan baik
    const kodeBarang = item.kodeBarang || item.id || Date.now().toString();
    const withId = { 
      ...item, 
      id: kodeBarang,
      kodeBarang: kodeBarang,
      // Normalisasi nama field untuk konsistensi
      hargaJual: item.sellPrice || item.hargaJual || 0,
      namaBarang: item.name || item.namaBarang || ''
    };
    setStockItems((prev) => [...prev, withId]);
  };

  const handleUpdateStockItem = (updated) => {
    setStockItems((prev) => prev.map((it) => {
      if (it.id === updated.id) {
        return { 
          ...it, 
          ...updated,
          // Pastikan kodeBarang tetap konsisten
          kodeBarang: updated.kodeBarang || it.kodeBarang || it.id,
          // Normalisasi field untuk riwayat penjualan
          hargaJual: updated.sellPrice || updated.hargaJual || it.hargaJual || 0,
          namaBarang: updated.name || updated.namaBarang || it.namaBarang || ''
        };
      }
      return it;
    }));
  };

  const handleDeleteStockItem = (id) => {
    setStockItems((prev) => prev.filter((it) => it.id !== id));
  };

  const handleRecordSale = (sale) => {
    const entry = {
      ...sale,
      // Normalisasi dateTime jika belum diset
      dateTime:
        sale.dateTime ||
        (() => {
          const now = new Date();
          const y = now.getFullYear();
          const m = String(now.getMonth() + 1).padStart(2, "0");
          const d = String(now.getDate()).padStart(2, "0");
          const h = String(now.getHours()).padStart(2, "0");
          const min = String(now.getMinutes()).padStart(2, "0");
          return `${y}/${m}/${d} - ${h}:${min}`;
        })(),
    };

    setSalesHistory((prev) => {
      const updated = [entry, ...prev];
      syncSalesToFinance(updated);
      return updated;
    });

    // Kurangi stok sesuai kode barang
    if (entry.kodeBarang && entry.jumlah) {
      setStockItems((prev) =>
        prev.map((it) =>
          it.kodeBarang === entry.kodeBarang
            ? { ...it, qty: Math.max(0, (it.qty || 0) - (entry.jumlah || 0)) }
            : it
        )
      );
    }
  };

  const handleAddMarketingExpense = (expense) => {
    const entry = {
      date: expense.date || new Date().toISOString().split('T')[0],
      channel: expense.channel || expense.source || 'Pemasaran',
      amount: Number(expense.amount) || 0,
      note: expense.note || 'Dicatat dari Riwayat Penjualan',
    };
    setMarketData((prev) => ({
      ...(prev || {}),
      marketing: [...(prev?.marketing || []), entry],
    }));
  };

  const handleAddOtherIncome = (income) => {
    const entry = {
      date: income.date || new Date().toISOString().split('T')[0],
      source: income.source || 'Pendapatan lain-lain',
      amount: Number(income.amount) || 0,
    };
    setMarketData((prev) => ({
      ...(prev || {}),
      incomes: [...(prev?.incomes || []), entry],
    }));
  };


  // MODIFIKASI: Menambahkan parameter fromOnboarding
  const handleConsultAI = async (input, setupBusiness = false, fromOnboarding = false) => {
    if (setupBusiness) {
      if (!user) {
        toast.warning('Silakan login dengan Google untuk memulai bisnis Anda!');
        await handleLogin();
      }
      
      const finalBusinessData = businessData;
      if (!finalBusinessData) {
          // Jika tidak ada businessData, kembali ke konsultasi
          setLoading(false);
          setCurrentView('consultation');
          return;
      }

      setCurrentBusinessName(finalBusinessData.name);
      setCurrentBusinessType(finalBusinessData.businessType || '');
      setCurrentView('dashboard');
      
      // Generate laporan keuangan default (kosong tapi terstruktur)
      const defaultFinancialReport = {
        sales: [], // Akan diisi dari salesHistory
        marketing: [], // Biaya pemasaran
        incomes: [] // Pendapatan lain
      };
      
      // Persist data lengkap ke Firebase
      if (finalBusinessData && auth.currentUser) {
          await saveUserSettings(auth.currentUser.uid, { 
              businessData: finalBusinessData, 
              businessName: finalBusinessData.name,
              businessType: finalBusinessData.businessType || '',
              businessLocation: finalBusinessData.location,
              businessDescription: finalBusinessData.description,
              stockItems: [],
              salesHistory: [],
              marketData: defaultFinancialReport
          });
          
          // Update state local agar langsung muncul di dashboard
          setStockItems([]);
          setSalesHistory([]);
          setMarketData(defaultFinancialReport);
          
          toast.success(`Bisnis "${finalBusinessData.name}" berhasil dibuat!`);
      }
      return;
    }

    if (!input) {
        setBusinessData(null); // Clear recommendation
        return;
    }

    setLoading(true);

    try {
      // Ekstrak modal dari input user untuk menekankan constraint
      const budgetMatch = input.match(/modal\s*(\d+(?:[.,]\d+)?)\s*(juta|ribu|jt|rb|m|k)?/i);
      let budgetEmphasis = '';
      
      if (budgetMatch) {
        const amount = parseFloat(budgetMatch[1].replace(',', '.'));
        const unit = budgetMatch[2]?.toLowerCase() || 'juta';
        
        let budgetInRupiah = amount;
        if (unit.includes('juta') || unit === 'jt' || unit === 'm') {
          budgetInRupiah = amount * 1000000;
        } else if (unit.includes('ribu') || unit === 'rb' || unit === 'k') {
          budgetInRupiah = amount * 1000;
        }
        
        const minBudget = Math.round(budgetInRupiah * 0.8);
        const maxBudget = Math.round(budgetInRupiah * 1.2);
        
        budgetEmphasis = `

⚠️ CONSTRAINT MODAL KETAT:
User menyebutkan modal "${budgetMatch[0]}". 
capital_est HARUS dalam range: Rp ${minBudget.toLocaleString('id-ID')} - Rp ${maxBudget.toLocaleString('id-ID')}
Total dari capitalBreakdown HARUS ≈ Rp ${budgetInRupiah.toLocaleString('id-ID')} (±20%)
JANGAN sarankan bisnis dengan modal berbeda!`;
      }

      // Kirim permintaan ke backend API yang mem-proxy ke AI provider
      const payload = {
        max_tokens: 1000,
        messages: [
          { 
            role: 'system', 
            content: `Kamu adalah konsultan bisnis profesional Indonesia dengan pengetahuan mendalam tentang harga pasar lokal dan analisis keuangan.

INSTRUKSI PENTING:
1. **MODAL YANG DISEBUTKAN USER ADALAH PRIORITAS UTAMA** - Jika user menyebut "modal 1 juta", maka capital_est HARUS sekitar 1 juta (misalnya "Rp 800 ribu - Rp 1,2 juta"). JANGAN abaikan atau ubah angka modal user!
2. Gunakan HARGA REALISTIS berdasarkan kondisi pasar Indonesia tahun 2024-2025
3. Rincian modal harus DETAIL dan AKURAT sesuai budget user (8-12 item berbeda)
4. Hitung metrik keuangan berdasarkan standar industri Indonesia${budgetEmphasis}

FORMAT JSON WAJIB:
{
  "name": "Nama Bisnis",
  "businessType": "Kategori/Tipe bisnis (F&B, Retail, Jasa, dsb)",
  "description": "Deskripsi lengkap (3-4 kalimat)",
  "capital_est": "Rp X juta - Y juta",
  "target_market": "Target pasar spesifik",
  "challenge": "Tantangan utama bisnis",
  "capitalBreakdown": [
    {"item": "nama_lengkap_barang", "quantity": angka, "unit": "pcs/unit/set/bulan", "price": harga_satuan_realistis, "total": quantity*price}
  ],
  "financialMetrics": {
    "bep_units": "unit produk/layanan untuk BEP",
    "bep_revenue": "pendapatan BEP dalam Rupiah",
    "bep_months": "estimasi bulan mencapai BEP (realistis 6-24 bulan)",
    "roi_percentage": "ROI % per tahun (realistis 15-40%)",
    "roi_months": "waktu balik modal dalam bulan",
    "gross_margin_percentage": "margin kotor % (realistis 20-50%)",
    "monthly_revenue_estimate": "estimasi pendapatan bulanan setelah stabil",
    "monthly_cost_estimate": "estimasi biaya operasional bulanan",
    "monthly_profit_estimate": "laba bersih bulanan",
    "avg_selling_price": "harga jual rata-rata per unit",
    "avg_cost_per_unit": "biaya produksi per unit"
  }
}

PANDUAN HARGA INDONESIA (gunakan sebagai acuan):
- Peralatan dapur/produksi: Rp 500rb - 10jt (sesuai kapasitas)
- Furniture/meja/kursi: Rp 300rb - 2jt per unit
- Kulkas/freezer komersial: Rp 3jt - 15jt
- Etalase/display: Rp 1.5jt - 5jt
- Kompor gas komersial: Rp 1jt - 5jt
- Renovasi sederhana: Rp 5jt - 20jt
- Peralatan elektronik: sesuai brand & spesifikasi
- Sewa tempat (3 bulan): Rp 6jt - 30jt (tergantung lokasi)
- Biaya perizinan UMKM: Rp 500rb - 2jt
- Modal kerja awal: 20-30% dari total modal

RUMUS PERHITUNGAN:
- BEP (unit) = Total Modal / (Harga Jual - HPP per unit)
- BEP (Rupiah) = BEP unit × Harga Jual
- ROI % = (Laba Bersih Tahunan / Total Modal) × 100
- Gross Margin % = ((Harga Jual - HPP) / Harga Jual) × 100
- Waktu BEP (bulan) = Total Modal / Laba Bersih Bulanan

Berikan data yang AKURAT, REALISTIS, dan DAPAT DIVERIFIKASI.` 
          },
          { role: 'user', content: input }
        ],
        model: 'meta-llama/llama-4-maverick-17b-128e-instruct',
        message: input
      };

      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const data = await res.json();

      if (!res.ok) {
        console.error('AI API HTTP error', data);
        throw new Error(data?.error || 'AI API returned an error');
      }

      if (!data || data.success === false) {
        console.error('AI API error payload', data);
        throw new Error(data?.error || 'AI returned an error');
      }

      let newBusinessData = null;
      // Handle AI response parsing
      if (data.structured && typeof data.structured === 'object') {
        const parsed = data.structured;
        newBusinessData = parsed.name ? parsed : { name: 'Saran AI', description: JSON.stringify(parsed) };
        
        // PERBAIKAN: Pastikan businessType ter-set dengan benar
        if (!newBusinessData.businessType && parsed.businessType) {
          newBusinessData.businessType = parsed.businessType;
        }
        
        if (parsed.marketData) setMarketData(parsed.marketData);
        // Set new states based on parsed data (if available)
        setCurrentBusinessLocation(parsed.location || 'Lokasi Tidak Diketahui');
        setCurrentBusinessDescription(parsed.description || parsed.summary || '');
        setCurrentBusinessType(parsed.businessType || '');
      } else {
        const reply = data.reply || '';
        try {
          const parsed = JSON.parse(reply);
          if (parsed && parsed.name) {
            newBusinessData = parsed;
            
            // PERBAIKAN: Pastikan businessType ter-set
            if (!newBusinessData.businessType && parsed.businessType) {
              newBusinessData.businessType = parsed.businessType;
            }
            
            if (parsed.marketData) setMarketData(parsed.marketData);
            setCurrentBusinessType(parsed.businessType || '');
          } else {
            newBusinessData = { name: 'Saran AI', description: reply };
          }
        } catch (e) {
            newBusinessData = { name: 'Saran AI', description: reply };
        }
      }

      setBusinessData(newBusinessData);
      setCurrentBusinessName(newBusinessData.name); // Set current name from the new data
      setCurrentBusinessType(newBusinessData.businessType || '');
      
      // LOGIKA BARU: Simpan recommendation ke temporary storage (jika user belum login)
      // Data ini akan dipindahkan ke Firebase saat user melakukan login
      if (!user) {
        const tempPayload = {
          businessName: newBusinessData.name,
          businessDescription: newBusinessData.description || '',
          businessLocation: newBusinessData.location || 'N/A',
          businessType: newBusinessData.businessType || '',
          businessData: newBusinessData,
          userName: 'Pengguna', // Default, akan diisi saat setup
          skipOnboarding: true, // Flag: user dari AI flow tidak perlu onboarding
        };
        setTempData('meta_bisnis_temp', tempPayload);
      }
      
      // LOGIKA LAMA: Jika dari onboarding, langsung simpan dan pindah ke dashboard
      if (fromOnboarding) {
          // Jika dari onboarding, jangan langsung pindah view, tapi biarkan OnboardingView 
          // menampilkan hasilnya. Pindah view hanya ketika tombol "Mulai" ditekan (setupBusiness=true)
          // TAPI KARENA LOGIKA CONSULTATION VIEW LAMA MENGANDALKAN AUTO-SWITCH, 
          // MAKA KITA PERLU LOGIKA UNTUK KONSULTASI LAMA/BARU
          // Di sini kita biarkan state diperbarui, transisi diurus oleh tombol di OnboardingView/ConsultationView
      }
      
    } catch (error) {
      console.error(error);
      toast.error('Maaf, AI sedang sibuk. Coba lagi nanti.');
    } finally {
      setLoading(false);
    }
  };

  const handleAddAbsence = (absence) => {
    setAbsences([absence, ...absences]);
  };

  // Persist employee list to Firestore using user UID
  const persistEmployees = async (list) => {
    if (!user?.uid) return;
    try {
      setEmployees(list);
      await saveUserSettings(user.uid, { employees: list });
      toast.success('Data karyawan tersimpan');
    } catch (err) {
      console.error('Gagal menyimpan karyawan:', err);
      toast.error('Gagal menyimpan karyawan');
    }
  };

  const handleAddEmployee = async (name) => {
    const trimmed = name.trim();
    if (!trimmed) return;
    const exists = employees.some((e) => e.name.toLowerCase() === trimmed.toLowerCase());
    if (exists) {
      toast.error('Nama karyawan sudah ada');
      return;
    }
    const newList = [...employees, { id: Date.now(), name: trimmed }];
    await persistEmployees(newList);
  };

  const handleDeleteEmployee = async (id) => {
    const newList = employees.filter((e) => e.id !== id);
    await persistEmployees(newList);
  };
  
  // Handler for updating settings (mocking update logic)
  const handleUpdateSettings = async ({ 
    businessName, 
    userName, 
    businessLocation, 
    businessDescription,
    businessType,
    instagramUsername,
    tiktokUsername,
    whatsappNumber
  }) => {
    // 1. Update mock user name state
    setCurrentUserName(userName);

    // 2. Update business details state
    setCurrentBusinessName(businessName);
    setCurrentBusinessLocation(businessLocation);
    setCurrentBusinessDescription(businessDescription);
    setCurrentBusinessType(businessType);
    setCurrentInstagramUsername(instagramUsername);
    setCurrentTiktokUsername(tiktokUsername);
    setCurrentWhatsappNumber(whatsappNumber);
    
    // 3. Create new businessData object
    const newBusinessData = { 
        name: businessName, 
        description: businessDescription || 'Nama bisnis diatur manual', 
        capital_est: 'N/A', 
        target_market: 'N/A', 
        challenge: 'N/A',
      location: businessLocation,
      businessType
    };
    
    setBusinessData(newBusinessData);
    
    const payload = {
      businessName,
      userName,
      businessLocation,
      businessDescription,
      businessType,
      instagramUsername,
      tiktokUsername,
      whatsappNumber,
      businessData: newBusinessData,
    };
    
    // persist settings to Firestore for this user (if available)
    if (auth.currentUser) {
      try {
        await saveUserSettings(auth.currentUser.uid, payload);
        toast.success('Pengaturan tersimpan.');
      } catch (e) {
        console.error('Failed saving settings:', e);
        toast.error('Gagal menyimpan pengaturan. Coba lagi.');
      }
    } else {
      // JIKA BELUM LOGIN: Simpan ke temporary storage (akan dipindahkan ke Firebase saat login)
      setTempData('meta_bisnis_temp', payload);
      toast.info('Data tersimpan sementara di browser. Login untuk menyimpan permanen.');
    }

    return new Promise(resolve => setTimeout(resolve, 500));
  };
  
  // NEW HANDLER FOR ONBOARDING MANUAL SETUP COMPLETION
  const handleSetupComplete = async (settingsPayload) => {
      // Use existing update settings logic to save to state and Firestore
      await handleUpdateSettings(settingsPayload);
      
      // Mark onboarding as completed in Firebase
      if (auth.currentUser?.uid) {
        try {
          await saveUserSettings(auth.currentUser.uid, { onboardingCompleted: true });
          setOnboardingCompleted(true);
        } catch (e) {
          console.error('Failed marking onboarding completed:', e);
        }
      }
      
      // Transition to dashboard
      setCurrentView('dashboard');
  }


  // NEW VIEW: ONBOARDING
  if (currentView === 'onboarding' && user && !onboardingCompleted) {
    return (
      <OnboardingView
        user={user}
        onConsultAI={(input, setupBusiness) => handleConsultAI(input, setupBusiness, true)} 
        onSetupComplete={handleSetupComplete}
        businessData={businessData}
        loading={loading}
        businessType={currentBusinessType}
      />
    );
  }

  // Show dashboard if user requested it and is logged in.
  if (currentView === 'dashboard' && user) {
    return (
      <DashboardView
        businessName={currentBusinessName}
        userName={currentUserName}
        currentUserEmail={user.email}
        businessLocation={currentBusinessLocation}
        businessDescription={currentBusinessDescription}
        businessType={currentBusinessType}
        instagramUsername={currentInstagramUsername}
        tiktokUsername={currentTiktokUsername}
        whatsappNumber={currentWhatsappNumber}
        onLogout={handleLogout}
        absences={absences}
        onAddAbsence={handleAddAbsence}
        employees={employees}
        onAddEmployee={handleAddEmployee}
        onDeleteEmployee={handleDeleteEmployee}
        marketData={marketData}
        showAdModal={showAdModal}
        onShowAdModal={() => setShowAdModal(true)}
        onCloseAdModal={() => setShowAdModal(false)}
        onUpdateSettings={handleUpdateSettings}
        onDeleteAccount={handleDeleteAccount}
        stockItems={stockItems}
        onAddStockItem={handleAddStockItem}
        onUpdateStockItem={handleUpdateStockItem}
        onDeleteStockItem={handleDeleteStockItem}
        salesHistory={salesHistory}
        onRecordSale={handleRecordSale}
        onAddMarketingExpense={handleAddMarketingExpense}
        onAddOtherIncome={handleAddOtherIncome}
        calendarEvents={calendarEvents}
        onSetCalendarEvents={setCalendarEvents}
      />
    );
  }

  // Fallback to ConsultationView
  return (
    <ConsultationView
      user={user}
      onLogin={handleLogin}
      onLogout={handleLogout}
      onSetupBusiness={handleConsultAI}
      businessData={businessData}
      loading={loading}
    />
  );
}