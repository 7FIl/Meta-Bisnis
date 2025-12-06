"use client";

import { useRef, useState, useEffect } from "react";
import { useRouter, useSearchParams } from 'next/navigation';
import { applyActionCode } from 'firebase/auth';
import { auth } from '@/lib/firebase';
import Image from "next/image";
import * as XLSX from 'xlsx';
import {
  registerWithEmail,
  loginWithEmail,
  loginWithGoogle,
  resendVerificationEmail,
} from "@/lib/auth";
import { useToast } from "./Toast";

// Terima props baru: user, onLogin, onLogout
export default function ConsultationView({ onSetupBusiness, businessData, loading, user, onLogin, onLogout }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const toast = useToast();
  const inputRef = useRef(null);
  const [showRecommendation, setShowRecommendation] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [showAuthForm, setShowAuthForm] = useState(false);
  const [showMethodSelection, setShowMethodSelection] = useState(false);
  const [showRegisterForm, setShowRegisterForm] = useState(false);
  const [authMode, setAuthMode] = useState("register"); // or 'login'
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [name, setName] = useState("");
  const [showLoginPassword, setShowLoginPassword] = useState(false);
  const [showRegisterPassword, setShowRegisterPassword] = useState(false);
  const [showConfirmPasswordField, setShowConfirmPasswordField] = useState(false);
  const [showResendOption, setShowResendOption] = useState(false);
  const [attemptedEmail, setAttemptedEmail] = useState("");
  const [attemptedPassword, setAttemptedPassword] = useState("");
  const [resendRemaining, setResendRemaining] = useState(0);
  const resendTimerRef = useRef(null);

  const handleConsultAI = async () => {
    const input = inputRef.current?.value;
    if (!input) {
      toast.warning('Mohon isi ide atau kondisi Anda terlebih dahulu.');
      return;
    }
    // Panggil parent function
    await onSetupBusiness(input);
    setShowRecommendation(true);
  };

  // Generate Excel with detailed capital breakdown and financial metrics
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
    
    // Format bold untuk header dan total
    const range = XLSX.utils.decode_range(ws1['!ref']);
    for (let C = range.s.c; C <= range.e.c; ++C) {
      const headerCell = XLSX.utils.encode_cell({ r: 5, c: C });
      if (ws1[headerCell]) {
        ws1[headerCell].s = { font: { bold: true }, fill: { fgColor: { rgb: "E0E0E0" } } };
      }
    }
    
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

  const handleNewSearch = () => {
    if (inputRef.current) {
      inputRef.current.value = '';
    }
    setShowRecommendation(false);
  };

  // --- AUTH HANDLERS ---
  const handleRegister = async (e) => {
    e.preventDefault();
    // Validate confirm password locally before attempting registration
    if (password !== confirmPassword) {
      toast.error('Password konfirmasi tidak cocok. Mohon periksa kembali.');
      return;
    }
    try {
      await registerWithEmail(email, password);
      // Redirect user to verification page and prefill email
      setShowRegisterForm(false);
      try {
        router.push(`/verify?email=${encodeURIComponent(email)}`);
      } catch (e) {
        // fallback: show toast
        toast.success("Pendaftaran berhasil. Cek inbox Anda untuk kode verifikasi sebelum login.");
      }
      setEmail("");
      setPassword("");
    } catch (error) {
      console.error("Register Error:", error);
      toast.error(error.message || "Gagal mendaftar.");
    }
  };

  // Auto-open register modal when redirected after failed verification
  useEffect(() => {
    try {
      const needRe = searchParams?.get('needReRegister');
      const e = searchParams?.get('email');
      if (needRe) {
        setShowRegisterForm(true);
        if (e) setEmail(e);
      }
    } catch (e) {
      // ignore
    }
  }, [searchParams]);

  // Auto-open login modal when redirected after successful verification
  useEffect(() => {
    try {
      const openLogin = searchParams?.get('openLogin');
      const e = searchParams?.get('email');
      if (openLogin === '1') {
        if (e) setEmail(e);
        setShowAuthForm(true);
        setShowResendOption(false);
      }
    } catch (err) {
      // ignore
    }
  }, [searchParams]);

  // Handle Firebase oobCode when verification redirect uses continueUrl -> root
  useEffect(() => {
    try {
      const oobCode = searchParams?.get('oobCode');
      if (oobCode) {
        (async () => {
          try {
            toast.info('Memverifikasi email...');
            await applyActionCode(auth, oobCode);
            toast.success('Verifikasi berhasil. Silakan masuk untuk melanjutkan.');
            // After applying the action code, keep the app on root and open the login modal.
            // Preserve the email query param if present so the login form is prefilled.
            try {
              const prefill = searchParams?.get('email');
              const qs = new URLSearchParams();
              qs.set('openLogin', '1');
              if (prefill) qs.set('email', prefill);
              router.replace('/?' + qs.toString());
            } catch (e) {
              try { router.replace('/'); } catch (ee) { /* ignore */ }
            }
          } catch (err) {
            console.error('Verifikasi gagal di root:', err);
            toast.error(err?.message || 'Gagal memverifikasi email.');
            try { router.replace('/'); } catch (e) { /* ignore */ }
          }
        })();
      }
    } catch (err) {
      // ignore
    }
  }, [searchParams]);

  const handleLoginEmail = async (e) => {
    e.preventDefault();
    try {
      await loginWithEmail(email, password);
      toast.success("Login berhasil.");
      setShowAuthForm(false);
      setEmail("");
      setPassword("");
    } catch (error) {
      console.error("Login Error:", error);
      const msg = (error && error.message) ? error.message : "Gagal login.";
      const code = (error && error.code) ? error.code : '';

      // Jika error karena belum verifikasi, jangan tunjukkan toast error umum —
      // tampilkan inline peringatan (showResendOption) agar user tahu harus verifikasi dulu.
      if (code === 'auth/email-not-verified' || msg.toLowerCase().includes('belum terverifikasi')) {
        setShowResendOption(true);
        setAttemptedEmail(email);
        setAttemptedPassword(password);
        // Also show a subtle toast info (optional)
        toast.info('Silakan verifikasi email Anda terlebih dahulu sebelum login. Jika perlu, kirim ulang link verifikasi.');
        return;
      }

      // Other errors: show toast
      toast.error(msg);
    }
  };

  const handleLoginWithGoogle = async () => {
    try {
      await loginWithGoogle();
      setShowAuthForm(false);
    } catch (error) {
      console.error("Google Login Error:", error);
      toast.error(error.message || "Gagal login dengan Google.");
    }
  };

  const startResendCooldown = (seconds = 30) => {
    setResendRemaining(seconds);
    if (resendTimerRef.current) clearInterval(resendTimerRef.current);
    resendTimerRef.current = setInterval(() => {
      setResendRemaining((s) => {
        if (s <= 1) {
          clearInterval(resendTimerRef.current);
          resendTimerRef.current = null;
          return 0;
        }
        return s - 1;
      });
    }, 1000);
  };

  const handleResendVerification = async () => {
    try {
      await resendVerificationEmail({ email: attemptedEmail, password: attemptedPassword });
      toast.success('Email verifikasi telah dikirim ulang. Periksa inbox Anda.');
      startResendCooldown(30);
      setShowResendOption(false);
    } catch (err) {
      console.error('Resend error:', err);
      toast.error(err.message || 'Gagal mengirim ulang verifikasi.');
    }
  };

  return (
    <div className="min-h-screen flex flex-col">
      {/* Navbar Sederhana */}
      <nav className="w-full py-4 px-6 flex justify-between items-center bg-white shadow-sm">
        <div className="font-bold text-xl flex items-center gap-2">
          <i className="fas fa-robot text-blue-600"></i> META BISNIS
        </div>
        {/* LOGIC TOMBOL LOGIN/LOGOUT */}
        <div className="relative">
          {user ? (
          <div className="flex items-center gap-3">
            <span className="text-sm text-slate-600 hidden md:block">Halo, {user.displayName}</span>
            <Image
              src={user.photoURL}
              alt="Profile"
              width={32}
              height={32}
              className="rounded-full border border-blue-200"
            />
            <button 
              onClick={onLogout}
              className="text-sm text-red-500 hover:text-red-700 font-medium"
            >
              Keluar
            </button>
          </div>
          ) : (
            <>
              <button
                onClick={() => setShowAuthForm(true)}
                className="text-sm bg-slate-800 hover:bg-slate-900 text-white px-4 py-2 rounded-lg font-medium transition"
              >
                <i className="fas fa-sign-in-alt mr-2"></i> Masuk
              </button>

              {/* Email/Password Auth Modal */}
              {showAuthForm && (
                <div
                  className="fixed inset-0 bg-black bg-opacity-30 flex items-center justify-center z-50 p-4"
                  onClick={() => {
                    setShowAuthForm(false);
                    setEmail("");
                    setPassword("");
                    setShowResendOption(false);
                  }}
                >
                  <div
                    className="bg-white rounded-2xl shadow-2xl max-w-sm w-full p-8 animate-fade-in"
                    onClick={(e) => e.stopPropagation()}
                  >
                    {/* Close Button */}
                    <button
                      onClick={() => {
                        setShowAuthForm(false);
                        setEmail("");
                        setPassword("");
                        setShowResendOption(false);
                      }}
                      className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 transition"
                    >
                      <i className="fas fa-times text-lg"></i>
                    </button>

                    {/* Header */}
                    <div className="mb-8 text-center">
                      <h1 className="text-2xl font-bold text-slate-900 mb-1">
                        Sign in to META BISNIS
                      </h1>
                    </div>

                    {/* Auth Form */}
                    <form onSubmit={handleLoginEmail} className="space-y-4">
                      {/* Email Field */}
                      <div>
                        <label className="block text-sm font-semibold text-slate-900 mb-2">Email address</label>
                        <input
                          type="email"
                          value={email}
                          onChange={(e) => setEmail(e.target.value)}
                          placeholder="name@example.com"
                          required
                          className="w-full px-4 py-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none text-slate-900 placeholder-slate-400"
                        />
                      </div>

                      {/* Password Field with Forgot Password Link */}
                      <div>
                        <div className="flex items-center justify-between mb-2">
                          <label className="block text-sm font-semibold text-slate-900">Password</label>
                          <a href="#" className="text-xs text-blue-600 hover:text-blue-700 font-medium">
                            Forgot password?
                          </a>
                        </div>
                        <div className="relative">
                          <input
                            type={showLoginPassword ? 'text' : 'password'}
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            placeholder="••••••••"
                            required
                            minLength={6}
                            className="w-full px-4 py-2.5 pr-10 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none text-slate-900 placeholder-slate-400"
                          />
                          <button
                            type="button"
                            onClick={() => setShowLoginPassword((s) => !s)}
                            className="absolute right-3 top-1/4  text-slate-500"
                            aria-label={showLoginPassword ? 'Sembunyikan password' : 'Tampilkan password'}
                          >
                            <i className={`fas ${showLoginPassword ? 'fa-eye' : 'fa-eye-slash'}`}></i>
                          </button>
                        </div>
                      </div>

                      {/* Resend Verification Option */}
                      {showResendOption && (
                        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                          <p className="text-sm text-yellow-900 font-medium mb-3">Email belum diverifikasi</p>
                          <button
                            type="button"
                            onClick={handleResendVerification}
                            disabled={resendRemaining > 0}
                            className={`w-full px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                              resendRemaining > 0
                                ? 'bg-slate-200 text-slate-500 cursor-not-allowed'
                                : 'bg-yellow-500 hover:bg-yellow-600 text-white'
                            }`}
                          >
                            {resendRemaining > 0 ? `Kirim ulang (${resendRemaining}s)` : 'Kirim Ulang Link Verifikasi'}
                          </button>
                        </div>
                      )}

                      {/* Submit Button */}
                      <button
                        type="submit"
                        className="w-full bg-blue-600 hover:bg-blue-700 text-white py-2.5 rounded-lg font-semibold transition-all mt-6"
                      >
                        Sign in
                      </button>
                    </form>

                    {/* Divider */}
                    <div className="relative my-6">
                      <div className="absolute inset-0 flex items-center">
                        <div className="w-full border-t border-slate-200"></div>
                      </div>
                      <div className="relative flex justify-center text-xs">
                        <span className="px-2 bg-white text-slate-500 font-medium">or</span>
                      </div>
                    </div>

                    {/* Continue with Google */}
                    <button
                      type="button"
                      onClick={() => {
                        handleLoginWithGoogle();
                        setShowAuthForm(false);
                      }}
                      className="w-full flex items-center justify-center gap-2 px-4 py-2.5 border border-slate-300 hover:border-slate-400 hover:bg-slate-50 rounded-lg transition-all font-medium text-slate-700"
                    >
                      <i className="fab fa-google"></i>
                      Continue with Google
                    </button>

                    {/* Footer - Sign Up Link */}
                    <div className="text-center pt-6 border-t border-slate-200 mt-6">
                      <p className="text-sm text-slate-600">
                        New to Meta Bisnis?{' '}
                        <button
                          type="button"
                          onClick={() => {
                            setShowAuthForm(false);
                            setShowRegisterForm(true);
                            setEmail("");
                            setPassword("");
                            setConfirmPassword("");
                            setName("");
                          }}
                          className="text-blue-600 hover:text-blue-700 font-semibold"
                        >
                          Create an account
                        </button>
                      </p>
                    </div>

                    {/* Legal Notice */}
                    <p className="text-xs text-slate-500 text-center mt-6">
                      By signing in, you agree to Meta Bisnis&apos;s <a href="#" className="text-blue-600 hover:text-blue-700">Terms of Service</a> and <a href="#" className="text-blue-600 hover:text-blue-700">Privacy Policy</a>.
                    </p>
                  </div>
                </div>
              )}

              {/* Registration Form Modal */}
              {showRegisterForm && (
                <div
                  className="fixed inset-0 bg-black bg-opacity-30 flex items-center justify-center z-50 p-4"
                  onClick={() => {
                    setShowRegisterForm(false);
                    setName("");
                    setEmail("");
                    setPassword("");
                    setConfirmPassword("");
                  }}
                >
                  <div
                    className="bg-white rounded-2xl shadow-2xl max-w-sm w-full max-h-[90vh] overflow-y-auto p-8 animate-fade-in"
                    onClick={(e) => e.stopPropagation()}
                  >
                    {/* Close Button */}
                    <button
                      onClick={() => {
                        setShowRegisterForm(false);
                        setName("");
                        setEmail("");
                        setPassword("");
                        setConfirmPassword("");
                      }}
                      className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 transition"
                    >
                      <i className="fas fa-times text-lg"></i>
                    </button>

                    {/* Header */}
                    <div className="mb-8 text-center">
                      <h1 className="text-2xl font-bold text-slate-900 mb-1">
                        Create your account
                      </h1>
                      <p className="text-sm text-slate-500">Join Meta Bisnis today</p>
                    </div>

                    {/* Registration Form */}
                    <form onSubmit={handleRegister} className="space-y-4">
                      {/* Name Field */}
                      <div>
                        <label className="block text-sm font-semibold text-slate-900 mb-2">Full name</label>
                        <input
                          type="text"
                          value={name}
                          onChange={(e) => setName(e.target.value)}
                          placeholder="John Doe"
                          required
                          className="w-full px-4 py-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none text-slate-900 placeholder-slate-400"
                        />
                      </div>

                      {/* Email Field */}
                      <div>
                        <label className="block text-sm font-semibold text-slate-900 mb-2">Email address</label>
                        <input
                          type="email"
                          value={email}
                          onChange={(e) => setEmail(e.target.value)}
                          placeholder="name@example.com"
                          required
                          className="w-full px-4 py-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none text-slate-900 placeholder-slate-400"
                        />
                      </div>

                      {/* Password Field */}
                      <div>
                        <label className="block text-sm font-semibold text-slate-900 mb-2">Password</label>
                        <div className="relative">
                          <input
                            type={showRegisterPassword ? 'text' : 'password'}
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            placeholder="••••••••"
                            required
                            minLength={6}
                            className="w-full px-4 py-2.5 pr-10 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none text-slate-900 placeholder-slate-400"
                          />
                          <button
                            type="button"
                            onClick={() => setShowRegisterPassword((s) => !s)}
                            className="absolute right-3 top-1/4 text-slate-500"
                            aria-label={showRegisterPassword ? 'Sembunyikan password' : 'Tampilkan password'}
                          >
                            <i className={`fas ${showRegisterPassword ? 'fa-eye' : 'fa-eye-slash'}`}></i>
                          </button>
                        </div>
                        <p className="text-xs text-slate-500 mt-1">At least 6 characters</p>
                      </div>

                      {/* Confirm Password Field */}
                      <div>
                        <label className="block text-sm font-semibold text-slate-900 mb-2">Confirm password</label>
                        <div className="relative">
                          <input
                            type={showConfirmPasswordField ? 'text' : 'password'}
                            value={confirmPassword}
                            onChange={(e) => setConfirmPassword(e.target.value)}
                            placeholder="••••••••"
                            required
                            minLength={6}
                            className="w-full px-4 py-2.5 pr-10 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none text-slate-900 placeholder-slate-400"
                          />
                          <button
                            type="button"
                            onClick={() => setShowConfirmPasswordField((s) => !s)}
                            className="absolute right-3 top-1/4  text-slate-500"
                            aria-label={showConfirmPasswordField ? 'Sembunyikan konfirmasi password' : 'Tampilkan konfirmasi password'}
                          >
                            <i className={`fas ${showConfirmPasswordField ? 'fa-eye' : 'fa-eye-slash'}`}></i>
                          </button>
                        </div>
                      </div>

                      {/* Submit Button */}
                      <button
                        type="submit"
                        className="w-full bg-blue-600 hover:bg-blue-700 text-white py-2.5 rounded-lg font-semibold transition-all mt-6"
                      >
                        Create account
                      </button>
                    </form>

                    {/* Divider */}
                    <div className="relative my-6">
                      <div className="absolute inset-0 flex items-center">
                        <div className="w-full border-t border-slate-200"></div>
                      </div>
                      <div className="relative flex justify-center text-xs">
                        <span className="px-2 bg-white text-slate-500 font-medium">or</span>
                      </div>
                    </div>

                    {/* Continue with Google */}
                    <button
                      type="button"
                      onClick={() => {
                        handleLoginWithGoogle();
                        setShowRegisterForm(false);
                      }}
                      className="w-full flex items-center justify-center gap-2 px-4 py-2.5 border border-slate-300 hover:border-slate-400 hover:bg-slate-50 rounded-lg transition-all font-medium text-slate-700"
                    >
                      <i className="fab fa-google"></i>
                      Continue with Google
                    </button>

                    {/* Footer - Sign In Link */}
                    <div className="text-center pt-6 border-t border-slate-200 mt-6">
                      <p className="text-sm text-slate-600">
                        Already have an account?{' '}
                        <button
                          type="button"
                          onClick={() => {
                            setShowRegisterForm(false);
                            setShowAuthForm(true);
                            setName("");
                            setEmail("");
                            setPassword("");
                            setConfirmPassword("");
                          }}
                          className="text-blue-600 hover:text-blue-700 font-semibold"
                        >
                          Sign in
                        </button>
                      </p>
                    </div>

                    {/* Legal Notice */}
                    <p className="text-xs text-slate-500 text-center mt-6">
                      By creating an account, you agree to Meta Bisnis&apos;s <a href="#" className="text-blue-600 hover:text-blue-700">Terms of Service</a> and <a href="#" className="text-blue-600 hover:text-blue-700">Privacy Policy</a>.
                    </p>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </nav>

      {/* Hero Section */}
      <main className="flex-grow flex flex-col items-center justify-center px-4 py-10 text-center relative overflow-hidden">
        {/* Background Decoration */}
        <div className="absolute top-0 left-0 w-64 h-64 bg-blue-200 rounded-full mix-blend-multiply filter blur-3xl opacity-30 animate-blob"></div>
        <div className="absolute top-0 right-0 w-64 h-64 bg-purple-200 rounded-full mix-blend-multiply filter blur-3xl opacity-30 animate-blob animation-delay-2000"></div>

        <h1 className="text-4xl md:text-5xl font-extrabold mb-6 tracking-tight relative z-10">
          Bingung Mau Bisnis Apa?
          <br />
          <span className="gradient-text">Tanya AI, Mulai Sekarang.</span>
        </h1>
        <p className="text-lg text-slate-600 max-w-2xl mb-8 relative z-10">
          Ceritakan modal, lokasi, atau minat Anda. Kami akan carikan peluang
          bisnis paling cuan berdasarkan data tren pasar terkini.
        </p>

        {/* Input Konsultasi */}
        <div className="w-full max-w-xl bg-white p-2 rounded-2xl shadow-xl border border-slate-100 flex flex-col md:flex-row gap-2 relative z-10">
          <input
            ref={inputRef}
            type="text"
            placeholder="Cth: Saya punya modal 1 juta, suka masak, lokasi di dekat kampus..."
            className="flex-grow px-4 py-3 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-100 text-slate-700"
          />
          <button
            onClick={handleConsultAI}
            disabled={loading}
            className="bg-blue-600 hover:bg-blue-700 disabled:bg-slate-400 text-white font-semibold py-3 px-6 rounded-xl transition-all flex items-center justify-center gap-2"
          >
            <i className={`fas ${loading ? 'fa-spinner fa-spin' : 'fa-magic'}`}></i>
            {loading ? 'Mencari...' : 'Cari Ide'}
          </button>
        </div>

        {/* Loading Indicator */}
        {loading && (
          <div className="mt-8 flex flex-col items-center animate-fade-in">
            <div className="w-10 h-10 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin"></div>
            <p className="mt-3 text-sm text-slate-500 font-medium">
              Menganalisis tren pasar & kompetitor...
            </p>
          </div>
        )}

        {/* Hasil Rekomendasi (Card) */}
        {showRecommendation && businessData && !loading && (
          <div className="mt-10 w-full max-w-3xl animate-fade-in">
            <div className="bg-white rounded-2xl shadow-lg border border-slate-200 overflow-hidden">
              <div className="bg-gradient-to-r from-blue-50 to-indigo-50 p-6 border-b border-slate-100">
                <div className="flex justify-between items-start">
                  <div>
                    <span className="bg-blue-100 text-blue-700 text-xs font-bold px-2 py-1 rounded uppercase tracking-wide">
                      Rekomendasi Bisnis
                    </span>
                    <h2 className="text-2xl font-bold mt-2 text-slate-800">
                      {businessData.name}
                    </h2>
                  </div>
                  <div className="text-right">
                    <p className="text-sm text-slate-500">Potensi Pasar</p>
                    <div className="flex text-yellow-400 text-sm justify-end">
                      <i className="fas fa-star"></i>
                      <i className="fas fa-star"></i>
                      <i className="fas fa-star"></i>
                      <i className="fas fa-star"></i>
                      <i className="fas fa-star-half-alt"></i>
                    </div>
                  </div>
                </div>
              </div>
              <div className="p-6">
                <p className="text-slate-600 mb-6 leading-relaxed">
                  {businessData.description}
                </p>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                  <div className="bg-slate-50 p-4 rounded-xl border border-slate-100">
                    <i className="fas fa-wallet text-green-500 mb-2 block"></i>
                    <h4 className="font-semibold text-sm">Estimasi Modal</h4>
                    <p className="text-slate-700 font-bold">{businessData.capital_est}</p>
                  </div>
                  <div className="bg-slate-50 p-4 rounded-xl border border-slate-100">
                    <i className="fas fa-chart-line text-blue-500 mb-2 block"></i>
                    <h4 className="font-semibold text-sm">Target Pasar</h4>
                    <p className="text-slate-600 mb-7">{businessData.target_market}</p>
                  </div>
                  <div className="bg-slate-50 p-4 rounded-xl border border-slate-100">
                    <i className="fas fa-exclamation-triangle text-orange-500 mb-2 block"></i>
                    <h4 className="font-semibold text-sm">Tantangan Utama</h4>
                    <p className="text-slate-600 mb-7">{businessData.challenge}</p>
                  </div>
                </div>

                <div className="flex justify-between items-center gap-3">
                  <button
                    onClick={generateCapitalExcel}
                    className="px-4 py-2 bg-green-50 text-green-700 hover:bg-green-100 border border-green-200 rounded-lg font-medium transition-all flex items-center gap-2"
                    title="Download rincian modal lengkap dalam format Excel"
                  >
                    <i className="fas fa-file-excel"></i> Download Rincian Modal (Excel)
                  </button>
                  <div className="flex gap-3">
                    <button
                      onClick={handleNewSearch}
                      className="px-4 py-2 text-slate-500 hover:text-slate-700 font-medium"
                    >
                      Cari Lain
                    </button>
                    <button
                      onClick={() => {
                        if (user) {
                          onSetupBusiness(null, true);
                        } else {
                          // Tampilkan form create account terlebih dahulu
                          setShowAuthForm(false);
                          setShowRegisterForm(true);
                        }
                      }}
                      className="bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-2 rounded-lg font-semibold shadow-lg transition-all"
                    >
                      <i className="fas fa-rocket mr-2"></i> 
                      {user ? 'Jalankan Bisnis Ini' : 'Buat Akun untuk Mulai'}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
