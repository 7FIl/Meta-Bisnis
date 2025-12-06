/**
 * Helper untuk mengelola temporary data di browser (sebelum user login)
 * Data disimpan sebagai JSON string di localStorage/cookie-like storage
 */

/**
 * Simpan temporary data (untuk user yang belum login)
 * @param {string} key - Nama key untuk penyimpanan
 * @param {object} data - Data yang akan disimpan
 */
export const setTempData = (key, data) => {
  try {
    if (typeof window !== 'undefined') {
      localStorage.setItem(key, JSON.stringify(data));
      console.log(`[TempData] Saved to ${key}:`, data);
    }
  } catch (error) {
    console.error('[TempData] Error saving:', error);
  }
};

/**
 * Ambil temporary data dari storage
 * @param {string} key - Nama key untuk diambil
 * @returns {object|null} - Data atau null jika tidak ada
 */
export const getTempData = (key) => {
  try {
    if (typeof window !== 'undefined') {
      const data = localStorage.getItem(key);
      if (data) {
        const parsed = JSON.parse(data);
        console.log(`[TempData] Retrieved from ${key}:`, parsed);
        return parsed;
      }
    }
  } catch (error) {
    console.error('[TempData] Error retrieving:', error);
  }
  return null;
};

/**
 * Hapus temporary data setelah berhasil dipindahkan ke Firebase
 * @param {string} key - Nama key untuk dihapus
 */
export const removeTempData = (key) => {
  try {
    if (typeof window !== 'undefined') {
      localStorage.removeItem(key);
      console.log(`[TempData] Removed ${key}`);
    }
  } catch (error) {
    console.error('[TempData] Error removing:', error);
  }
};

/**
 * Cek apakah ada temporary data yang perlu dipindahkan
 * @param {string} key - Nama key untuk dicek
 * @returns {boolean}
 */
export const hasTempData = (key) => {
  try {
    if (typeof window !== 'undefined') {
      return localStorage.getItem(key) !== null;
    }
  } catch (error) {
    console.error('[TempData] Error checking:', error);
  }
  return false;
};
