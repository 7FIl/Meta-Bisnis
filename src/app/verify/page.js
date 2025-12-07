"use client";

import { useEffect, useState, useRef, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { applyActionCode } from "firebase/auth";
import { auth } from "@/lib/firebase";
import { resendVerificationEmail } from "@/lib/auth";

function VerifyEmailPageInner() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const [status, setStatus] = useState("idle");
  const [message, setMessage] = useState("");
  const [email, setEmail] = useState("");
  const [resendRemaining, setResendRemaining] = useState(0);
  const resendTimerRef = useRef(null);
  const [showManualResend, setShowManualResend] = useState(false);
  const [manualEmail, setManualEmail] = useState('');
  const [manualPassword, setManualPassword] = useState('');

  useEffect(() => {
    const oobCode = searchParams?.get("oobCode");
    const prefill = searchParams?.get('email');
    if (prefill) setEmail(prefill);
    if (oobCode) {
      (async () => {
        setStatus("loading");
        try {
          await applyActionCode(auth, oobCode);
          // After verifying via the action code, do NOT auto-login.
          // Instead, show success and let the user explicitly login.
          setStatus('success');
          setMessage('Verifikasi berhasil. Silakan masuk untuk melanjutkan.');
        } catch (err) {
          console.error("Verifikasi gagal:", err);
          setStatus("error");
          setMessage(err?.message || "Gagal memverifikasi email. Link mungkin sudah kadaluarsa atau tidak valid.");
        }
      })();
    } else {
      // No oobCode — show instructions about the verification link
      setStatus('idle');
    }
  }, [searchParams]);

  // cleanup resend timer on unmount
  useEffect(() => {
    return () => {
      if (resendTimerRef.current) {
        clearInterval(resendTimerRef.current);
        resendTimerRef.current = null;
      }
    };
  }, []);
  // Note: no code-based verification in this flow. We use Firebase email link verification.

  return (
    <div className="min-h-screen flex items-center justify-center px-4">
      <div className="max-w-lg w-full bg-white shadow-md rounded-lg p-6 text-center">
        {status === "loading" && (
          <>
            <div className="text-lg font-semibold mb-2">Memverifikasi email...</div>
            <p className="text-sm text-slate-500">Tunggu sebentar, kami sedang memproses konfirmasi Anda.</p>
          </>
        )}

        {status === "success" && (
          <>
            {/* Removed prominent success warning/header per request; keep neutral confirmation */}
            <p className="text-sm text-slate-700 mb-4">Verifikasi selesai. Anda sekarang dapat masuk ke akun Anda.</p>
            <div className="flex justify-center gap-2">
              <button
                onClick={() => {
                  const qs = new URLSearchParams();
                  qs.set('openLogin', '1');
                  if (email) qs.set('email', email);
                  router.push('/?' + qs.toString());
                }}
                className="px-4 py-2 bg-blue-600 text-white rounded-md"
              >
                Sudah verifikasi? Login
              </button>
              <button
                onClick={() => router.push('/')}
                className="px-4 py-2 bg-slate-100 rounded-md"
              >
                Kembali ke Beranda
              </button>
            </div>
          </>
        )}

        {status === "error" && (
          <>
            <div className="text-xl font-semibold text-red-600 mb-2">Verifikasi Gagal</div>
            <p className="text-sm text-slate-700 mb-4">{message}</p>
            <div className="flex justify-center gap-2">
              <button
                onClick={() => {
                  // Redirect back to consultation page and force re-registration flow
                  const qs = new URLSearchParams();
                  qs.set('needReRegister', '1');
                  if (email) qs.set('email', email);
                  router.push('/?' + qs.toString());
                }}
                className="px-4 py-2 bg-slate-100 rounded-md"
              >
                Kembali
              </button>
            </div>
          </>
        )}
        {status === 'idle' && (
          <>
            <div className="text-lg font-semibold mb-2">Verifikasi Email</div>
            <p className="text-sm text-slate-500 mb-4">Kami mengirimkan link verifikasi ke alamat email Anda. Buka inbox Anda dan klik link untuk menyelesaikan pendaftaran.</p>

            {email && (
              <p className="text-sm text-slate-600 mb-4">Email: <strong>{email}</strong></p>
            )}

            <div className="flex justify-center gap-2">
                <button onClick={() => {
                  const qs = new URLSearchParams();
                  qs.set('openLogin', '1');
                  if (email) qs.set('email', email);
                  router.push('/?' + qs.toString());
                }} className="px-3 py-2 bg-blue-600 text-white rounded">Kembali ke Beranda</button>
                <div>
                  <button
                    onClick={async () => {
                      if (resendRemaining > 0) return;
                      // If manual form is already visible, do nothing (prevent layout churn)
                      if (showManualResend) return;

                      // Safely attempt to read pending signup from sessionStorage; if found, use it to resend.
                      let pending = null;
                      try {
                        if (typeof window !== 'undefined' && window.sessionStorage) {
                          const raw = sessionStorage.getItem('pending_signup');
                          if (raw) {
                            try { pending = JSON.parse(raw); } catch (e) { pending = null; }
                          }
                        }
                      } catch (e) {
                        pending = null;
                      }

                      if (pending && pending.email && pending.password) {
                        try {
                          setResendRemaining(30);
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

                          await resendVerificationEmail({ email: pending.email, password: pending.password });
                          setMessage('Email verifikasi terkirim. Periksa inbox Anda.');
                          return;
                        } catch (err) {
                          console.error('Resend with pending creds failed:', err);
                          // fall through to show manual form
                        }
                      }
                    }}
                    disabled={resendRemaining > 0}
                    className="px-3 py-2 bg-slate-100 rounded disabled:opacity-50"
                  >
                    {resendRemaining > 0 ? `Kirim ulang (${resendRemaining}s)` : 'Belum terima email?'}
                  </button>

                  {showManualResend && (
                    <form
                      onSubmit={async (e) => {
                        e.preventDefault();
                        if (resendRemaining > 0) return;
                        try {
                          if (!manualEmail || !manualPassword) {
                            setMessage('Masukkan email dan password untuk mengirim ulang verifikasi.');
                            return;
                          }
                          setResendRemaining(30);
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

                          await resendVerificationEmail({ email: manualEmail, password: manualPassword });
                          setMessage('Email verifikasi terkirim. Periksa inbox Anda.');
                          setShowManualResend(false);
                          setManualEmail('');
                          setManualPassword('');
                        } catch (err) {
                          console.error('Manual resend failed:', err);
                          setMessage(err?.message || 'Gagal mengirim ulang verifikasi.');
                          if (resendTimerRef.current) { clearInterval(resendTimerRef.current); resendTimerRef.current = null; }
                          setResendRemaining(0);
                        }
                      }}
                      className="mt-3 space-y-2"
                    >
                      <div>
                        <input
                          type="email"
                          value={manualEmail}
                          onChange={(ev) => setManualEmail(ev.target.value)}
                          placeholder="email@example.com"
                          className="w-full px-3 py-2 border rounded"
                        />
                      </div>
                      <div>
                        <input
                          type="password"
                          value={manualPassword}
                          onChange={(ev) => setManualPassword(ev.target.value)}
                          placeholder="password"
                          className="w-full px-3 py-2 border rounded"
                        />
                      </div>
                      <div className="flex gap-2">
                        <button type="submit" className="px-3 py-2 bg-blue-600 text-white rounded">Kirim Ulang</button>
                        <button type="button" onClick={() => setShowManualResend(false)} className="px-3 py-2 bg-slate-100 rounded">Batal</button>
                      </div>
                    </form>
                  )}
                </div>
            </div>

            {message && <div className="mt-4 text-sm text-slate-700">{message}</div>}
          </>
        )}
      </div>
    </div>
  );
}

// Wrapper with Suspense boundary for useSearchParams
export default function VerifyEmailPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900 flex items-center justify-center">
        <div className="text-white text-xl">Loading verification...</div>
      </div>
    }>
      <VerifyEmailPageInner />
    </Suspense>
  );
}
