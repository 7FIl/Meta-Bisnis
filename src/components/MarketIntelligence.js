"use client";

import { useEffect, useRef, useState } from 'react';

export default function MarketIntelligence({ businessName, marketData, businessLocation, businessDescription }) {
  const chartRef = useRef(null);
  const chartInstanceRef = useRef(null);
  const [timeframe, setTimeframe] = useState('weekly'); // 'daily' | 'weekly' | 'monthly'
  const [newsList, setNewsList] = useState([]);
  const [aiSummary, setAiSummary] = useState('');
  const [newsLoading, setNewsLoading] = useState(false);
  const [newsError, setNewsError] = useState('');

  // Fetch berita relevan dari Tavily API
  // Algoritma: Cari "Berita tren viral terbaru di indonesia mengenai bisnis [jenis bisnis]"
  const fetchRelevantNews = async () => {
    setNewsLoading(true);
    setNewsError('');
    try {
      // Extract jenis bisnis dari nama
      const businessType = extractBusinessType(businessName, businessDescription);
      
      // Format query: "Berita tren viral terbaru di indonesia mengenai bisnis [jenis bisnis]"
      const searchQuery = businessType;
      
      console.log('[MarketIntelligence] Searching viral news for:', businessType);
      
      const response = await fetch('/api/news', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          query: searchQuery, // Kirim jenis bisnis saja, API akan format ulang
          businessName,
          businessLocation,
          businessDescription
        })
      });

      const data = await response.json();

      if (response.ok && data.success) {
        console.log('[MarketIntelligence] Got', data.news?.length || 0, 'news items');
        setNewsList(data.news || []);
        setAiSummary(data.summary || '');
      } else {
        console.error('[MarketIntelligence] API error:', response.status, data.error);
        setNewsList([]);
        setAiSummary('');
        setNewsError(data.error || 'Gagal mengambil berita');
      }
    } catch (error) {
      console.error('Error fetching news:', error);
      setNewsList([]);
      setAiSummary('');
      setNewsError('Terjadi kesalahan saat mengambil berita');
    } finally {
      setNewsLoading(false);
    }
  };

  // Helper: Extract jenis bisnis dari nama (ambil keyword utama)
  const extractBusinessType = (name, description) => {
    // Hapus kata-kata umum seperti "Toko", "Warung", "Pak", "Bu", dll
    const commonWords = ['toko', 'warung', 'kedai', 'pak', 'bu', 'ibu', 'bapak', 'haji', 'ustadz', 'bang'];
    const words = name.toLowerCase().split(/\s+/).filter(w => !commonWords.includes(w));
    
    // Ambil kata pertama yang signifikan (biasanya jenis bisnis)
    return words[0] || name;
  };

  // TIDAK auto-fetch untuk mencegah pemborosan API
  // User harus klik tombol refresh secara manual
  // Hanya fetch saat komponen pertama kali mount (empty dependency array)
  useEffect(() => {
    // Optional: fetch pertama kali saat mount jika ingin preview
    // Hapus jika tidak ingin auto-fetch sama sekali
    // fetchRelevantNews();
  }, []);

  const getChartDataFor = (tf) => {
    if (tf === 'daily') {
      return {
        labels: ['00:00', '04:00', '08:00', '12:00', '16:00', '20:00', '24:00'],
        data: [5, 9, 20, 35, 28, 22, 10],
        customers: [5, 9, 20, 35, 28, 22, 10],
        totalCustomers: 129,
        label: 'Jumlah Pelanggan (Harian)'
      };
    }

    if (tf === 'monthly') {
      return {
        labels: ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des'],
        data: [120, 150, 130, 170, 180, 200, 190, 210, 230, 220, 205, 240],
        customers: [120, 150, 130, 170, 180, 200, 190, 210, 230, 220, 205, 240],
        totalCustomers: 2245,
        label: 'Jumlah Pelanggan (Bulanan)'
      };
    }

    // default weekly
    return {
      labels: ['Sen', 'Sel', 'Rab', 'Kam', 'Jum', 'Sab', 'Min'],
      data: [12, 19, 15, 25, 32, 45, 40],
      customers: [12, 19, 15, 25, 32, 45, 40],
      totalCustomers: 188,
      label: 'Jumlah Pelanggan (Mingguan)'
    };
  };

  useEffect(() => {
    if (typeof window !== 'undefined' && window.Chart) {
      // Destroy existing chart if it exists
      if (chartInstanceRef.current) {
        chartInstanceRef.current.destroy();
      }

      const chartData = getChartDataFor(timeframe);

      if (chartRef.current) {
        const ctx = chartRef.current.getContext('2d');
        chartInstanceRef.current = new window.Chart(ctx, {
          type: 'line',
          data: {
            labels: chartData.labels,
            datasets: [
              {
                label: chartData.label,
                data: chartData.data,
                borderColor: 'rgb(79, 70, 229)',
                backgroundColor: 'rgba(79, 70, 229, 0.1)',
                tension: 0.4,
                fill: true,
                pointRadius: 5,
                pointBackgroundColor: 'rgb(79, 70, 229)',
                pointBorderColor: '#fff',
                pointBorderWidth: 2,
                pointHoverRadius: 7,
              },
            ],
          },
          options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: { 
              legend: { display: false },
              tooltip: {
                backgroundColor: 'rgba(0, 0, 0, 0.8)',
                titleColor: '#fff',
                bodyColor: '#fff',
                borderColor: 'rgb(79, 70, 229)',
                borderWidth: 2,
                padding: 12,
                titleFont: { size: 14, weight: 'bold' },
                bodyFont: { size: 13 },
                displayColors: false,
              }
            },
            scales: {
              y: { 
                beginAtZero: true, 
                display: true,
                ticks: {
                  color: 'rgba(100, 116, 139, 0.7)',
                  font: { size: 11, weight: '500' },
                  padding: 8,
                },
                grid: { 
                  color: 'rgba(100, 116, 139, 0.1)',
                  drawBorder: false,
                }
              },
              x: { 
                grid: { display: false },
                ticks: {
                  color: 'rgba(100, 116, 139, 0.7)',
                  font: { size: 11, weight: '500' },
                  padding: 8,
                }
              },
            },
          },
        });
      }
    }

    return () => {
      if (chartInstanceRef.current) {
        chartInstanceRef.current.destroy();
      }
    };
  }, [timeframe, marketData]);

  return (
    <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-4 gap-3">
        <div className="flex items-center gap-3">
          <h3 className="font-bold text-slate-800 flex items-center gap-2">
            <i className="fas fa-chart-line text-indigo-500"></i> Traffic Toko
          </h3>

          {/* Timeframe buttons */}
          <div className="ml-3 flex items-center gap-2">
            <button
              onClick={() => setTimeframe('daily')}
              className={`text-xs px-3 py-1 rounded-md border ${timeframe === 'daily' ? 'bg-slate-900 text-white border-slate-900' : 'bg-white text-slate-600 border-slate-200'}`}
            >Harian</button>
            <button
              onClick={() => setTimeframe('weekly')}
              className={`text-xs px-3 py-1 rounded-md border ${timeframe === 'weekly' ? 'bg-slate-900 text-white border-slate-900' : 'bg-white text-slate-600 border-slate-200'}`}
            >Mingguan</button>
            <button
              onClick={() => setTimeframe('monthly')}
              className={`text-xs px-3 py-1 rounded-md border ${timeframe === 'monthly' ? 'bg-slate-900 text-white border-slate-900' : 'bg-white text-slate-600 border-slate-200'}`}
            >Bulanan</button>
          </div>
        </div>

        <span className="text-xs bg-indigo-100 text-indigo-600 px-2 py-1 rounded-full">
          <i className="fas fa-users mr-1"></i> {getChartDataFor(timeframe).totalCustomers} Pelanggan
        </span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Traffic Chart - sama besar dengan berita */}
        <div className="flex flex-col">
          <h4 className="font-semibold text-sm text-slate-700 mb-2 flex items-center gap-2">
            <i className="fas fa-chart-area text-indigo-500"></i> Grafik Traffic
          </h4>
          <div className="bg-gradient-to-br from-indigo-50 to-blue-50 border border-indigo-200 rounded-lg p-4 h-64 relative">
            <canvas ref={chartRef}></canvas>
          </div>
        </div>

        {/* Berita Tren Pasar - sama besar dengan traffic */}
        <div className="flex flex-col">
          <div className="flex items-center justify-between mb-2">
            <h4 className="font-semibold text-sm text-slate-700 flex items-center gap-2">
              <i className="fas fa-newspaper text-blue-500"></i> Berita & Tren Pasar
            </h4>
            <button
              onClick={fetchRelevantNews}
              disabled={newsLoading}
              className="text-xs px-2 py-1 rounded bg-blue-50 text-blue-600 hover:bg-blue-100 transition disabled:opacity-50"
              title="Refresh berita"
            >
              <i className={`fas fa-sync ${newsLoading ? 'animate-spin' : ''}`}></i>
            </button>
          </div>

          {/* News panel - sama tinggi dengan chart */}
          <div className="bg-slate-50 border border-slate-200 rounded-lg overflow-y-auto h-64">
            {/* Ringkasan AI */}
            <div className="p-3 border-b border-slate-200 bg-indigo-50/60">
              <p className="text-[11px] font-semibold text-indigo-700 uppercase mb-1 flex items-center gap-1">
                <i className="fas fa-robot"></i> Rekomendasi AI
              </p>
              <p className="text-sm text-slate-700 leading-relaxed">
                {newsLoading
                  ? 'Sedang menganalisis pasar...'
                  : newsError
                    ? newsError
                    : (aiSummary || 'Belum ada data tren. Klik refresh.')}
              </p>
            </div>

            {newsLoading ? (
              <div className="p-4 text-center text-slate-500 text-sm">
                <i className="fas fa-spinner fa-spin mr-2"></i> Mengambil berita terkini...
              </div>
            ) : newsError ? (
              <div className="p-4 text-center text-red-500 text-sm">
                <i className="fas fa-info-circle mr-2"></i> {newsError}
              </div>
            ) : newsList.length > 0 ? (
              newsList.map((n) => (
                <div 
                  key={n.id} 
                  onClick={() => {
                    // Buka URL berita di tab baru
                    if (n.url) {
                      window.open(n.url, '_blank', 'noopener,noreferrer');
                    }
                  }}
                  className="p-3 hover:bg-white transition cursor-pointer group border-b border-slate-200 last:border-b-0"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium text-slate-800 line-clamp-2 group-hover:text-blue-600 transition">{n.title}</p>
                      <p className="text-xs text-slate-600 mt-1 line-clamp-2">{n.snippet}</p>
                      <div className="flex flex-wrap gap-2 mt-2">
                        {n.source && (
                          <span className="text-[10px] bg-slate-100 text-slate-600 px-2 py-0.5 rounded inline-flex items-center gap-1">
                            <i className="fas fa-building"></i> {n.source}
                          </span>
                        )}
                        {n.published_date && (
                          <span className="text-[10px] bg-amber-50 text-amber-700 px-2 py-0.5 rounded inline-flex items-center gap-1">
                            <i className="fas fa-clock"></i> {n.published_date}
                          </span>
                        )}
                      </div>
                    </div>
                    <div className="text-xs text-slate-400 whitespace-nowrap flex flex-col items-end">
                      <div className="mt-1 group-hover:opacity-100 opacity-0 transition">
                        <i className="fas fa-arrow-up-right-from-square text-blue-500 text-xs"></i>
                      </div>
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <div className="p-4 text-center text-slate-500 text-sm">
                <i className="fas fa-info-circle mr-2"></i> Tidak ada berita ditemukan
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
