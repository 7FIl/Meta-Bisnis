'use client';

import { useState, useEffect } from 'react';
import { onAuthStateChanged } from 'firebase/auth';
import { auth } from '@/lib/firebase';
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
  const [loading, setLoading] = useState(false);
  const [absences, setAbsences] = useState([]);
  const [showAdModal, setShowAdModal] = useState(false);
  const [marketData, setMarketData] = useState(null);

  // Auth listener
  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      // Only switch to dashboard automatically if the user's email is verified
      if (currentUser && currentUser.emailVerified) {
        setCurrentView('dashboard');
      }
    });
    return () => unsub();
  }, []);

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

  const handleConsultAI = async (input, setupBusiness = false) => {
    if (setupBusiness) {
      if (!user) {
        toast.warning('Silakan login dengan Google untuk memulai bisnis Anda!');
        await handleLogin();
      }
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

      // Backend may return a parsed `structured` object (preferred),
      // otherwise `reply` may contain JSON or plain text.
      if (data.structured && typeof data.structured === 'object') {
        const parsed = data.structured;
        setBusinessData(parsed.name ? parsed : { name: 'Saran AI', description: JSON.stringify(parsed) });
        if (parsed.marketData) setMarketData(parsed.marketData);
      } else {
        const reply = data.reply || '';
        try {
          const parsed = JSON.parse(reply);
          if (parsed && parsed.name) {
            setBusinessData(parsed);
            if (parsed.marketData) setMarketData(parsed.marketData);
          } else {
            setBusinessData({ name: 'Saran AI', description: reply });
          }
        } catch (e) {
          setBusinessData({ name: 'Saran AI', description: reply });
        }
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

  // removed duplicate local handleLogout — use the auth-based `handleLogout` above

  // Show dashboard if user requested it and is logged in. Business data may be empty.
  if (currentView === 'dashboard' && user) {
    return (
      <DashboardView
        businessName={businessData?.name || (user.displayName ? `${user.displayName}'s Business` : 'Dashboard')}
        userPhoto={user?.photoURL}
        onLogout={handleLogout}
        absences={absences}
        onAddAbsence={handleAddAbsence}
        marketData={marketData}
        showAdModal={showAdModal}
        onShowAdModal={() => setShowAdModal(true)}
        onCloseAdModal={() => setShowAdModal(false)}
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
