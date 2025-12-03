"use client";

import { useEffect, useRef, useState } from 'react';

export default function MarketIntelligence({ businessName, marketData }) {
  const chartRef = useRef(null);
  const chartInstanceRef = useRef(null);
  const [timeframe, setTimeframe] = useState('weekly'); // 'daily' | 'weekly' | 'monthly'

  // Sample news fallback when marketData.news isn't provided
  const SAMPLE_NEWS = [
    {
      id: 1,
      title: 'Permintaan sayur lokal meningkat 15% di area sekitar',
      source: 'Berita Lokal',
      time: '2 jam lalu',
      location: marketData?.location || 'Sekitar Anda',
      snippet: 'Permintaan sayur segar meningkat karena adanya festival kuliner.',
    },
    {
      id: 2,
      title: 'Kompetitor X turunkan harga bawang',
      source: 'MarketWatch',
      time: '1 hari lalu',
      location: marketData?.location || 'Sekitar Anda',
      snippet: 'Diskon musiman dari kompetitor mungkin mempengaruhi margin.',
    },
  ];

  const newsList = marketData?.news && marketData.news.length ? marketData.news : SAMPLE_NEWS;

  const getChartDataFor = (tf) => {
    if (tf === 'daily') {
      return {
        labels: ['00:00', '04:00', '08:00', '12:00', '16:00', '20:00', '24:00'],
        data: [5, 9, 20, 35, 28, 22, 10],
        label: 'Minat Pembeli (Harian)'
      };
    }

    if (tf === 'monthly') {
      return {
        labels: ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des'],
        data: [120, 150, 130, 170, 180, 200, 190, 210, 230, 220, 205, 240],
        label: 'Minat Pembeli (Bulanan)'
      };
    }

    // default weekly
    return {
      labels: ['Sen', 'Sel', 'Rab', 'Kam', 'Jum', 'Sab', 'Min'],
      data: [12, 19, 15, 25, 32, 45, 40],
      label: 'Minat Pembeli (Mingguan)'
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
              },
            ],
          },
          options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: { legend: { display: false } },
            scales: {
              y: { beginAtZero: true, display: false },
              x: { grid: { display: false } },
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
            <i className="fas fa-radar text-red-500"></i> Radar Tren & Kompetitor
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

        <span className="text-xs bg-red-100 text-red-600 px-2 py-1 rounded-full animate-pulse">
          Live Analysis
        </span>
      </div>

      <div className="flex flex-col md:flex-row gap-6">
        {/* Visualisasi Data (Chart) */}
        <div className="w-full md:w-1/2 h-48 relative">
          <canvas ref={chartRef}></canvas>
        </div>

        {/* Berita Tren Pasar Hari Ini */}
        <div className="w-full md:w-1/2 flex flex-col">
          <h4 className="font-semibold text-sm text-slate-700 mb-2">
            Berita Tren Pasar Hari Ini
          </h4>

          {/* News panel (replaces Insight AI) */}
          <div className="bg-white border border-slate-100 rounded-lg divide-y">
            {newsList.map((n) => (
              <div key={n.id} className="p-3">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-slate-800 truncate">{n.title}</p>
                    <p className="text-xs text-slate-500">{n.source} • {n.time} • {n.location}</p>
                    {/* ringkasan berita dihapus */}
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Bagian "iklan cepat" dihapus */}
        </div>
      </div>
    </div>
  );
}
