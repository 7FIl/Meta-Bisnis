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

  useEffect(() => {
    const oobCode = searchParams?.get("oobCode");
    if (!oobCode) {
      setStatus("error");
      setMessage("Kode verifikasi tidak ditemukan di URL.");
      return;
    }

    (async () => {
      setStatus("loading");
      try {
        await applyActionCode(auth, oobCode);
        setStatus("success");
        setMessage("Verifikasi email berhasil. Silakan kembali ke halaman login dan masuk.");
      } catch (err) {
        console.error("Verifikasi gagal:", err);
        setStatus("error");
        setMessage(err?.message || "Gagal memverifikasi email. Link mungkin sudah kadaluarsa atau tidak valid.");
      }
    })();
  }, [searchParams]);

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
            <div className="text-2xl font-bold text-green-600 mb-3">Berhasil!</div>
            <p className="text-sm text-slate-700 mb-4">{message}</p>
            <div className="flex justify-center">
              <button
                onClick={() => router.push("/")}
                className="px-4 py-2 bg-blue-600 text-white rounded-md"
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
                onClick={() => router.push("/")}
                className="px-4 py-2 bg-slate-100 rounded-md"
              >
                Kembali
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
