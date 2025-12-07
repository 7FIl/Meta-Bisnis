import { doc, getDoc, setDoc } from "firebase/firestore";
import { db } from "./firebase";

// Remove all undefined values recursively to satisfy Firestore constraints
const stripUndefinedDeep = (value) => {
  if (value === undefined) return undefined;
  if (value === null) return null;
  if (Array.isArray(value)) {
    return value
      .map((v) => stripUndefinedDeep(v))
      .filter((v) => v !== undefined);
  }
  if (typeof value === "object") {
    return Object.entries(value).reduce((acc, [k, v]) => {
      const cleaned = stripUndefinedDeep(v);
      if (cleaned !== undefined) acc[k] = cleaned;
      return acc;
    }, {});
  }
  return value;
};

// Fungsi untuk menyimpan/update data user
export const saveUserSettings = async (uid, data) => {
  try {
    // Referensi ke dokumen: collection "users", ID dokumen = UID user
    const userRef = doc(db, "users", uid);
    // Bersihkan undefined agar sesuai dengan aturan Firestore
    const cleaned = stripUndefinedDeep(data || {});
    // setDoc dengan { merge: true } akan mengupdate field yang ada atau membuat baru jika belum ada
    await setDoc(userRef, cleaned, { merge: true });
    return true;
  } catch (error) {
    // Handle Firestore permission errors gracefully to avoid noisy console errors
    // when the project's security rules disallow the current operation.
    const msg = error?.message || String(error);
    // Always suppress permission-related issues and return false so callers
    // can gracefully fallback without crashing the app. Log code when present.
    const code = error?.code || null;
    if (msg.toLowerCase().includes('permission') || msg.toLowerCase().includes('missing or insufficient')) {
      console.warn('Permission denied when saving user settings (suppressed):', { message: msg, code });
      return false;
    }

    // For any other error, log the details and return false so the UI can continue.
    console.error('Error saving user settings (returned false):', { message: msg, code, error });
    return false;
  }
};

// Fungsi untuk mengambil data user
export const getUserSettings = async (uid) => {
  try {
    const userRef = doc(db, "users", uid);
    const docSnap = await getDoc(userRef);

    if (docSnap.exists()) {
      console.log('[getUserSettings] Data berhasil dibaca dari Firebase:', { uid, dataKeys: Object.keys(docSnap.data()) });
      return docSnap.data();
    } else {
      console.log('[getUserSettings] Document tidak ada (user baru):', { uid });
      return null; // Data belum ada (user baru)
    }
  } catch (error) {
    const msg = error?.message || String(error);
    const code = error?.code || null;
    if (msg.toLowerCase().includes('permission') || msg.toLowerCase().includes('missing or insufficient')) {
      console.warn('[getUserSettings] Permission denied - check Firebase rules:', { uid, message: msg, code });
      return null;
    }
    console.error("[getUserSettings] Error fetching settings:", { uid, message: msg, code, error });
    throw error;
  }
};

/**
 * Mengambil preferensi tema dari cookie (bukan Firebase)
 * @returns {string} 'light' atau 'dark'. Default: 'light'.
 */
export const getTheme = () => {
  if (typeof document === "undefined") return "light";
  
  // Cek cookie
  const cookies = document.cookie.split(';');
  const themeCookie = cookies.find(c => c.trim().startsWith('theme='));
  
  if (themeCookie) {
    const theme = themeCookie.split('=')[1];
    return theme === 'dark' ? 'dark' : 'light';
  }
  
  // Fallback ke localStorage
  if (typeof localStorage !== "undefined" && localStorage.getItem("theme") === "dark") {
    return "dark";
  }
  
  return "light";
};

/**
 * Mengubah tema dan menyimpannya ke COOKIE (bukan Firebase)
 */
export const setTheme = (theme) => {
  // 1. Simpan ke cookie (expire 1 tahun)
  if (typeof document !== "undefined") {
    const expires = new Date();
    expires.setFullYear(expires.getFullYear() + 1);
    document.cookie = `theme=${theme}; expires=${expires.toUTCString()}; path=/`;
  }

  // 2. Terapkan kelas 'dark' ke elemen <html> segera (Client-side effect)
  if (typeof document !== "undefined") {
    const root = document.documentElement;
    if (theme === "dark") {
      root.classList.add("dark");
    } else {
      root.classList.remove("dark");
    }
    // Simpan juga ke localStorage sebagai fallback
    localStorage.setItem("theme", theme);
  }
};

/**
 * Menyimpan calendar events ke Firestore
 * @param {string} uid - User ID
 * @param {Object} events - Calendar events object
 */
export const saveCalendarEvents = async (uid, events) => {
  if (!uid) return;
  try {
    await saveUserSettings(uid, { calendarEvents: events });
  } catch (error) {
    console.error("Error saving calendar events:", error);
    throw error;
  }
};

/**
 * Mengambil calendar events dari Firestore
 * @param {string} uid - User ID
 * @returns {Promise<Object>} Calendar events object
 */
export const getCalendarEvents = async (uid) => {
  if (!uid) return {};
  try {
    const settings = await getUserSettings(uid);
    return settings?.calendarEvents || {};
  } catch (error) {
    console.error("Error getting calendar events:", error);
    return {};
  }
};
