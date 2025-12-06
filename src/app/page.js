// src/app/page.js
'use client';

import { useState, useEffect } from 'react';
import { onAuthStateChanged, deleteUser } from 'firebase/auth'; 
import { auth } from '@/lib/firebase';
import { saveUserSettings, getUserSettings } from '@/lib/userSettings';
import { loginWithGoogle, logoutUser } from '@/lib/auth';
import { useToast } from '@/components/Toast';
import { useAlert } from '@/components/Alert';
import { setTempData, getTempData, removeTempData, hasTempData } from '@/lib/cookies';

import ConsultationView from '@/components/ConsultationView';
import DashboardView from '@/components/DashboardView';
import OnboardingView from '@/components/OnboardingView'; // <-- IMPORTED

export default function Home() {
  const toast = useToast();
  const alert = useAlert();
  const [user, setUser] = useState(null);
  const [currentView, setCurrentView] = useState('consultation'); // 'consultation', 'onboarding', atau 'dashboard'
  const [businessData, setBusinessData] = useState(null);
  const [absences, setAbsences] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [showAdModal, setShowAdModal] = useState(false);
  const [marketData, setMarketData] = useState(null);
  const [loading, setLoading] = useState(false);

  // State mock untuk nama pengguna dan bisnis yang bisa diubah di Pengaturan
  const [currentBusinessName, setCurrentBusinessName] = useState('Dashboard');
  const [currentUserName, setCurrentUserName] = useState('Pengguna');
  const [currentBusinessLocation, setCurrentBusinessLocation] = useState('Lokasi Tidak Diketahui');
  const [currentBusinessDescription, setCurrentBusinessDescription] = useState('');
  const [currentBusinessType, setCurrentBusinessType] = useState('');
  
  // Auth listener
  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      if (currentUser && currentUser.emailVerified) {
        // Set initial user name from firebase/email
        setCurrentUserName(currentUser.displayName || currentUser.email.split('@')[0]);
        
        (async () => {
          let hasBusinessData = false;
          try {
            // CEK TEMP DATA: Jika ada data temporary dari consultation view, transfer ke Firebase
            const tempData = getTempData('meta_bisnis_temp');
            if (tempData && tempData.businessName) {
              console.log('[Auth] Found temp data, transferring to Firebase:', tempData);
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
              console.log('[Auth] Temp data saved to Firebase');
              
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
            
            // Jika belum ada business data dari temp, load dari Firebase seperti biasa
            if (!hasBusinessData) {
              const settings = await getUserSettings(currentUser.uid);
              if (settings) {
                // Apply loaded settings to state
                setCurrentBusinessName(settings.businessName || (currentUser.displayName ? `${currentUser.displayName}'s Business` : 'Dashboard Bisnis'));
                setCurrentUserName(settings.userName || (currentUser.displayName || currentUser.email.split('@')[0]));
                setCurrentBusinessLocation(settings.businessLocation || 'Lokasi Tidak Diketahui');
                setCurrentBusinessDescription(settings.businessDescription || '');
                setCurrentBusinessType(settings.businessType || '');
                setEmployees(settings.employees || []);
                
                // Cek apakah ada data bisnis
                if (settings.businessData && settings.businessData.name) {
                    setBusinessData(settings.businessData);
                    setCurrentBusinessType(settings.businessData.businessType || settings.businessType || '');
                    hasBusinessData = true;
                } else if (settings.businessName && settings.businessName !== 'Dashboard Bisnis') {
                    // Fallback: Jika ada nama bisnis tersimpan (dari setup manual sebelumnya)
                    const fallbackData = {
                        name: settings.businessName,
                        description: settings.businessDescription || 'Detail bisnis diatur manual',
                        capital_est: 'N/A',
                        target_market: 'N/A',
                        challenge: 'N/A',
                        location: settings.businessLocation,
                        businessType: settings.businessType || ''
                    };
                    setBusinessData(fallbackData);
                      setCurrentBusinessType(settings.businessType || '');
                    hasBusinessData = true;
                }
              }
            }

            // LOGIKA ONBOARDING BARU: hanya untuk user baru pertama kali login
            const isNewUser = currentUser?.metadata?.creationTime === currentUser?.metadata?.lastSignInTime;

            if (!hasBusinessData && isNewUser) {
                // User benar-benar baru: arahkan ke onboarding
                setCurrentView('onboarding');
            } else {
                // User lama atau sudah punya data bisnis: langsung ke dashboard
                setCurrentView('dashboard');
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
      
      // Persist the current businessData (sudah ada)
      if (finalBusinessData && auth.currentUser) {
          await saveUserSettings(auth.currentUser.uid, { 
              businessData: finalBusinessData, 
              businessName: finalBusinessData.name,
              businessType: finalBusinessData.businessType || '',
              businessLocation: finalBusinessData.location,
              businessDescription: finalBusinessData.description
          });
      }
      return;
    }

    if (!input) {
        setBusinessData(null); // Clear recommendation
        return;
    }

    setLoading(true);

    try {
      // Kirim permintaan ke backend API yang mem-proxy ke AI provider
      const payload = {
        max_tokens: 1000,
        messages: [
          { 
            role: 'system', 
            content: `Kamu adalah konsultan bisnis profesional Indonesia dengan pengetahuan mendalam tentang harga pasar lokal dan analisis keuangan.

INSTRUKSI PENTING:
1. Gunakan HARGA REALISTIS berdasarkan kondisi pasar Indonesia tahun 2024-2025
2. Rincian modal harus DETAIL dan AKURAT (minimal 8-12 item berbeda)
3. Hitung metrik keuangan berdasarkan standar industri Indonesia

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
        if (parsed.marketData) setMarketData(parsed.marketData);
        // Set new states based on parsed data (if available)
        setCurrentBusinessLocation(parsed.location || 'Lokasi Tidak Diketahui');
        setCurrentBusinessDescription(parsed.description || parsed.summary || '');
      } else {
        const reply = data.reply || '';
        try {
          const parsed = JSON.parse(reply);
          if (parsed && parsed.name) {
            newBusinessData = parsed;
            if (parsed.marketData) setMarketData(parsed.marketData);
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
        };
        setTempData('meta_bisnis_temp', tempPayload);
        console.log('[ConsultationView] Saved AI recommendation to temp storage:', tempPayload);
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
    businessDescription = currentBusinessDescription,
    businessType = currentBusinessType
  }) => {
    // 1. Update mock user name state
    setCurrentUserName(userName);

    // 2. Update business details state
    setCurrentBusinessName(businessName);
    setCurrentBusinessLocation(businessLocation);
    setCurrentBusinessDescription(businessDescription);
    setCurrentBusinessType(businessType);
    
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
      // Directly transition to dashboard
      setCurrentView('dashboard');
  }


  // NEW VIEW: ONBOARDING
  if (currentView === 'onboarding' && user) {
    return (
      <OnboardingView
        user={user}
        // MODIFIED: onConsultAI dipanggil tanpa 'fromOnboarding' karena transisi diurus tombol "Mulai"
        onConsultAI={(input, setupBusiness) => handleConsultAI(input, setupBusiness, false)} 
        onSetupComplete={handleSetupComplete} // manual setup, auto-switch to dashboard
        businessData={businessData} // Kirim businessData agar OnboardingView bisa menampilkan hasil
        loading={loading} // Kirim loading state
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