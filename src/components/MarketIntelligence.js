'use client';

import { useEffect, useRef } from 'react';

export default function MarketIntelligence({ businessName, marketData }) {
  const chartRef = useRef(null);
  const chartInstanceRef = useRef(null);

  useEffect(() => {
    if (typeof window !== 'undefined' && window.Chart) {
      // Destroy existing chart if it exists
      if (chartInstanceRef.current) {
        chartInstanceRef.current.destroy();
      }

      if (chartRef.current) {
        const ctx = chartRef.current.getContext('2d');
        chartInstanceRef.current = new window.Chart(ctx, {
          type: 'line',
          data: {
            labels: ['Sen', 'Sel', 'Rab', 'Kam', 'Jum', 'Sab', 'Min'],
            datasets: [
              {
                label: 'Minat Pembeli (Minggu Ini)',
                data: [12, 19, 15, 25, 32, 45, 40],
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
  }, []);

  return (
    <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
      <div className="flex justify-between items-center mb-4">
        <h3 className="font-bold text-slate-800 flex items-center gap-2">
          <i className="fas fa-radar text-red-500"></i> Radar Tren & Kompetitor
        </h3>
        <span className="text-xs bg-red-100 text-red-600 px-2 py-1 rounded-full animate-pulse">
          Live Analysis
        </span>
      </div>

      <div className="flex flex-col md:flex-row gap-6">
        {/* Visualisasi Data (Chart) */}
        <div className="w-full md:w-1/2 h-48 relative">
          <canvas ref={chartRef}></canvas>
        </div>

        {/* AI Analysis Text */}
        <div className="w-full md:w-1/2 flex flex-col justify-center">
          <h4 className="font-semibold text-sm text-slate-700 mb-2">
            Insight AI Hari Ini:
          </h4>
          <div className="bg-blue-50 p-3 rounded-lg border border-blue-100">
            <p className="text-sm text-slate-600 leading-snug">
              {marketData?.insight ||
                'Tren positif terlihat stabil. Permintaan meningkat menjelang akhir pekan.'}
            </p>
          </div>
          <div className="mt-3 flex gap-2">
            <div className="flex-1 bg-slate-50 p-2 rounded border border-slate-100 text-center">
              <div className="text-xs text-slate-500">Harga Rata-rata</div>
              <div className="font-bold text-slate-700">
                {marketData?.price || 'Rp 25.000'}
              </div>
            </div>
            <div className="flex-1 bg-slate-50 p-2 rounded border border-slate-100 text-center">
              <div className="text-xs text-slate-500">Pencarian</div>
              <div className="font-bold text-green-600">Naik 12%</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
