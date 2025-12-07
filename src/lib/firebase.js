'use client';

// src/lib/firebase.js
import { initializeApp, getApps } from "firebase/app";
import { getAuth, GoogleAuthProvider } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getStorage } from 'firebase/storage';

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
};

// Singleton pattern untuk mencegah inisialisasi ganda di Next.js
const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApps()[0];

export const auth = getAuth(app);
export const googleProvider = new GoogleAuthProvider();
export const db = getFirestore(app);
export const storage = getStorage(app);

/**
 * Mengambil tema saat ini dari Firestore untuk pengguna yang login.
 * @param {string} userId - UID pengguna yang login.
 * @returns {Promise<string>} 'light' atau 'dark'. Default: 'light'.
 */
export async function getThemeFromFirestore(userId) {
  if (!userId) {
    return 'light'; // Jika belum login, default ke light
  }

  try {
    const docRef = doc(db, 'userSettings', userId);
    const docSnap = await getDoc(docRef);

    if (docSnap.exists() && docSnap.data().theme) {
      return docSnap.data().theme;
    }
  } catch (error) {
    console.error('Error fetching theme from Firestore:', error);
  }
  return 'light'; // Default jika data tidak ditemukan atau error
}

/**
 * Menyimpan tema ke Firestore untuk pengguna yang login.
 * @param {string} userId - UID pengguna yang login.
 * @param {string} theme - 'light' atau 'dark'.
 */
export async function saveThemeToFirestore(userId, theme) {
  if (!userId) {
    console.warn('Cannot save theme: User ID is missing.');
    return;
  }

  try {
    const docRef = doc(db, 'userSettings', userId);
    // Menggunakan setDoc dengan merge: true agar hanya field 'theme' yang diupdate
    await setDoc(docRef, { theme: theme }, { merge: true }); 
  } catch (error) {
    console.error('Error saving theme to Firestore:', error);
  }
}