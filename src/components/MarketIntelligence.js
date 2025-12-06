"use client";

import { useEffect, useRef, useState } from 'react';

export default function MarketIntelligence({ businessName, marketData, businessLocation, businessDescription, businessType = '' }) {
  const chartRef = useRef(null);
  const chartInstanceRef = useRef(null);
  const [timeframe, setTimeframe] = useState('weekly'); // 'daily' | 'weekly' | 'monthly'
  const [trafficInsight, setTrafficInsight] = useState({ summary: '', bullets: [] });
  // AI features temporarily disabled
  // const [aiInsight, setAiInsight] = useState('');
  // const [aiLoading, setAiLoading] = useState(false);
  // const [aiError, setAiError] = useState('');

  // Bangun insight singkat yang mengikuti timeframe traffic
  const buildTrafficInsight = (tf) => {
    const data = getChartDataFor(tf);
    const values = data.customers || data.data || [];
    const total = data.totalCustomers || 0;
    const peak = Math.max(...values);
    const low = Math.min(...values);
    const avg = values.length ? Math.round(values.reduce((a, b) => a + b, 0) / values.length) : 0;

    const label = tf === 'daily' ? 'hari ini' : tf === 'weekly' ? 'minggu ini' : 'bulan ini';
    const summary = `Traffic ${label}: total ${total} kunjungan, rata-rata ${avg} per periode, puncak ${peak}, terendah ${low}.`;

    const bullets = [
      `Jam/periode tersibuk: ${peak} kunjungan`,
      `Periode paling sepi: ${low} kunjungan`,
      `Rata-rata stabil di ${avg} kunjungan`,
      'Ide aksi: siapkan promo ringan di jam sepi dan tambah stok/tim di jam ramai.'
    ];

    return { summary, bullets };
  };

  useEffect(() => {
    setTrafficInsight(buildTrafficInsight(timeframe));
  }, [timeframe]);

  // DISABLED: AI Analysis feature temporarily disabled
  // const generateAIInsight = async () => {
  //   setAiLoading(true);
  //   setAiError('');
  //   ...
  // };

  // useEffect(() => {
  //   generateAIInsight();
  // }, [timeframe]);

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
        {/* Traffic Chart */}
        <div className="flex flex-col">
          <h4 className="font-semibold text-sm text-slate-700 mb-2 flex items-center gap-2">
            <i className="fas fa-chart-area text-indigo-500"></i> Grafik Traffic
          </h4>
          <div className="bg-gradient-to-br from-indigo-50 to-blue-50 border border-indigo-200 rounded-lg p-4 h-64 relative">
            <canvas ref={chartRef}></canvas>
          </div>
        </div>

        {/* Analisis Toko mengikuti timeframe traffic */}
        <div className="flex flex-col">
          <div className="flex items-center justify-between mb-2">
            <h4 className="font-semibold text-sm text-slate-700 flex items-center gap-2">
              <i className="fas fa-magnifying-glass-chart text-blue-500"></i> Analisis Toko
            </h4>
            <span className="text-[11px] text-slate-500">Sinkron dengan traffic {timeframe === 'daily' ? 'harian' : timeframe === 'weekly' ? 'mingguan' : 'bulanan'}</span>
          </div>

          <div className="bg-slate-50 border border-slate-200 rounded-lg overflow-y-auto h-64">
            <div className="p-3 border-b border-slate-200 bg-indigo-50/60">
              <p className="text-[11px] font-semibold text-indigo-700 uppercase mb-1 flex items-center gap-1">
                <i className="fas fa-chart-line"></i> Insight Traffic
              </p>
              <p className="text-sm text-slate-700 leading-relaxed">
                {trafficInsight.summary || 'Belum ada data traffic.'}
              </p>
            </div>

            <div className="p-3 flex flex-col gap-2">
              <p className="text-xs text-slate-500 mb-1">Rekomendasi Aksi:</p>
              {trafficInsight.bullets.map((item, idx) => (
                <div key={idx} className="flex items-start gap-2">
                  <span className="text-[10px] text-indigo-500 mt-0.5"><i className="fas fa-circle"></i></span>
                  <p className="text-sm text-slate-700 leading-snug">{item}</p>
                </div>
              ))}
              {(!trafficInsight.bullets || trafficInsight.bullets.length === 0) && (
                <p className="text-sm text-slate-500">Insight belum tersedia.</p>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
