'use client';

import { useToast } from './Toast';

export default function AdModal({ onClose }) {
  const toast = useToast();
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6 animate-fade-in">
        <div className="text-center mb-6">
          <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-3">
            <i className="fas fa-bullhorn text-blue-600 text-xl"></i>
          </div>
          <h3 className="text-xl font-bold text-gray-900">Pasang Iklan Express</h3>
          <p className="text-sm text-gray-500">Jangkau 1.000+ pelanggan di sekitar Anda.</p>
        </div>

        <div className="space-y-4">
          <div className="p-3 border border-blue-200 bg-blue-50 rounded-lg flex justify-between items-center cursor-pointer hover:bg-blue-100 transition">
            <div className="flex items-center gap-3">
              <i className="fab fa-instagram text-pink-600 text-xl"></i>
              <div className="text-left">
                <div className="font-bold text-sm text-slate-800">Paket Hemat IG</div>
                <div className="text-xs text-slate-500">Estimasi 500 views</div>
              </div>
            </div>
            <div className="font-bold text-blue-700">Rp 50.000</div>
          </div>

          <div className="p-3 border border-slate-200 rounded-lg flex justify-between items-center cursor-pointer hover:bg-slate-50 transition">
            <div className="flex items-center gap-3">
              <i className="fab fa-tiktok text-black text-xl"></i>
              <div className="text-left">
                <div className="font-bold text-sm text-slate-800">Paket Viral TikTok</div>
                <div className="text-xs text-slate-500">Estimasi 1.200 views</div>
              </div>
            </div>
            <div className="font-bold text-slate-700">Rp 100.000</div>
          </div>
        </div>

        <div className="mt-6 flex gap-3">
          <button
            onClick={onClose}
            className="flex-1 py-2 text-slate-500 font-medium hover:bg-slate-50 rounded-lg"
          >
            Batal
          </button>
          <button
            onClick={() => toast.info('Simulasi: Anda akan diarahkan ke payment gateway!')}
            className="flex-1 bg-blue-600 text-white font-bold py-2 rounded-lg hover:bg-blue-700"
          >
            Pasang Sekarang
          </button>
        </div>
      </div>
    </div>
  );
}
