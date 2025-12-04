'use client';

// src/lib/auth.js
import {
  signInWithPopup,
  signOut,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  sendEmailVerification,
} from 'firebase/auth';
import { auth, googleProvider } from './firebase';

// --- KONFIGURASI DOMAIN ---
const ALLOWED_DOMAINS = [
  'gmail.com',
  'googlemail.com',
  'outlook.com',
  'hotmail.com',
  'live.com',
  'msn.com',
  'yahoo.com',
  'yahoo.co.id',
  'yahoo.com.sg',
  'icloud.com',
  'me.com',
  'mac.com',
  'aol.com',
  'protonmail.com',
  'proton.me',
  'zoho.com',
  'yandex.com',
  'mail.com',
  'gmx.com',
  'gmx.us',
];

const isDomainAllowed = (email) => {
  if (!email) return false;
  const domain = email.split('@')[1]?.toLowerCase();
  return ALLOWED_DOMAINS.includes(domain);
};

// 1. Register dengan Email & Password
export const registerWithEmail = async (email, password) => {
  if (!isDomainAllowed(email)) {
    throw new Error(
      'Maaf, pendaftaran hanya diizinkan menggunakan penyedia email umum (Gmail, Yahoo, Outlook, dll). Email kantor/custom domain tidak diperbolehkan.'
    );
  }

  try {
    const result = await createUserWithEmailAndPassword(auth, email, password);

    // Send Firebase email verification link
    try {
      const continueUrl = (typeof window !== 'undefined' && process?.env?.NEXT_PUBLIC_APP_URL)
        ? process.env.NEXT_PUBLIC_APP_URL + '/'
        : (typeof window !== 'undefined' ? window.location.origin + '/' : undefined);

      const actionCodeSettings = continueUrl ? { url: continueUrl, handleCodeInApp: true } : undefined;
      try {
        await sendEmailVerification(result.user, actionCodeSettings);
      } catch (ee) {
        console.warn('sendEmailVerification failed', ee);
      }
    } catch (e) {
      console.warn('Error preparing email verification settings', e);
    }

    // Persist pending credentials so we can auto-login after the user clicks the link (same browser)
    try {
      if (typeof window !== 'undefined' && window.sessionStorage) {
        sessionStorage.setItem('pending_signup', JSON.stringify({ email, password }));
      }
    } catch (e) {
      // ignore storage errors
    }

    // Ensure user is signed out until they verify
    try { await signOut(auth); } catch (e) { /* ignore */ }
    return result.user;
  } catch (error) {
    console.error('Registration Error:', error);
    if (error.code === 'auth/email-already-in-use') {
      throw new Error('Email ini sudah terdaftar. Silakan login.');
    } else if (error.code === 'auth/weak-password') {
      throw new Error('Password terlalu lemah. Minimal 6 karakter.');
    }
    throw error;
  }
};

// 2. Login dengan Email & Password
export const loginWithEmail = async (email, password) => {
  let result;
  try {
    result = await signInWithEmailAndPassword(auth, email, password);
  } catch (error) {
    console.error('Login Error:', error);
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

  // Pastikan email sudah terverifikasi (do this after successful sign-in so it's not swallowed by the above catch)
  if (!result.user.emailVerified) {
    try { await signOut(auth); } catch (e) { /* ignore */ }
    const err = new Error('Email belum terverifikasi. Silakan cek inbox Anda untuk link verifikasi.');
    // add a code so callers can detect this specific case
    err.code = 'auth/email-not-verified';
    throw err;
  }

  return result.user;
};

// 3. Login dengan Google
export const loginWithGoogle = async () => {
  try {
    const result = await signInWithPopup(auth, googleProvider);
    return result.user;
  } catch (error) {
    console.error('Google Login Error:', error);
    throw error;
  }
};

// 4. Logout
export const logoutUser = async () => {
  try {
    await signOut(auth);
  } catch (error) {
    console.error('Logout Error:', error);
    throw error;
  }
};

// 5. Resend verification link
export const resendVerificationEmail = async ({ email, password } = {}) => {
  let user = auth.currentUser;
  let signedInByUs = false;

  try {
    if (!user) {
      if (!email || !password) {
        throw new Error('Tidak ada sesi aktif. Berikan email & password untuk mengirim ulang verifikasi.');
      }
      const res = await signInWithEmailAndPassword(auth, email, password);
      user = res.user;
      signedInByUs = true;
    }

    if (!user) throw new Error('Gagal menemukan user untuk dikirim verifikasi.');
    if (user.emailVerified) return { success: true, message: 'Email sudah terverifikasi.' };

    const continueUrl = (typeof window !== 'undefined' && process?.env?.NEXT_PUBLIC_APP_URL)
      ? process.env.NEXT_PUBLIC_APP_URL + '/'
      : (typeof window !== 'undefined' ? window.location.origin + '/' : undefined);

    const actionCodeSettings = continueUrl ? { url: continueUrl, handleCodeInApp: true } : undefined;
    try {
      await sendEmailVerification(user, actionCodeSettings);
    } catch (e) {
      console.warn('sendEmailVerification failed', e);
      throw new Error('Gagal mengirim link verifikasi. Coba lagi.');
    }

    if (signedInByUs) {
      try { await signOut(auth); } catch (e) { /* ignore */ }
    }

    return { success: true, message: 'Email verifikasi terkirim.' };
  } catch (err) {
    if (signedInByUs) {
      try { await signOut(auth); } catch (e) { /* ignore */ }
    }
    console.error('resendVerificationEmail error:', err);
    throw err;
  }
};