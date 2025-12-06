// src/components/OnboardingView.js
'use client';

import { useState, useMemo } from 'react';
// Import useToast dari komponen yang sudah ada
import { useToast } from './Toast';

// --- PROVINCES DATA (Disalin dari MenuPengaturan.js) ---
const PROVINCES = {
  "Aceh": [
    "Aceh Barat","Aceh Barat Daya","Aceh Besar","Aceh Jaya","Aceh Selatan","Aceh Singkil",
    "Aceh Tamiang","Aceh Tengah","Aceh Tenggara","Aceh Timur","Aceh Utara","Banda Aceh",
    "Bener Meriah","Bireuen","Blang Pidie","Gayo Lues","Jantho (Aceh Besar)","Kota Langsa",
    "Lhokseumawe","Meulaboh","Nagan Raya","Pidie","Pidie Jaya","Simeulue","Subulussalam"
  ],
  "Sumatera Utara": [
    "Asahan","Batu Bara","Binjai","Dairi","Deli Serdang","Humbang Hasundutan","Karo",
    "Labuhanbatu","Labuhanbatu Selatan","Labuhanbatu Utara","Langkat","Mandailing Natal",
    "Nias","Nias Barat","Nias Selatan","Nias Utara","Padang Lawas","Padang Lawas Utara",
    "Pakpak Bharat","Palas","Pematang Siantar","Samosir","Serdang Begadai","Sibolga",
    "Simalungun","Tapanuli Selatan","Tapanuli Tengah","Tapanuli Utara","Taput (Tapanuli Utara)",
    "Toba Samosir","Tebing Tinggi","Tanjungbalai","Medan","Gunungsitoli"
  ],
  "Sumatera Barat": [
    "Agam","Dharmasraya","Kab. Kepulauan Mentawai","Kota Bukittinggi","Kota Padang","Kota Padang Panjang",
    "Kota Pariaman","Kota Payakumbuh","Kota Sawahlunto","Kota Solok","Kota Solok Selatan","Kota Sungai Penuh",
    "Kota Batusangkar","Kota Payakumbuh","Kota Pariaman","Kota Padang Pariaman","Kota Tanah Datar",
    "Pasaman","Pasaman Barat","Pesisir Selatan","Sijunjung","Solok","Solok Selatan"
  ],
  "Riau": [
    "Bengkalis","Indragiri Hilir","Indragiri Hulu","Kampar","Kepulauan Meranti","Kota Pekanbaru",
    "Kota Dumai","Kuansing (Rokan Hulu)","Pelalawan","Rokan Hilir","Rokan Hulu","Siak"
  ],
  "Kepulauan Bangka Belitung": [
    "Bangka","Bangka Barat","Bangka Selatan","Bangka Tengah","Belitung","Belitung Timur","Pangkal Pinang"
  ],
  "Jambi": [
    "Bungo","Kerinci","Merangin","Muaro Jambi","Sarolangun","Sungaipenuh","Tanjung Jabung Barat",
    "Tanjung Jabung Timur","Tebo","Kota Jambi"
  ],
  "Bengkulu": [
    "Bengkulu Selatan","Bengkulu Tengah","Bengkulu Utara","Kaur","Kota Bengkulu","Kepahiang","Lebong",
    "Rejang Lebong","Seluma","Muko-Muko"
  ],
  "Lampung": [
    "Lampung Barat","Lampung Selatan","Lampung Tengah","Lampung Timur","Lampung Utara","Mesuji",
    "Metro","Pesisir Barat","Pringsewu","Tanggamus","Tulang Bawang","Tulang Bawang Barat","Way Kanan",
    "Kota Bandar Lampung","Kota Metro","Baradatu"
  ],
  "DKI Jakarta": [
    "Jakarta Barat","Jakarta Pusat","Jakarta Selatan","Jakarta Timur","Jakarta Utara","Kepulauan Seribu"
  ],
  "Banten": [
    "Kab. Serang","Kota Serang","Tangerang","Kota Tangerang","Kota Tangerang Selatan","Kota Cilegon",
    "Pandeglang","Lebak","Tangerang","Tangerang Selatan"
  ],
  "Jawa Barat": [
    "Bandung","Bandung Barat","Bekasi","Bogor","Ciamis","Cianjur","Cirebon","Garut","Indramayu","Kota Bandung",
    "Kota Bekasi","Kota Bogor","Kota Cirebon","Kota Sukabumi","Kota Tasikmalaya","Kuningan","Majalengka",
    "Pangandaran","Purwakarta","Subang","Sukabumi","Sumedang","Tasikmalaya"
  ],
  "Jawa Tengah": [
    "Banjarnegara","Banyumas","Batang","Blora","Boyolali","Brebes","Cilacap","Demak","Grobogan","Jepara",
    "Karanganyar","Kebumen","Kendal","Klaten","Kudus","Magelang","Pati","Pekalongan","Pemalang","Purbalingga",
    "Purworejo","Rembang","Semarang","Sragen","Sukoharjo","Tegal","Temanggung","Wonogiri","Wonosobo",
    "Kota Magelang","Kota Pekalongan","Kota Salatiga","Kota Semarang","Kota Surakarta (Solo)","Kota Tegal"
  ],
  "DI Yogyakarta": [
    "Bantul","Gung Kidul (Gunungkidul)","Kota Yogyakarta","Kulon Progo","Sleman"
  ],
  "Jawa Timur": [
    "Bangkalan","Banyuwangi","Blitar","Bojonegoro","Bondowoso","Gresik","Jember","Jombang","Kediri",
    "Kota Batu","Kota Blitar","Kota Kediri","Kota Madiun","Kota Malang","Kota Mojokerto","Kota Pasuruan",
    "Kota Probolinggo","Kota Surabaya","Lamongan","Lumajang","Madiun","Magetan","Mojokerto","Nganjuk","Pacitan",
    "Pamekasan","Pasuruan","Ponorogo","Probolinggo","Sampang","Sidoarjo","Situbondo","Sumenep","Trenggalek",
    "Tuban","Tulungagung"
  ],
  "Bali": [
    "Badung","Bangli","Buleleng","Gianyar","Jembrana","Karangasem","Klungkung","Kota Denpasar","Tabanan"
  ],
  "Nusa Tenggara Barat": [
    "Bima","Dompu","Kab. Lombok Barat","Kab. Lombok Tengah","Kab. Lombok Timur","Kab. Lombok Utara",
    "Sumbawa","Sumbawa Barat","Kota Bima","Kota Mataram"
  ],
  "Nusa Tenggara Timur": [
    "Alor","Belu","Ende","Flores Timur","Kupang","Lembata","Manggarai","Manggarai Barat","Manggarai Timur",
    "Nagekeo","Ngada","Rote Ndao","Sabu Raijua","Sikka","Sumba Barat","Sumba Barat Daya","Sumba Tengah",
    "Sumba Timur","Kupang Kota"
  ],
  "Kalimantan Barat": [
    "Bengkayang","Kapuas Hulu","Kayong Utara","Kubu Raya","Lanud","Melawi","Mempawah","Pontianak",
    "Sambas","Sanggau","Sintang","Singkawang","Ketapang"
  ],
  "Kalimantan Tengah": [
    "Barito Selatan","Barito Timur","Barito Utara","Gunung Mas","Kapuas","Katingan","Lamandau",
    "Murung Raya","Pulang Pisau","Palangka Raya","Sukamara","Kotawaringin Barat","Kotawaringin Timur"
  ],
  "Kalimantan Selatan": [
    "Balangan","Banjar","Barito Kuala","Hulu Sungai Selatan","Hulu Sungai Tengah","Hulu Sungai Utara",
    "Tabalong","Tanah Bumbu","Tanah Laut","Tapin","Banjarmasin","Banjarbaru"
  ],
  "Kalimantan Timur": [
    "Berau","Kota Balikpapan","Kota Bontang","Kota Samarinda","Kutai Barat","Kutai Kartanegara",
    "Kutai Timur","Paser","Penajam Paser Utara"
  ],
  "Kalimantan Utara": [
    "Bulungan","Malinau","Nunukan","Tana Tidung","Tarakan"
  ],
  "Sulawesi Utara": [
    "Bolaang Mongondow","Kepulauan Sangihe","Kepulauan Talaud","Kota Bitung","Kota Kotamobagu","Kota Manado",
    "Kota Tomohon","Minahasa","Minahasa Selatan","Minahasa Tenggara","Minahasa Utara"
  ],
  "Gorontalo": [
    "Boalemo","Gorontalo","Gorontalo Utara","Pohuwato","Bone Bolango","Kota Gorontalo"
  ],
  "Sulawesi Tengah": [
    "Banggai","Donggala","Morowali","Palu","Poso","Sigi","Tojo Una-Una","Buol","Banggai Kepulauan"
  ],
  "Sulawesi Barat": [
    "Majene","Mamasa","Mamuju","Mamuju Tengah","Mamuju Utara","Polewali Mandar"
  ],
  "Sulawesi Selatan": [
    "Barru","Bantaeng","Bone","Bulukumba","Enrekang","Gowa","Jeneponto","Kabupaten Kepulauan Selayar",
    "Luwu","Luwu Timur","Luwu Utara","Makassar","Maros","Parepare","Pangkajene Kepulauan","Pinrang",
    "Polewali Mandar (part)","Sidenreng Rappang (Sidenreng Rappang)","Sinjai","Soppeng","Takalar",
    "Tana Toraja","Toraja Utara","Wajo"
  ],
  "Sulawesi Tenggara": [
    "Bau-Bau","Buton","Kendari","Kolaka","Muna","Bombana","Wakatobi","Konawe","Konawe Selatan","Konawe Utara"
  ],
  "Maluku": [
    "Ambon","Buru","Buru Selatan","Maluku Tengah","Maluku Tenggara","Maluku Tenggara Barat","Seram Bagian Barat",
    "Seram Bagian Timur","Tual"
  ],
  "Maluku Utara": [
    "Halmahera Barat","Halmahera Tengah","Halmahera Utara","Halmahera Selatan","Halmahera Timur","Kota Ternate",
    "Kota Tidore Kepulauan","Pulau Taliabu","Pulau Morotai"
  ],
  "Papua": [
    "Asmat","Boven Digoel","Biak Numfor","Bintuni (Teluk Bintuni)","Deiyai","Dogiyai","Jayapura","Jayawijaya",
    "Keerom","Mamberamo Raya","Mamberamo Tengah","Mappi","Merauke","Mimika","Nabire","Nduga","Paniai","Pegunungan Bintang",
    "Puncak","Puncak Jaya","Sarmi","Sinak (Sinaru)","Supiori","Tolikara","Yahukimo","Yalimo"
  ],
  "Papua Barat": [
    "Fakfak","Kaimana","Manokwari","Maybrat","Pegunungan Arfak","Raja Ampat","Sorong","Sorong Selatan","Tambrauw","Teluk Bintuni",
    "Teluk Wondama"
  ],
  "Papua Tengah": ["Nabire","Paniai","Dogiyai","Deiyai","Intan Jaya","Mimika (part)"],
  "Papua Pegunungan": ["Jayawijaya","Yalimo","Lanny Jaya","Mamberamo Tengah"],
  "Papua Selatan": ["Merauke","Boven Digoel","Mappi","Asmat","Bintuni"],
  "Papua Barat Daya": ["Kaimana","Teluk Arguni","Raja Ampat","Sorong Selatan"]
};

const BUSINESS_TYPES = [
    'Kuliner (Makanan/Minuman)', 'Fashion & Pakaian', 'Jasa & Layanan',
    'Retail & Toko', 'Teknologi & Elektronik', 'Kesehatan & Kecantikan',
    'Pendidikan & Pelatihan', 'Otomotif', 'Properti & Real Estate', 'Lainnya'
];
// --- END PROVINCES DATA ---

export default function OnboardingView({ user, onConsultAI, onSetupComplete, businessData, loading }) {
    const toast = useToast();
    // MODIFIED: Default selectedSide to 'ai' to skip the initial choice screen
    const [selectedSide, setSelectedSide] = useState('ai'); // 'ai' | 'manual' 
    const [aiInput, setAiInput] = useState('');
    const [manualForm, setManualForm] = useState({
        businessName: '',
        businessDescription: '',
        userName: user?.displayName || user?.email?.split('@')[0] || '',
        businessType: '',
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
    
    // RENDER LOGIC MODIFIED: Always show one single-column view
    return (
        <div className="min-h-screen flex items-center justify-center bg-slate-50 p-4">
            {/* Modal Onboarding Utama (1 Kolom Tampilan) */}
            <div className={`max-w-xl w-full bg-white shadow-2xl rounded-3xl animate-fade-in`}>
                
                <div className="p-8 space-y-6 flex flex-col">
                    <div className="flex items-center justify-between border-b pb-4">
                        <h2 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
                            {/* Judul dinamis */}
                            {selectedSide === 'ai' ? (
                                <><i className="fas fa-robot text-blue-500"></i> Ide Bisnis dari AI</>
                            ) : (
                                <><i className="fas fa-store text-green-500"></i> Setup Bisnis Manual</>
                            )}
                        </h2>
                        
                        {/* NEW: Toggle Button/Link */}
                        <div className="text-sm font-medium">
                            {selectedSide === 'ai' ? (
                                <button
                                    type="button"
                                    onClick={() => {
                                        setSelectedSide('manual');
                                        onConsultAI(null); // Clear recommendation when switching
                                    }}
                                    className="text-green-600 hover:text-green-700 underline"
                                >
                                    Punya Bisnis? Isi Detail
                                </button>
                            ) : (
                                <button
                                    type="button"
                                    onClick={() => setSelectedSide('ai')}
                                    className="text-blue-600 hover:text-blue-700 underline"
                                >
                                    Belum Punya Bisnis? Tanya AI
                                </button>
                            )}
                        </div>
                    </div>
                    
                    {selectedSide === 'ai' && (
                        /* Tampilan Tanya AI (Belum Punya Bisnis) */
                        <>
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
                            
                        </>
                    )}
                    
                    {selectedSide === 'manual' && (
                        /* Tampilan Setup Manual (Bisnis Sudah Ada) */
                        <>
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
                        </>
                    )}
                </div>
            </div>
        </div>
    );
}