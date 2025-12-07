import { doc, getDoc, setDoc } from "firebase/firestore";
import { db } from "./firebase";

// Fungsi untuk menyimpan/update data user
export const saveUserSettings = async (uid, data) => {
  try {
    // Referensi ke dokumen: collection "users", ID dokumen = UID user
    const userRef = doc(db, "users", uid);
    // setDoc dengan { merge: true } akan mengupdate field yang ada atau membuat baru jika belum ada
    await setDoc(userRef, data, { merge: true });
    return true;
  } catch (error) {
    console.error("Error saving settings:", error);
    throw error;
  }
};

// Fungsi untuk mengambil data user
export const getUserSettings = async (uid) => {
  try {
    const userRef = doc(db, "users", uid);
    const docSnap = await getDoc(userRef);

    if (docSnap.exists()) {
      return docSnap.data();
    } else {
      return null; // Data belum ada (user baru)
    }
  } catch (error) {
    console.error("Error fetching settings:", error);
    throw error;
  }
};

/**
 * Mengambil tema saat ini dari Firestore.
 * @param {string} uid - User ID (UID) dari pengguna yang login.
 * @returns {Promise<string>} 'light' atau 'dark'. Default: 'light'.
 */
export const getTheme = async (uid) => {
  if (!uid) return "light";
  try {
    const settings = await getUserSettings(uid);
    // Prioritaskan tema dari Firestore, fallback ke 'light'
    return settings?.theme || "light";
  } catch (error) {
    console.error("Error getting theme from Firestore:", error);
    // Fallback ke tema lokal browser jika Firebase error
    if (
      typeof window !== "undefined" &&
      localStorage.getItem("theme") === "dark"
    ) {
      return "dark";
    }
    return "light";
  }
};

/**
 * Mengubah tema dan menyimpannya ke Firestore, serta MENGAPLIKASIKAN DI HTML.
 */
export const setTheme = async (uid, theme) => {
  // 1. Simpan tema ke Firestore (jika user login)
  if (uid) {
    try {
      await saveUserSettings(uid, { theme: theme });
    } catch (e) {
      console.error("Failed to save theme to Firebase:", e);
    }
  }

  // 2. Terapkan kelas 'dark' ke elemen <html> segera (Client-side effect)
  if (typeof document !== "undefined") {
    const root = document.documentElement;
    if (theme === "dark") {
      root.classList.add("dark");
    } else {
      root.classList.remove("dark");
    }
    // Simpan juga ke localStorage sebagai fallback / for instant load (tanpa menunggu Firebase)
    localStorage.setItem("theme", theme);
  }
};
