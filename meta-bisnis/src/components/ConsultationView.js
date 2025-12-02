"use client";

import { useRef, useState } from "react";
import {
  registerWithEmail,
  loginWithEmail,
  loginWithGoogle,
  resendVerificationEmail,
} from "@/lib/auth";

// Terima props baru: user, onLogin, onLogout
export default function ConsultationView({ onSetupBusiness, businessData, loading, user, onLogin, onLogout }) {
  const inputRef = useRef(null);
  const [showRecommendation, setShowRecommendation] = useState(false);
  // Auth form state
  const [showAuthForm, setShowAuthForm] = useState(false);
  const [authMode, setAuthMode] = useState("register"); // or 'login'
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showResendOption, setShowResendOption] = useState(false);
  const [attemptedEmail, setAttemptedEmail] = useState("");
  const [attemptedPassword, setAttemptedPassword] = useState("");
  const [resendRemaining, setResendRemaining] = useState(0);
  const resendTimerRef = useRef(null);

  const handleConsultAI = async () => {
    const input = inputRef.current?.value;
    if (!input) {
      alert('Mohon isi ide atau kondisi Anda terlebih dahulu.');
      return;
    }
    // Panggil parent function
    await onSetupBusiness(input);
    setShowRecommendation(true);
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
    try {
      await registerWithEmail(email, password);
      alert("Pendaftaran berhasil. Cek inbox Anda untuk link verifikasi email sebelum login.");
      setShowAuthForm(false);
      setEmail("");
      setPassword("");
    } catch (error) {
      console.error("Register Error:", error);
      alert(error.message || "Gagal mendaftar.");
    }
  };

  const handleLoginEmail = async (e) => {
    e.preventDefault();
    try {
      await loginWithEmail(email, password);
      alert("Login berhasil.");
      setShowAuthForm(false);
      setEmail("");
      setPassword("");
    } catch (error) {
      console.error("Login Error:", error);
      const msg = (error && error.message) ? error.message : "Gagal login.";
      alert(msg);

      // Jika error karena belum verifikasi, tawarkan resend
      if (msg.toLowerCase().includes('belum terverifikasi')) {
        setShowResendOption(true);
        setAttemptedEmail(email);
        setAttemptedPassword(password);
      }
    }
  };

  const handleLoginWithGoogle = async () => {
    try {
      await loginWithGoogle();
      setShowAuthForm(false);
    } catch (error) {
      console.error("Google Login Error:", error);
      alert(error.message || "Gagal login dengan Google.");
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
      alert('Email verifikasi telah dikirim ulang. Periksa inbox Anda.');
      startResendCooldown(30);
      setShowResendOption(false);
    } catch (err) {
      console.error('Resend error:', err);
      alert(err.message || 'Gagal mengirim ulang verifikasi.');
    }
  };

  return (
    <div className="min-h-screen flex flex-col">
      {/* Navbar Sederhana */}
      <nav className="w-full py-4 px-6 flex justify-between items-center bg-white shadow-sm">
        <div className="font-bold text-xl flex items-center gap-2">
          <i className="fas fa-robot text-blue-600"></i> UMKM Pintar AI
        </div>
        {/* LOGIC TOMBOL LOGIN/LOGOUT */}
        <div className="relative">
          {user ? (
          <div className="flex items-center gap-3">
            <span className="text-sm text-slate-600 hidden md:block">Halo, {user.displayName}</span>
            <img 
              src={user.photoURL} 
              alt="Profile" 
              className="w-8 h-8 rounded-full border border-blue-200"
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
                onClick={() => setShowAuthForm((s) => !s)}
                className="text-sm bg-blue-50 text-blue-600 px-4 py-2 rounded-lg hover:bg-blue-100 font-medium transition"
              >
                <i className="fab fa-google mr-2"></i> Masuk / Daftar
              </button>

              {/* Simple dropdown auth form */}
              {showAuthForm && (
                <div className="absolute right-0 mt-3 w-80 bg-white border border-slate-100 rounded-lg shadow-lg p-4 z-50">
                  <div className="flex items-center justify-between mb-3">
                    <div className="text-sm font-semibold">Masuk / Daftar</div>
                    <div className="text-xs text-slate-500">Pilih metode</div>
                  </div>

                  <div className="space-y-2">
                    <button
                      onClick={handleLoginWithGoogle}
                      className="w-full flex items-center justify-center gap-2 border border-slate-200 rounded-md py-2 text-sm hover:bg-slate-50"
                    >
                      <i className="fab fa-google"></i>
                      Masuk dengan Google
                    </button>

                    <div className="text-center text-xs text-slate-400">— atau —</div>

                    <div className="flex gap-2">
                      <button
                        onClick={() => setAuthMode("login")}
                        className={`flex-1 py-1 rounded-md text-sm ${authMode === "login" ? "bg-slate-100" : "bg-transparent"}`}
                      >
                        Email Login
                      </button>
                      <button
                        onClick={() => setAuthMode("register")}
                        className={`flex-1 py-1 rounded-md text-sm ${authMode === "register" ? "bg-slate-100" : "bg-transparent"}`}
                      >
                        Daftar
                      </button>
                    </div>

                    <form onSubmit={authMode === "register" ? handleRegister : handleLoginEmail}>
                      <input
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="Email"
                        required
                        className="w-full px-3 py-2 border border-slate-200 rounded-md text-sm"
                      />
                      <input
                        type="password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        placeholder="Password"
                        required
                        minLength={6}
                        className="w-full mt-2 px-3 py-2 border border-slate-200 rounded-md text-sm"
                      />

                      <div className="mt-3 flex gap-2">
                        <button
                          type="submit"
                          className="flex-1 bg-blue-600 text-white py-2 rounded-md text-sm"
                        >
                          {authMode === "register" ? "Daftar" : "Masuk"}
                        </button>
                        <button
                          type="button"
                          onClick={() => { setShowAuthForm(false); setEmail(""); setPassword(""); }}
                          className="flex-1 border border-slate-200 py-2 rounded-md text-sm"
                        >
                          Batal
                        </button>
                      </div>
                      {/* Resend option for users who attempted login but haven't verified */}
                      {authMode === 'login' && showResendOption && (
                        <div className="mt-3 text-center">
                          <p className="text-xs text-slate-500 mb-2">Email belum terverifikasi? Kirim ulang verifikasi.</p>
                          <button
                            type="button"
                            onClick={handleResendVerification}
                            disabled={resendRemaining > 0}
                            className={`px-3 py-2 rounded-md text-sm ${resendRemaining > 0 ? 'bg-slate-200 text-slate-500' : 'bg-yellow-500 text-white'}`}
                          >
                            {resendRemaining > 0 ? `Kirim ulang (${resendRemaining}s)` : 'Kirim Ulang Verifikasi'}
                          </button>
                        </div>
                      )}
                    </form>
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
                      Rekomendasi Utama
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
                    <p className="text-slate-700 font-bold">{businessData.target_market}</p>
                  </div>
                  <div className="bg-slate-50 p-4 rounded-xl border border-slate-100">
                    <i className="fas fa-exclamation-triangle text-orange-500 mb-2 block"></i>
                    <h4 className="font-semibold text-sm">Tantangan Utama</h4>
                    <p className="text-xs text-slate-600">{businessData.challenge}</p>
                  </div>
                </div>

                <div className="flex justify-end gap-3">
                  <button
                    onClick={handleNewSearch}
                    className="px-4 py-2 text-slate-500 hover:text-slate-700 font-medium"
                  >
                    Cari Lain
                  </button>
                  <button
                    onClick={() => onSetupBusiness(null, true)}
                    className="bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-2 rounded-lg font-semibold shadow-lg transition-all"
                  >
                    <i className="fas fa-rocket mr-2"></i> 
                    {user ? 'Jalankan Bisnis Ini' : 'Login untuk Mulai'}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
