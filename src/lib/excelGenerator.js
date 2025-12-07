// src/lib/excelGenerator.js
// Excel generation utilities untuk laporan bisnis dan analisis keuangan
import * as XLSX from 'xlsx';

/**
 * Parse capital range dari string seperti "60 juta - 75 juta" atau "60,000,000 - 75,000,000"
 * @private
 */
const _parseCapitalRange = (rangeStr) => {
  if (!rangeStr) return { min: 0, max: 0 };
  
  try {
    // Ekstrak semua angka dari string (termasuk desimal dengan koma/titik)
    const cleanStr = rangeStr.toLowerCase().replace(/\./g, '').replace(/,/g, '.');
    const numbers = cleanStr.match(/(\d+(?:\.\d+)?)/g);
    
    if (!numbers || numbers.length < 2) return { min: 0, max: 0 };
    
    let min = parseFloat(numbers[0]);
    let max = parseFloat(numbers[1]);
    
    // Deteksi unit (ribu, juta, miliar)
    if (cleanStr.includes('ribu') || cleanStr.includes('rb')) {
      if (min < 100000) min *= 1000;
      if (max < 100000) max *= 1000;
    } else if (cleanStr.includes('juta') || cleanStr.includes('jt')) {
      if (min < 100000) min *= 1000000;
      if (max < 100000) max *= 1000000;
    } else if (cleanStr.includes('miliar') || cleanStr.includes('milyar')) {
      if (min < 100000) min *= 1000000000;
      if (max < 100000) max *= 1000000000;
    }
    
    return { min: Math.round(min), max: Math.round(max) };
  } catch (e) {
    console.error('Error parsing capital range:', e);
    return { min: 0, max: 0 };
  }
};

/**
 * Validasi total modal - TIDAK mengubah angka, hanya memvalidasi
 * @private
 */
const _validateAndAdjustModal = (totalModal, rangeStr) => {
  const { min, max } = _parseCapitalRange(rangeStr);
  
  // Jika tidak ada range yang valid, kembalikan total asli
  if (min === 0 && max === 0) return totalModal;
  
  let adjusted = totalModal;
  
  if (totalModal > max && max > 0) {
    console.warn(`[Excel] Total modal Rp ${totalModal.toLocaleString('id-ID')} melebihi batas atas ${rangeStr} — dipotong ke Rp ${max.toLocaleString('id-ID')}`);
    adjusted = max;
  } else if (totalModal < min && min > 0) {
    console.warn(`[Excel] Total modal Rp ${totalModal.toLocaleString('id-ID')} di bawah batas bawah ${rangeStr}`);
    adjusted = Math.max(totalModal, min); // tetap naikkan ke minimal jika ingin konservatif
  }
  
  return adjusted;
};

/**
 * Generate Excel file dengan rincian modal dan analisis keuangan
 * @param {Object} businessData - Data bisnis dari AI atau form manual
 * @param {Function} onSuccess - Callback ketika file berhasil di-download
 */
export const generateCapitalExcel = (businessData, onSuccess) => {
  if (!businessData) return;

  try {
    // Create workbook
    const wb = XLSX.utils.book_new();

    // Sheet 1: Capital Breakdown (Items)
    const capitalItems = (businessData.capitalBreakdown || []).filter(item => {
      // Filter out invalid items dengan harga 0 atau NaN
      return item && item.item && (item.total || 0) > 0;
    });

    // Jika tidak ada item yang valid, tampilkan pesan
    if (capitalItems.length === 0) {
      capitalItems.push({
        item: 'Estimasi modal tidak tersedia. Silakan konsultasikan kembali dengan AI.',
        quantity: '-',
        unit: '-',
        price: 0,
        total: 0
      });
    }

    let totalModal = capitalItems.reduce((sum, item) => {
      const itemTotal = parseFloat(item.total) || 0;
      // Validasi bahwa item total adalah angka valid
      return sum + (isNaN(itemTotal) ? 0 : itemTotal);
    }, 0);

    console.log('[Excel] Total modal dari items:', totalModal, 'Range estimasi:', businessData.capital_est);

    // Validasi bahwa total modal sesuai dengan range estimasi dari AI (TIDAK mengubah)
    totalModal = _validateAndAdjustModal(totalModal, businessData.capital_est);

    console.log('[Excel] Total modal setelah validasi:', totalModal);

    const capitalData = [
      ['RINCIAN ESTIMASI MODAL USAHA'],
      ['Nama Bisnis:', businessData.name || '-'],
      ['Jenis Bisnis:', businessData.businessType || '-'],
      ['Tanggal:', new Date().toLocaleDateString('id-ID', { year: 'numeric', month: 'long', day: 'numeric' })],
      ['Estimasi Range:', businessData.capital_est || '-'],
      [],
      ['No', 'Item / Barang', 'Jumlah', 'Satuan', 'Harga Satuan (Rp)', 'Total (Rp)'],
      ...capitalItems.map((item, idx) => {
        const price = parseFloat(item.price) || 0;
        const total = parseFloat(item.total) || 0;
        return [
          idx + 1,
          item.item || '-',
          item.quantity || '-',
          item.unit || '-',
          price > 0 ? price.toLocaleString('id-ID') : '-',
          total > 0 ? total.toLocaleString('id-ID') : '-'
        ];
      }),
      [],
      ['', 'TOTAL MODAL YANG DIBUTUHKAN', '', '', '', 'Rp ' + totalModal.toLocaleString('id-ID')],
      [],
      ['CATATAN:'],
      ['- Harga dapat berubah sesuai kondisi pasar dan lokasi'],
      ['- Sebaiknya tambahkan buffer 10-20% untuk biaya tak terduga'],
      ['- Konsultasikan dengan supplier lokal untuk harga terkini'],
    ];

    const ws1 = XLSX.utils.aoa_to_sheet(capitalData);
    ws1['!cols'] = [{ wch: 5 }, { wch: 35 }, { wch: 10 }, { wch: 10 }, { wch: 20 }, { wch: 20 }];
    XLSX.utils.book_append_sheet(wb, ws1, 'Rincian Modal');

    // Sheet 2: Financial Metrics (hanya jika ada data yang valid)
    const metrics = businessData.financialMetrics || {};
    const hasValidMetrics = metrics.monthly_revenue_estimate && metrics.monthly_revenue_estimate > 0 &&
                            metrics.monthly_cost_estimate && metrics.monthly_cost_estimate > 0;
    
    if (hasValidMetrics) {
      const metricsData = _generateFinancialMetricsSheet(businessData, totalModal, metrics);
      const ws2 = XLSX.utils.aoa_to_sheet(metricsData);
      ws2['!cols'] = [{ wch: 25 }, { wch: 20 }, { wch: 20 }, { wch: 20 }, { wch: 20 }];
      XLSX.utils.book_append_sheet(wb, ws2, 'Analisis Keuangan');
    } else {
      // Sheet 2: Summary (jika data metrics tidak lengkap)
      const summaryData = _generateSummarySheet(businessData, totalModal, metrics);
      const ws2 = XLSX.utils.aoa_to_sheet(summaryData);
      ws2['!cols'] = [{ wch: 40 }, { wch: 30 }];
      XLSX.utils.book_append_sheet(wb, ws2, 'Ringkasan');
    }

    // Download file
    const fileName = `Analisis_Bisnis_${(businessData.name || 'UMKM').replace(/[^a-zA-Z0-9]/g, '_')}_${new Date().toISOString().split('T')[0]}.xlsx`;
    XLSX.writeFile(wb, fileName);

    if (onSuccess) {
      onSuccess('File Excel berhasil diunduh! Cek folder Downloads Anda.');
    }
  } catch (error) {
    console.error('Error generating Excel:', error);
    throw error;
  }
};

/**
 * Generate summary sheet ketika metrics tidak lengkap
 * @private
 */
const _generateSummarySheet = (businessData, totalModal, metrics) => {
  const summaryData = [
    ['RINGKASAN BISNIS'],
    ['Nama Bisnis:', businessData.name || '-'],
    ['Jenis Bisnis:', businessData.businessType || '-'],
    ['Deskripsi:', businessData.description || '-'],
    [],
    ['═══════════════════════════════════════════════════'],
    ['ESTIMASI MODAL'],
    ['═══════════════════════════════════════════════════'],
    ['Range Estimasi:', businessData.capital_est || '-'],
    ['Total Modal Dibutuhkan:', 'Rp ' + totalModal.toLocaleString('id-ID')],
    [],
    ['═══════════════════════════════════════════════════'],
    ['KEUNGGULAN KOMPETITIF'],
    ['═══════════════════════════════════════════════════'],
    ['Keunggulan:', businessData.advantage || '-'],
    [],
    ['═══════════════════════════════════════════════════'],
    ['TANTANGAN'],
    ['═══════════════════════════════════════════════════'],
    ['Tantangan:', businessData.challenge || '-'],
    [],
    ['═══════════════════════════════════════════════════'],
    ['CATATAN PENTING'],
    ['═══════════════════════════════════════════════════'],
    ['1. Estimasi modal di atas adalah perkiraan berdasarkan kondisi pasar umum.'],
    ['2. Harga actual dapat berbeda tergantung lokasi geografis dan supplier yang dipilih.'],
    ['3. Tambahkan buffer 10-20% untuk biaya yang tidak terduga.'],
    ['4. Konsultasikan dengan mentor bisnis lokal sebelum memulai.'],
    [],
    ['DISCLAIMER:'],
    ['Data ini adalah estimasi berdasarkan analisis AI dan kondisi pasar umum.'],
    ['Hasil aktual dapat berbeda tergantung lokasi, manajemen, dan kondisi pasar.'],
    ['Lakukan riset pasar dan konsultasi dengan mentor bisnis sebelum memulai.'],
  ];
  
  return summaryData;
};

/**
 * Generate financial metrics sheet data (hanya ketika data lengkap)
 * @private
 */
const _generateFinancialMetricsSheet = (businessData, totalModal, metrics) => {
  // Validasi dan bersihkan metrics
  const monthlyRevenue = metrics.monthly_revenue_estimate || 0;
  const monthlyCost = metrics.monthly_cost_estimate || 0;
  
  // Jika data tidak valid, skip financial metrics
  if (!monthlyRevenue || !monthlyCost || monthlyRevenue <= 0 || monthlyCost <= 0) {
    return [];
  }

  const monthlyProfit = monthlyRevenue - monthlyCost;
  const yearlyProfit = monthlyProfit * 12;
  const actualROI = totalModal > 0 ? ((yearlyProfit / totalModal) * 100).toFixed(2) : 0;
  const paybackMonths = monthlyProfit > 0 ? Math.ceil(totalModal / monthlyProfit) : 'N/A';

  const metricsData = [
    ['ANALISIS KEUANGAN'],
    ['Nama Bisnis:', businessData.name || '-'],
    ['Jenis Bisnis:', businessData.businessType || '-'],
    ['Total Modal:', 'Rp ' + totalModal.toLocaleString('id-ID')],
    ['Tanggal Analisis:', new Date().toLocaleDateString('id-ID')],
    [],
    ['═══════════════════════════════════════════════════'],
    ['1. BREAK EVEN POINT (BEP)'],
    ['═══════════════════════════════════════════════════'],
    ['Target Unit untuk BEP:', (metrics.bep_units || 'N/A') + ' unit'],
    ['Target Pendapatan BEP:', 'Rp ' + ((metrics.bep_revenue || 0) > 0 ? metrics.bep_revenue.toLocaleString('id-ID') : 'N/A')],
    ['Estimasi Waktu Mencapai BEP:', (paybackMonths !== 'N/A' ? paybackMonths + ' bulan' : 'N/A')],
    [],
    ['═══════════════════════════════════════════════════'],
    ['2. RETURN ON INVESTMENT (ROI)'],
    ['═══════════════════════════════════════════════════'],
    ['ROI Tahunan:', (actualROI || 0) + '%'],
    ['Waktu Balik Modal:', (paybackMonths !== 'N/A' ? paybackMonths + ' bulan' : 'N/A')],
    ['Modal Awal:', 'Rp ' + totalModal.toLocaleString('id-ID')],
    ['Profit Tahunan (Proyeksi):', 'Rp ' + Math.round(yearlyProfit).toLocaleString('id-ID')],
    [],
    ['═══════════════════════════════════════════════════'],
    ['3. PROYEKSI PENDAPATAN & BIAYA BULANAN'],
    ['═══════════════════════════════════════════════════'],
    ['Pendapatan Bulanan:', 'Rp ' + Math.round(monthlyRevenue).toLocaleString('id-ID')],
    ['Biaya Bulanan:', 'Rp ' + Math.round(monthlyCost).toLocaleString('id-ID')],
    ['Profit Bulanan:', 'Rp ' + Math.round(monthlyProfit).toLocaleString('id-ID')],
    ['Margin Keuntungan:', ((monthlyProfit / monthlyRevenue) * 100).toFixed(2) + '%'],
    [],
    ['═══════════════════════════════════════════════════'],
    ['CATATAN & DISCLAIMER'],
    ['═══════════════════════════════════════════════════'],
    ['1. ROI > 20%: Sangat baik untuk bisnis UMKM'],
    ['2. ROI 15-20%: Baik dan layak dijalankan'],
    ['3. ROI < 15%: Perlu evaluasi ulang strategi'],
    [],
    ['DISCLAIMER:'],
    ['Data ini adalah estimasi berdasarkan analisis AI dan kondisi pasar umum.'],
    ['Hasil aktual dapat berbeda tergantung lokasi, manajemen, dan kondisi pasar.'],
    ['Lakukan riset pasar dan konsultasi dengan mentor bisnis sebelum memulai.'],
  ];

  return metricsData;
};
