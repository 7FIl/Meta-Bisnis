"use client";

import { useEffect, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { applyActionCode } from "firebase/auth";
import { auth } from "@/lib/firebase";

export default function VerifyEmailPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const [status, setStatus] = useState("idle");
  const [message, setMessage] = useState("");
  const [email, setEmail] = useState("");

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
              <button onClick={() => router.push('/')} className="px-3 py-2 bg-blue-600 text-white rounded">Kembali ke Beranda</button>
              <button onClick={() => {
                // Force re-register flow by returning to consultation with needReRegister flag
                const qs = new URLSearchParams();
                qs.set('needReRegister', '1');
                if (email) qs.set('email', email);
                router.push('/?' + qs.toString());
              }} className="px-3 py-2 bg-slate-100 rounded">Belum terima email?</button>
            </div>

            {message && <div className="mt-4 text-sm text-slate-700">{message}</div>}
          </>
        )}
      </div>
    </div>
  );
}
