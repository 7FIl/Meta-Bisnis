// src/app/page.js
'use client';

import { useState, useEffect } from 'react';
import { onAuthStateChanged, deleteUser } from 'firebase/auth'; 
import { auth } from '@/lib/firebase';
import { saveUserSettings, getUserSettings } from '@/lib/userSettings';
import { loginWithGoogle, logoutUser } from '@/lib/auth';
import { useToast } from '@/components/Toast';
import { useAlert } from '@/components/Alert';

import ConsultationView from '@/components/ConsultationView';
import DashboardView from '@/components/DashboardView';

export default function Home() {
  const toast = useToast();
  const alert = useAlert();
  const [user, setUser] = useState(null);
  const [currentView, setCurrentView] = useState('consultation'); // 'consultation' atau 'dashboard'
  const [businessData, setBusinessData] = useState(null);
  const [absences, setAbsences] = useState([]);
  const [showAdModal, setShowAdModal] = useState(false);
  const [marketData, setMarketData] = useState(null);
  const [loading, setLoading] = useState(false);

  // State mock untuk nama pengguna dan bisnis yang bisa diubah di Pengaturan
  const [currentBusinessName, setCurrentBusinessName] = useState('Dashboard');
  const [currentUserName, setCurrentUserName] = useState('Pengguna');
  const [currentBusinessTitle, setCurrentBusinessTitle] = useState('Platform AI untuk UMKM');
  const [currentBusinessLocation, setCurrentBusinessLocation] = useState('Lokasi Tidak Diketahui');
  const [currentBusinessImage, setCurrentBusinessImage] = useState('/globe.svg');
  
  // Auth listener
  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      if (currentUser && currentUser.emailVerified) {
        // Set initial user name from firebase/email
        setCurrentUserName(currentUser.displayName || currentUser.email.split('@')[0]);
        setCurrentView('dashboard');
        
        // Set initial business name (from consultation data or default)
        // Try to load persisted user settings from Firestore
        (async () => {
          try {
            const settings = await getUserSettings(currentUser.uid);
            if (settings) {
              // Apply loaded settings to state
              setCurrentBusinessName(settings.businessName || (currentUser.displayName ? `${currentUser.displayName}'s Business` : 'Dashboard Bisnis'));
              setCurrentUserName(settings.userName || (currentUser.displayName || currentUser.email.split('@')[0]));
              setCurrentBusinessTitle(settings.businessTitle || 'Platform AI untuk UMKM');
              setCurrentBusinessLocation(settings.businessLocation || 'Lokasi Tidak Diketahui');
              setCurrentBusinessImage(settings.businessImage || '/globe.svg');
              // If you stored a businessData object, prefer that
              if (settings.businessData) setBusinessData(settings.businessData);
            } else {
              // No persisted settings — fall back to existing logic
              if (!businessData?.name) {
                setCurrentBusinessName(currentUser.displayName ? `${currentUser.displayName}'s Business` : 'Dashboard Bisnis');
                setCurrentBusinessTitle('Platform AI untuk UMKM');
                setCurrentBusinessLocation('Lokasi Tidak Diketahui');
                setCurrentBusinessImage('/globe.svg');
              } else {
                setCurrentBusinessName(businessData.name);
                setCurrentBusinessTitle(businessData.title || 'Platform AI untuk UMKM');
                setCurrentBusinessLocation(businessData.location || 'Lokasi Tidak Diketahui');
                setCurrentBusinessImage(businessData.image || '/globe.svg');
              }
            }
          } catch (e) {
            console.error('Failed to load user settings:', e);
          }
        })();
      } else {
        // Reset to default mock names if no user or unverified
        setCurrentUserName('Pengguna');
        setCurrentBusinessName('Dashboard');
        setCurrentBusinessTitle('Platform AI untuk UMKM');
        setCurrentBusinessLocation('Lokasi Tidak Diketahui');
        setCurrentBusinessImage('/globe.svg');
      }
    });
    return () => unsub();
  }, [businessData]);

  const handleLogin = async () => {
    try {
      await loginWithGoogle();
      // onAuthStateChanged will update `user`
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
          setCurrentBusinessTitle('Platform AI untuk UMKM');
          setCurrentBusinessLocation('Lokasi Tidak Diketahui');
          setCurrentBusinessImage('/globe.svg');
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
  
  // Handler to delete account
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


  const handleConsultAI = async (input, setupBusiness = false) => {
    if (setupBusiness) {
      if (!user) {
        toast.warning('Silakan login dengan Google untuk memulai bisnis Anda!');
        await handleLogin();
      }
      
      const finalBusinessName = businessData?.name || currentBusinessName;

      setCurrentBusinessName(finalBusinessName);
      setCurrentView('dashboard');
      return;
    }

    if (!input) return;

    setLoading(true);

    try {
      // Kirim permintaan ke backend API yang mem-proxy ke AI provider
      const payload = {
        max_tokens: 1000,
        messages: [
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
        setCurrentBusinessTitle(parsed.title || 'Platform AI untuk UMKM');
        setCurrentBusinessLocation(parsed.location || 'Lokasi Tidak Diketahui');
        setCurrentBusinessImage(parsed.image || '/globe.svg');
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
  
  // Handler for updating settings (mocking update logic)
  const handleUpdateSettings = async ({ 
    businessName, 
    userName, 
    businessLocation, 
    businessTitle,    
    businessImage     
  }) => {
    // 1. Update mock user name state
    setCurrentUserName(userName);

    // 2. Update business details state
    setCurrentBusinessName(businessName);
    setCurrentBusinessLocation(businessLocation);
    setCurrentBusinessTitle(businessTitle);
    setCurrentBusinessImage(businessImage);
    
    // 3. Update businessData object (if exists)
    if (businessData) {
        setBusinessData(prev => ({ 
            ...prev, 
            name: businessName, 
            location: businessLocation, 
            title: businessTitle,
            image: businessImage
        }));
    } else {
        // If businessData is null, create a minimal version
        setBusinessData({ 
            name: businessName, 
            description: 'Nama bisnis diatur manual', 
            capital_est: 'N/A', 
            target_market: 'N/A', 
            challenge: 'N/A',
            location: businessLocation,
            title: businessTitle,
            image: businessImage
        });
    }
    
    // Simulate API delay
    // persist settings to Firestore for this user (if available)
    if (auth.currentUser) {
      const payload = {
        businessName,
        userName,
        businessLocation,
        businessTitle,
        businessImage,
        businessData: businessData || null,
      };

      try {
        await saveUserSettings(auth.currentUser.uid, payload);
        toast.success('Pengaturan tersimpan.');
      } catch (e) {
        console.error('Failed saving settings:', e);
        toast.error('Gagal menyimpan pengaturan. Coba lagi.');
      }
    }

    return new Promise(resolve => setTimeout(resolve, 500));
  };


  // Show dashboard if user requested it and is logged in.
  if (currentView === 'dashboard' && user) {
    return (
      <DashboardView
        businessName={currentBusinessName}
        userName={currentUserName}
        currentUserEmail={user.email}
        businessTitle={currentBusinessTitle}
        businessLocation={currentBusinessLocation}
        businessImage={currentBusinessImage}
        onLogout={handleLogout}
        absences={absences}
        onAddAbsence={handleAddAbsence}
        marketData={marketData}
        showAdModal={showAdModal}
        onShowAdModal={() => setShowAdModal(true)}
        onCloseAdModal={() => setShowAdModal(false)}
        onUpdateSettings={handleUpdateSettings}
        onDeleteAccount={handleDeleteAccount}
      />
    );
  }

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