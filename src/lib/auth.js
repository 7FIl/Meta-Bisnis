'use client';

// src/lib/auth.js
import {
  signInWithPopup,
  signOut,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  sendEmailVerification,
} from "firebase/auth";
import { auth, googleProvider } from "./firebase";

// --- KONFIGURASI DOMAIN ---
const ALLOWED_DOMAINS = [
  "gmail.com",
  "googlemail.com",
  "outlook.com",
  "hotmail.com",
  "live.com",
  "msn.com",
  "yahoo.com",
  "yahoo.co.id",
  "yahoo.com.sg",
  "icloud.com",
  "me.com",
  "mac.com",
  "aol.com",
  "protonmail.com",
  "proton.me",
  "zoho.com",
  "yandex.com",
  "mail.com",
  "gmx.com",
  "gmx.us",
];

const isDomainAllowed = (email) => {
  if (!email) return false;
  const domain = email.split("@")[1]?.toLowerCase();
  return ALLOWED_DOMAINS.includes(domain);
};

// 1. Register dengan Email & Password (DENGAN VALIDASI)
export const registerWithEmail = async (email, password) => {
  // Validasi Domain Sebelum Request ke Firebase
  if (!isDomainAllowed(email)) {
    throw new Error(
      "Maaf, pendaftaran hanya diizinkan menggunakan penyedia email umum (Gmail, Yahoo, Outlook, dll). Email kantor/custom domain tidak diperbolehkan."
    );
  }

  try {
    const result = await createUserWithEmailAndPassword(auth, email, password);
    // Kirim email verifikasi — arahkan kembali ke halaman /verify di aplikasi
    try {
      const continueUrl = (typeof window !== 'undefined' && process?.env?.NEXT_PUBLIC_APP_URL)
        ? process.env.NEXT_PUBLIC_APP_URL + '/verify'
        : (typeof window !== 'undefined' ? window.location.origin + '/verify' : undefined);

      const actionCodeSettings = continueUrl
        ? { url: continueUrl, handleCodeInApp: true }
        : undefined;

      await sendEmailVerification(result.user, actionCodeSettings);
    } catch (e) {
      console.warn('Gagal mengirim email verifikasi:', e);
    }

    return result.user;
  } catch (error) {
    console.error("Registration Error:", error);
    // Translate error message firebase ke Bahasa Indonesia yang user-friendly
    if (error.code === "auth/email-already-in-use") {
      throw new Error("Email ini sudah terdaftar. Silakan login.");
    } else if (error.code === "auth/weak-password") {
      throw new Error("Password terlalu lemah. Minimal 6 karakter.");
    }
    throw error;
  }
};

// 2. Login dengan Email & Password
export const loginWithEmail = async (email, password) => {
  try {
    const result = await signInWithEmailAndPassword(auth, email, password);
    // Pastikan email sudah terverifikasi
    if (!result.user.emailVerified) {
      // Logout segera untuk mencegah akses tanpa verifikasi
      try { await signOut(auth); } catch (e) { /* ignore */ }
      throw new Error("Email belum terverifikasi. Silakan cek inbox Anda dan klik link verifikasi sebelum login.");
    }

    return result.user;
  } catch (error) {
    console.error("Login Error:", error);
    // Jika error berasal dari pengecekan verifikasi di atas, biarkan pesan tersebut lewat
    if (error && error.message && error.message.toLowerCase().includes('terverifikasi')) {
      throw error;
    }
    // Map common firebase auth codes to user-friendly messages
    if (error && error.code) {
      if (error.code === 'auth/wrong-password' || error.code === 'auth/user-not-found') {
        throw new Error('Email atau password salah.');
      }
      if (error.code === 'auth/invalid-email') {
        throw new Error('Format email tidak valid.');
      }
    }
    throw new Error('Gagal login. Periksa kredensial Anda.');
  }
};

// 3. Login dengan Google (Tetap ada)
export const loginWithGoogle = async () => {
  try {
    const result = await signInWithPopup(auth, googleProvider);
    return result.user;
  } catch (error) {
    console.error("Google Login Error:", error);
    throw error;
  }
};

// 4. Logout
export const logoutUser = async () => {
  try {
    await signOut(auth);
  } catch (error) {
    console.error("Logout Error:", error);
    throw error;
  }
};

// 5. Kirim ulang email verifikasi
// Jika ada sesi aktif (auth.currentUser), langsung kirim. Jika tidak, dapat menerima
// { email, password } untuk melakukan sign-in sementara, mengirim verifikasi, lalu sign-out.
export const resendVerificationEmail = async ({ email, password } = {}) => {
  let user = auth.currentUser;
  let signedInByUs = false;

  try {
    if (!user) {
      if (!email || !password) {
        throw new Error("Tidak ada sesi aktif. Berikan email & password untuk mengirim ulang verifikasi.");
      }
      const res = await signInWithEmailAndPassword(auth, email, password);
      user = res.user;
      signedInByUs = true;
    }

    if (!user) throw new Error("Gagal menemukan user untuk dikirim verifikasi.");
    if (user.emailVerified) return { success: true, message: "Email sudah terverifikasi." };

    const continueUrl = (typeof window !== 'undefined' && process?.env?.NEXT_PUBLIC_APP_URL)
      ? process.env.NEXT_PUBLIC_APP_URL + '/verify'
      : (typeof window !== 'undefined' ? window.location.origin + '/verify' : undefined);

    const actionCodeSettings = continueUrl
      ? { url: continueUrl, handleCodeInApp: true }
      : undefined;

    await sendEmailVerification(user, actionCodeSettings);

    if (signedInByUs) {
      try { await signOut(auth); } catch (e) { /* ignore */ }
    }

    return { success: true, message: 'Email verifikasi terkirim.' };
  } catch (err) {
    // jika kita sign-in sementara, pastikan logout
    if (signedInByUs) {
      try { await signOut(auth); } catch (e) { /* ignore */ }
    }
    console.error('resendVerificationEmail error:', err);
    throw err;
  }
};