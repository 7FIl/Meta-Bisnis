// src/components/OnboardingView.js
'use client';

import { useState, useMemo } from 'react';
// Import useToast dari komponen yang sudah ada
import { useToast } from './Toast';
import { PROVINCES, getCitiesByProvince } from '@/lib/locations';
import { generateCapitalExcel } from '@/lib/excelGenerator';

const BUSINESS_TYPES = [
    'Kuliner (Makanan/Minuman)', 'Fashion & Pakaian', 'Jasa & Layanan',
    'Retail & Toko', 'Teknologi & Elektronik', 'Kesehatan & Kecantikan',
    'Pendidikan & Pelatihan', 'Otomotif', 'Properti & Real Estate', 'Lainnya'
];

export default function OnboardingView({ user, onConsultAI, onSetupComplete, businessData, loading, businessType = '' }) {
    const toast = useToast();
    // MODIFIED: Default selectedSide to 'ai' to skip the initial choice screen
    // Default null so user memilih dulu, tidak langsung membuka popup AI
    const [selectedSide, setSelectedSide] = useState(null); // 'ai' | 'manual'
    const [aiInput, setAiInput] = useState('');
    const [manualForm, setManualForm] = useState({
        businessName: businessData?.name || '',
        businessDescription: businessData?.description || '',
        userName: user?.displayName || user?.email?.split('@')[0] || '',
        businessType: businessType || businessData?.businessType || '',
        province: '',
        city: ''
    });

    const cities = useMemo(() => {
        return PROVINCES[manualForm.province] || [];
    }, [manualForm.province]);

    const handleManualChange = (e) => {
        const { id, value } = e.target;
        setManualForm(prev => ({ ...prev, [id]: value }));
    };

    const handleProvinceChange = (e) => {
        const province = e.target.value;
        setManualForm(prev => ({ 
            ...prev, 
            province: province, 
            city: '' // Reset kota ketika provinsi berubah
        }));
    };

    const handleManualSetup = async (e) => {
        e.preventDefault();
        
        const { businessName, userName, businessType, province, city } = manualForm;

        if (!businessName || !userName || !businessType || !province) {
            toast.error('Nama Bisnis, Nama Pengguna, Jenis Usaha, dan Provinsi wajib diisi.');
            return;
        }

        try {
            const location = province + (city ? `, ${city}` : '');

            await onSetupComplete({
                businessName,
                userName,
                businessLocation: location,
                businessDescription: manualForm.businessDescription || `Bisnis jenis ${businessType} di ${location}`,
            });
            toast.success('Setup Bisnis berhasil! Selamat datang di Dashboard.');
        } catch (error) {
            console.error("Manual setup error:", error);
            toast.error(error.message || 'Gagal menyimpan pengaturan bisnis.');
        }
    };

    const handleAIConsult = async () => {
        if (!aiInput) {
            toast.warning('Mohon isi ide atau kondisi Anda terlebih dahulu.');
            return;
        }
        try {
            // onConsultAI akan memproses input, mendapatkan rekomendasi AI,
            // menyimpan data bisnis, dan otomatis beralih ke dashboard.
            await onConsultAI(aiInput); 
        } catch (error) {
            console.error("AI consult error:", error);
            toast.error(error.message || 'Gagal mendapatkan rekomendasi AI.');
        }
    };

    // New: Tombol "Coba Lagi" (mode AI)
    const handleTryAgain = () => {
        setAiInput(''); // Kosongkan input
        onConsultAI(null); // Panggil parent untuk reset businessData
    }

    // New: Tombol "Mulai" (mode AI)
    const handleStartWithAI = async () => {
        if (businessData) {
            // Panggil onConsultAI dengan parameter setupBusiness=true
            // Ini akan memicu persistensi data yang sudah ada dan pindah ke dashboard
            await onConsultAI(null, true);
        } else {
             // Shouldn't happen if button is shown correctly, but fallback
             toast.warning('Anda harus mendapatkan rekomendasi AI terlebih dahulu.');
        }
    }

    // Generate Excel dengan detail breakdown modal dan financial metrics
    const handleGenerateExcel = () => {
        generateCapitalExcel(businessData, (message) => {
            toast.success(message);
        });
    };

    if (!selectedSide) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-slate-50 p-4">
                <div className="max-w-4xl w-full bg-white shadow-2xl rounded-3xl p-8 text-center animate-fade-in">
                    <h1 className="text-3xl font-bold text-slate-900 mb-2">Selamat Datang, {manualForm.userName}!</h1>
                    <p className="text-lg text-slate-600 mb-8">Pilih cara Anda memulai pengalaman Meta Bisnis:</p>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {/* Column 1: Tanya AI (Belum Punya Bisnis) */}
                        <div 
                            onClick={() => {
                                setSelectedSide('ai');
                                // Reset businessData jika ada, agar tampilan default muncul
                                if(businessData) onConsultAI(null); 
                            }}
                            className="p-6 border-2 border-blue-200 rounded-xl hover:shadow-lg transition cursor-pointer bg-blue-50"
                        >
                            <i className="fas fa-robot text-5xl text-blue-600 mb-4"></i>
                            <h2 className="text-xl font-bold text-slate-800 mb-2">Belum Punya Bisnis? Tanya AI</h2>
                            <p className="text-sm text-slate-600">Jelaskan modal, lokasi, dan minat Anda. AI akan memberikan rekomendasi bisnis siap jalan.</p>
                            <button className="mt-4 text-sm bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition">Mulai Konsultasi</button>
                        </div>
                        
                        {/* Column 2: Bisnis Sudah Ada (Setup Manual) */}
                        <div 
                            onClick={() => setSelectedSide('manual')}
                            className="p-6 border-2 border-green-200 rounded-xl hover:shadow-lg transition cursor-pointer bg-green-50"
                        >
                            <i className="fas fa-store text-5xl text-green-600 mb-4"></i>
                            <h2 className="text-xl font-bold text-slate-800 mb-2">Bisnis Saya Sudah Ada</h2>
                            <p className="text-sm text-slate-600">Masukkan detail bisnis Anda yang sudah berjalan agar AI dapat memberikan saran yang lebih relevan.</p>
                            <button className="mt-4 text-sm bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition">Isi Detail Bisnis</button>
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen flex items-center justify-center bg-slate-50 p-4">
            {/* Modal Onboarding Utama (1 Kolom Tampilan) */}
            <div className={`max-w-xl w-full bg-white shadow-2xl rounded-3xl animate-fade-in`}>
                
                {selectedSide === 'ai' && (
                    /* Tampilan Tanya AI (Belum Punya Bisnis) */
                    <div className="p-8 space-y-6">
                        <div className="flex items-center justify-between border-b pb-4">
                            <h2 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
                                <i className="fas fa-robot text-blue-500"></i> Ide Bisnis dari AI
                            </h2>
                            <button onClick={() => setSelectedSide(null)} className="text-slate-500 hover:text-slate-700">
                                <i className="fas fa-times"></i>
                            </button>
                        </div>
                        
                        {!businessData ? (
                            // Input Area
                            <>
                                <p className="text-slate-600">
                                    Ceritakan modal, lokasi, atau minat Anda. AI akan carikan peluang bisnis paling cuan berdasarkan data tren pasar terkini.
                                </p>
                                <div className="flex-1">
                                    <textarea
                                        value={aiInput}
                                        onChange={(e) => setAiInput(e.target.value)}
                                        rows="6"
                                        placeholder="Cth: Saya punya modal 1 juta, suka masak, lokasi di dekat kampus..."
                                        className="w-full text-sm p-4 border border-slate-300 rounded-lg focus:ring-1 focus:ring-blue-500 outline-none resize-none"
                                        disabled={loading}
                                    ></textarea>
                                </div>

                                <div>
                                    <button
                                        onClick={handleAIConsult}
                                        disabled={loading || !aiInput.trim()}
                                        className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-slate-400 text-white font-semibold py-3 rounded-lg transition-all flex items-center justify-center gap-2"
                                    >
                                        <i className={`fas ${loading ? 'fa-spinner fa-spin' : 'fa-magic'}`}></i>
                                        {loading ? 'Mencari Ide...' : 'Cari Ide Bisnis'}
                                    </button>
                                </div>
                            </>
                        ) : (
                            // Hasil Rekomendasi AI
                            <div className="space-y-4">
                                <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
                                    <h3 className="font-bold text-lg text-slate-800 mb-1">{businessData.name || 'Rekomendasi Bisnis'}</h3>
                                    <p className="text-sm text-slate-600">{businessData.description || 'Deskripsi tidak tersedia.'}</p>
                                </div>
                                
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="bg-slate-50 p-3 rounded-lg border border-slate-200">
                                        <p className="text-xs text-slate-500">Modal Estimasi</p>
                                        <p className="font-semibold text-sm">{businessData.capital_est || 'N/A'}</p>
                                    </div>
                                    <div className="bg-slate-50 p-3 rounded-lg border border-slate-200">
                                        <p className="text-xs text-slate-500">Target Pasar</p>
                                        <p className="font-semibold text-sm">{businessData.target_market || 'N/A'}</p>
                                    </div>
                                </div>
                                
                                <p className="text-xs text-red-500 pt-2">
                                    <i className="fas fa-exclamation-triangle mr-1"></i> Tantangan: {businessData.challenge || 'Tidak disebutkan.'}
                                </p>
                                
                                {/* Tombol Download Excel */}
                                <div className="pt-4">
                                    <button
                                        onClick={handleGenerateExcel}
                                        className="w-full px-4 py-2 bg-green-50 text-green-700 hover:bg-green-100 border border-green-200 rounded-lg font-medium text-sm transition-colors flex items-center justify-center gap-2 mb-4"
                                        title="Download rincian modal lengkap dalam format Excel"
                                    >
                                        <i className="fas fa-file-excel"></i> Download Rincian Modal (Excel)
                                    </button>
                                </div>
                                
                                {/* Tombol Aksi */}
                                <div className="flex gap-3 pt-4 border-t">
                                    <button
                                        onClick={handleTryAgain}
                                        className="flex-1 px-4 py-2 border border-slate-300 text-slate-700 rounded-lg hover:bg-slate-50 font-medium text-sm transition-colors"
                                    >
                                        <i className="fas fa-redo mr-1"></i> Coba Lagi
                                    </button>
                                    <button
                                        onClick={handleStartWithAI}
                                        className="flex-1 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-semibold text-sm transition-colors"
                                        disabled={loading}
                                    >
                                        <i className="fas fa-rocket mr-1"></i> Mulai
                                    </button>
                                </div>
                            </div>
                        )}
                    </div>
                )}
                
                {selectedSide === 'manual' && (
                    /* Tampilan Setup Manual (Bisnis Sudah Ada) */
                    <div className="p-8 space-y-6">
                        <div className="flex items-center justify-between border-b pb-4">
                            <h2 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
                                <i className="fas fa-briefcase text-green-500"></i> Setup Bisnis Manual
                            </h2>
                            <button onClick={() => setSelectedSide(null)} className="text-slate-500 hover:text-slate-700">
                                <i className="fas fa-times"></i>
                            </button>
                        </div>
                        
                        <p className="text-slate-600">
                            Isi detail bisnis Anda yang sudah ada untuk pengalaman dashboard yang lebih personal dan relevan.
                        </p>
                        
                        <form onSubmit={handleManualSetup} className="space-y-4">
                            {/* Nama Bisnis */}
                            <div>
                                <label htmlFor="businessName" className="block text-sm font-semibold text-slate-700 mb-1">Nama Bisnis *</label>
                                <input
                                    id="businessName"
                                    type="text"
                                    value={manualForm.businessName}
                                    onChange={handleManualChange}
                                    placeholder="Cth: Kopi Pintar AI"
                                    required
                                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-1 focus:ring-green-500 outline-none"
                                    disabled={loading}
                                />
                            </div>

                            {/* Nama Pengguna */}
                            <div>
                                <label htmlFor="userName" className="block text-sm font-semibold text-slate-700 mb-1">Nama Pengguna *</label>
                                <input
                                    id="userName"
                                    type="text"
                                    value={manualForm.userName}
                                    onChange={handleManualChange}
                                    placeholder="Cth: Budi Santoso"
                                    required
                                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-1 focus:ring-green-500 outline-none"
                                    disabled={loading}
                                />
                            </div>

                            {/* Deskripsi Bisnis (Opsional) */}
                            <div>
                                <label htmlFor="businessDescription" className="block text-sm font-semibold text-slate-700 mb-1">Deskripsi Bisnis (Opsional)</label>
                                <textarea
                                    id="businessDescription"
                                    value={manualForm.businessDescription}
                                    onChange={handleManualChange}
                                    placeholder="Jelaskan produk, target pasar, dan keunggulan utama (Maks 150 karakter)"
                                    rows="2"
                                    maxLength={150}
                                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-1 focus:ring-green-500 outline-none resize-none"
                                    disabled={loading}
                                />
                            </div>

                            {/* Jenis Usaha */}
                            <div>
                                <label htmlFor="businessType" className="block text-sm font-semibold text-slate-700 mb-1">Jenis Usaha *</label>
                                <select
                                    id="businessType"
                                    value={manualForm.businessType}
                                    onChange={handleManualChange}
                                    required
                                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-1 focus:ring-green-500 outline-none bg-white cursor-pointer"
                                    disabled={loading}
                                >
                                    <option value="">Pilih Jenis Usaha</option>
                                    {BUSINESS_TYPES.map(type => (
                                        <option key={type} value={type}>{type}</option>
                                    ))}
                                </select>
                            </div>

                            {/* Lokasi */}
                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <label htmlFor="province" className="block text-sm font-semibold text-slate-700 mb-1">Provinsi *</label>
                                    <select
                                        id="province"
                                        value={manualForm.province}
                                        onChange={handleProvinceChange}
                                        required
                                        className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-1 focus:ring-green-500 outline-none bg-white cursor-pointer"
                                        disabled={loading}
                                    >
                                        <option value="">Pilih Provinsi</option>
                                        {Object.keys(PROVINCES).map((p) => (
                                            <option key={p} value={p}>{p}</option>
                                        ))}
                                    </select>
                                </div>
                                <div>
                                    <label htmlFor="city" className="block text-sm font-semibold text-slate-700 mb-1">Kota / Kabupaten (Opsional)</label>
                                    <select
                                        id="city"
                                        value={manualForm.city}
                                        onChange={handleManualChange}
                                        className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-1 focus:ring-green-500 outline-none bg-white cursor-pointer"
                                        disabled={loading || !manualForm.province}
                                    >
                                        <option value="">Pilih Kota / Kabupaten</option>
                                        {cities.map((c) => (
                                            <option key={c} value={c}>{c}</option>
                                        ))}
                                    </select>
                                    {!manualForm.province && <p className="text-xs text-slate-400 mt-1">Pilih provinsi dulu</p>}
                                </div>
                            </div>

                            {/* Submit Button */}
                            <button
                                type="submit"
                                disabled={loading}
                                className="w-full bg-green-600 hover:bg-green-700 disabled:bg-slate-400 text-white font-semibold py-3 rounded-lg transition-all flex items-center justify-center gap-2 mt-6"
                            >
                                <i className={`fas ${loading ? 'fa-spinner fa-spin' : 'fa-check-circle'}`}></i>
                                {loading ? 'Memproses Setup...' : 'Selesai & Masuk Dashboard'}
                            </button>
                        </form>
                    </div>
                )}
            </div>
        </div>
    );
}