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
      // Simulasi memanggil AI API (Gemini)
      // Dalam implementasi real, gunakan fetch ke Gemini API
      // Untuk demo, kita gunakan mock data
      await new Promise((resolve) => setTimeout(resolve, 2000));

      // Mock business recommendations
      const mockBusinesses = [
        {
          name: 'Kopi Pintar AI',
          description:
            'Warung kopi dengan konsep smart ordering via WhatsApp. Produk berkualitas dengan delivery ke kantor-kantor sekitar. Target market: karyawan dan startup di area komersial.',
          capital_est: 'Rp 5.000.000 - 10.000.000',
          target_market: 'Karyawan kantoran & startup muda',
          challenge: 'Kompetisi dari brand kopi established',
          category: 'Kuliner',
        },
        {
          name: 'Laundry Express Online',
          description:
            'Jasa laundry dengan sistem booking online dan pickup-delivery. Fokus pada efisiensi dan kepuasan pelanggan. Market: mahasiswa, office workers, busy moms.',
          capital_est: 'Rp 8.000.000 - 15.000.000',
          target_market: 'Mahasiswa, profesional muda, ibu rumah tangga',
          challenge: 'Perlu operasional yang teratur dan SDM terlatih',
          category: 'Jasa',
        },
        {
          name: 'Snack Sehat Organik',
          description:
            'Penjualan snack sehat berbahan organik via media sosial dan reseller. Fokus pada kesehatan dan keberlanjutan. Paket bundling yang menarik untuk corporate gifts.',
          capital_est: 'Rp 3.000.000 - 7.000.000',
          target_market: 'Health-conscious millennials, corporate buyers',
          challenge: 'Supply chain yang konsisten untuk bahan organik',
          category: 'Kuliner',
        },
      ];

      const randomBusiness =
        mockBusinesses[Math.floor(Math.random() * mockBusinesses.length)];
      setBusinessData(randomBusiness);

      // Mock market data
      setMarketData({
        insight:
          'Tren positif terlihat stabil. Permintaan meningkat menjelang akhir pekan, terutama untuk produk convenience.',
        price: `Rp ${Math.floor(Math.random() * 50 + 10)}.000`,
      });
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
