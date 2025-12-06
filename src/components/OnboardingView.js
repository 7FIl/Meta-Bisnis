// src/components/OnboardingView.js
'use client';

import { useState, useMemo } from 'react';
import * as XLSX from 'xlsx';
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

export default function OnboardingView({ user, onConsultAI, onSetupComplete, businessData, loading, businessType = '' }) {
    const toast = useToast();
    // MODIFIED: Default selectedSide to 'ai' to skip the initial choice screen
    const [selectedSide, setSelectedSide] = useState('ai'); // 'ai' | 'manual' 
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

    // Generate Excel dengan detail breakdown modal dan financial metrics (sama seperti ConsultationView)
    const generateCapitalExcel = () => {
        if (!businessData) return;

        // Create workbook
        const wb = XLSX.utils.book_new();

        // Sheet 1: Capital Breakdown (Items)
        const capitalItems = businessData.capitalBreakdown || [
            { item: 'Data estimasi modal tidak tersedia dari AI', quantity: 1, unit: 'set', price: 0, total: 0 },
        ];

        const totalModal = capitalItems.reduce((sum, item) => sum + (item.total || 0), 0);

        const capitalData = [
            ['RINCIAN ESTIMASI MODAL USAHA'],
            ['Nama Bisnis:', businessData.name || '-'],
            ['Tanggal:', new Date().toLocaleDateString('id-ID', { year: 'numeric', month: 'long', day: 'numeric' })],
            ['Estimasi Range:', businessData.capital_est || '-'],
            [],
            ['No', 'Item / Barang', 'Jumlah', 'Satuan', 'Harga Satuan (Rp)', 'Total (Rp)'],
            ...capitalItems.map((item, idx) => [
                idx + 1,
                item.item,
                item.quantity,
                item.unit,
                item.price?.toLocaleString('id-ID') || 0,
                item.total?.toLocaleString('id-ID') || 0
            ]),
            [],
            ['', 'TOTAL MODAL YANG DIBUTUHKAN', '', '', '', totalModal.toLocaleString('id-ID')],
            [],
            ['CATATAN:'],
            ['- Harga dapat berubah sesuai kondisi pasar dan lokasi'],
            ['- Sebaiknya tambahkan buffer 10-20% untuk biaya tak terduga'],
            ['- Konsultasikan dengan supplier lokal untuk harga terkini'],
        ];

        const ws1 = XLSX.utils.aoa_to_sheet(capitalData);
        ws1['!cols'] = [{ wch: 5 }, { wch: 35 }, { wch: 10 }, { wch: 10 }, { wch: 20 }, { wch: 20 }];
        XLSX.utils.book_append_sheet(wb, ws1, 'Rincian Modal');

        // Sheet 2: Financial Metrics with real calculations
        const metrics = businessData.financialMetrics || {
            bep_units: 'N/A',
            bep_revenue: 0,
            bep_months: 12,
            roi_percentage: 0,
            roi_months: 12,
            gross_margin_percentage: 0,
            monthly_revenue_estimate: 0,
            monthly_cost_estimate: 0,
            monthly_profit_estimate: 0,
            avg_selling_price: 0,
            avg_cost_per_unit: 0
        };

        const monthlyProfit = (metrics.monthly_revenue_estimate || 0) - (metrics.monthly_cost_estimate || 0);
        const yearlyProfit = monthlyProfit * 12;
        const actualROI = totalModal > 0 ? ((yearlyProfit / totalModal) * 100).toFixed(2) : 0;
        const paybackMonths = monthlyProfit > 0 ? Math.ceil(totalModal / monthlyProfit) : 0;

        const metricsData = [
            ['ANALISIS KEUANGAN & PROYEKSI BISNIS'],
            ['Nama Bisnis:', businessData.name || '-'],
            ['Total Modal:', 'Rp ' + totalModal.toLocaleString('id-ID')],
            ['Tanggal Analisis:', new Date().toLocaleDateString('id-ID')],
            [],
            ['═══════════════════════════════════════════════════'],
            ['1. BREAK EVEN POINT (BEP) ANALYSIS'],
            ['═══════════════════════════════════════════════════'],
            ['Target Unit untuk BEP:', metrics.bep_units + ' unit'],
            ['Target Pendapatan BEP:', 'Rp ' + (metrics.bep_revenue || 0).toLocaleString('id-ID')],
            ['Estimasi Waktu Mencapai BEP:', (metrics.bep_months || paybackMonths || 12) + ' bulan'],
            [],
            ['Penjelasan BEP:'],
            ['BEP adalah titik dimana total pendapatan = total biaya (modal + operasional).'],
            ['Setelah melewati BEP, bisnis mulai menghasilkan profit.'],
            [],
            ['═══════════════════════════════════════════════════'],
            ['2. RETURN ON INVESTMENT (ROI)'],
            ['═══════════════════════════════════════════════════'],
            ['ROI Percentage (Tahunan):', (metrics.roi_percentage || actualROI) + '%'],
            ['Waktu Balik Modal:', (metrics.roi_months || paybackMonths || 12) + ' bulan'],
            ['Modal Awal:', 'Rp ' + totalModal.toLocaleString('id-ID')],
            ['Profit Tahunan (Proyeksi):', 'Rp ' + yearlyProfit.toLocaleString('id-ID')],
            [],
            ['Interpretasi ROI:'],
            ['ROI > 20%: Sangat baik untuk bisnis UMKM di Indonesia'],
            ['ROI 15-20%: Baik dan layak dijalankan'],
            ['ROI < 15%: Perlu evaluasi ulang strategi bisnis'],
            [],
            ['═══════════════════════════════════════════════════'],
            ['3. GROSS PROFIT MARGIN (Marjin Laba Kotor)'],
            ['═══════════════════════════════════════════════════'],
            ['Margin Percentage:', (metrics.gross_margin_percentage || 0) + '%'],
            ['Harga Jual Rata-rata:', 'Rp ' + (metrics.avg_selling_price || 0).toLocaleString('id-ID')],
            ['HPP/Biaya per Unit:', 'Rp ' + (metrics.avg_cost_per_unit || 0).toLocaleString('id-ID')],
            [],
            ['Estimasi Pendapatan Bulanan:', 'Rp ' + (metrics.monthly_revenue_estimate || 0).toLocaleString('id-ID')],
            ['Estimasi Biaya Bulanan:', 'Rp ' + (metrics.monthly_cost_estimate || 0).toLocaleString('id-ID')],
            ['Laba Kotor Bulanan:', 'Rp ' + monthlyProfit.toLocaleString('id-ID')],
            ['Laba Kotor Tahunan:', 'Rp ' + yearlyProfit.toLocaleString('id-ID')],
            [],
            ['Interpretasi Margin:'],
            ['Margin > 40%: Sangat sehat untuk bisnis retail/F&B'],
            ['Margin 25-40%: Baik dan kompetitif'],
            ['Margin < 25%: Perlu efisiensi biaya atau naikkan harga jual'],
            [],
            ['═══════════════════════════════════════════════════'],
            ['4. PROYEKSI CASH FLOW (12 Bulan Pertama)'],
            ['═══════════════════════════════════════════════════'],
            ['Bulan', 'Pendapatan', 'Biaya', 'Profit/Loss', 'Kumulatif'],
        ];

        // Generate 12-month projection
        let cumulative = -totalModal; // Start with negative (initial capital)
        for (let month = 1; month <= 12; month++) {
            // Assume gradual growth: 60% in month 1, increasing to 100% by month 6
            const growthFactor = Math.min(0.6 + (month * 0.08), 1.0);
            const revenue = Math.round((metrics.monthly_revenue_estimate || 0) * growthFactor);
            const cost = Math.round((metrics.monthly_cost_estimate || 0) * growthFactor);
            const profit = revenue - cost;
            cumulative += profit;
            
            metricsData.push([
                `Bulan ${month}`,
                'Rp ' + revenue.toLocaleString('id-ID'),
                'Rp ' + cost.toLocaleString('id-ID'),
                'Rp ' + profit.toLocaleString('id-ID'),
                'Rp ' + cumulative.toLocaleString('id-ID')
            ]);
        }

        metricsData.push(
            [],
            ['═══════════════════════════════════════════════════'],
            ['KESIMPULAN & REKOMENDASI'],
            ['═══════════════════════════════════════════════════'],
            ['✓ Modal yang dibutuhkan: Rp ' + totalModal.toLocaleString('id-ID')],
            ['✓ Estimasi balik modal: ' + (paybackMonths || 12) + ' bulan'],
            ['✓ ROI tahunan: ' + (actualROI || metrics.roi_percentage || 0) + '%'],
            ['✓ Margin laba: ' + (metrics.gross_margin_percentage || 0) + '%'],
            [],
            ['DISCLAIMER:'],
            ['Data ini adalah estimasi berdasarkan analisis AI dan kondisi pasar umum.'],
            ['Hasil aktual dapat berbeda tergantung lokasi, manajemen, dan kondisi pasar.'],
            ['Lakukan riset pasar dan konsultasi dengan mentor bisnis sebelum memulai.'],
        );

        const ws2 = XLSX.utils.aoa_to_sheet(metricsData);
        ws2['!cols'] = [{ wch: 25 }, { wch: 20 }, { wch: 20 }, { wch: 20 }, { wch: 20 }];
        XLSX.utils.book_append_sheet(wb, ws2, 'Analisis Keuangan');

        // Download file
        const fileName = `Analisis_Bisnis_${(businessData.name || 'UMKM').replace(/[^a-zA-Z0-9]/g, '_')}_${new Date().toISOString().split('T')[0]}.xlsx`;
        XLSX.writeFile(wb, fileName);
        toast.success('File Excel berhasil diunduh! Cek folder Downloads Anda.');
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
                                        onClick={generateCapitalExcel}
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