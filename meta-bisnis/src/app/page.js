'use client';

import { useState } from 'react';
import ConsultationView from '@/components/ConsultationView';
import DashboardView from '@/components/DashboardView';

export default function Home() {
  const [currentView, setCurrentView] = useState('consultation'); // 'consultation' atau 'dashboard'
  const [businessData, setBusinessData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [transactions, setTransactions] = useState([]);
  const [showAdModal, setShowAdModal] = useState(false);
  const [marketData, setMarketData] = useState(null);

  const handleConsultAI = async (input, setupBusiness = false) => {
    if (setupBusiness) {
      // Pindah ke dashboard
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
      alert('Maaf, AI sedang sibuk. Coba lagi nanti.');
    } finally {
      setLoading(false);
    }
  };

  const handleAddTransaction = (transaction) => {
    setTransactions([transaction, ...transactions]);
  };

  const handleLogout = () => {
    if (confirm('Keluar dari dashboard bisnis?')) {
      setCurrentView('consultation');
      setBusinessData(null);
      setTransactions([]);
      setShowAdModal(false);
      setMarketData(null);
    }
  };

  if (currentView === 'dashboard' && businessData) {
    return (
      <DashboardView
        businessName={businessData.name}
        onLogout={handleLogout}
        transactions={transactions}
        onAddTransaction={handleAddTransaction}
        marketData={marketData}
        showAdModal={showAdModal}
        onShowAdModal={() => setShowAdModal(true)}
        onCloseAdModal={() => setShowAdModal(false)}
      />
    );
  }

  return (
    <ConsultationView
      onSetupBusiness={handleConsultAI}
      businessData={businessData}
      loading={loading}
    />
  );
}
