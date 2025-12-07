// src/components/MenuPengaturan.js
'use client';

import { useAuth } from '@/lib/auth'; 
import { useEffect, useState } from 'react';
import { saveUserSettings, setTheme } from '@/lib/userSettings';
import { PROVINCES, getCitiesByProvince } from '@/lib/locations';
import { useMemo } from 'react';

// fallback wrapper jika hook useToast/useAlert tidak tersedia
const _toast = {
  success: (m) => window.alert(m),
  error: (m) => window.alert(m),
  info: (m) => window.alert(m),
};

const _alert = {
  // alert.error(title, message, onConfirm, onCancel, confirmText, cancelText)
  error: (title, message, onConfirm) => {
    const ok = window.confirm(`${title}\n\n${message}`);
    if (ok && typeof onConfirm === 'function') onConfirm();
  },
};

// BUSINESS TYPE categories - Global option tanpa subcategory bertingkat
const BUSINESS_TYPES = [
  "Kuliner (Makanan/Minuman)", "Fashion & Pakaian", "Jasa & Layanan",
    "Retail & Toko", "Teknologi & Elektronik", "Kesehatan & Kecantikan",
    "Pendidikan & Pelatihan", "Otomotif", "Properti & Real Estate", "Pertanian", "Lainnya"];

export default function MenuPengaturan({
  currentBusinessName,
  currentUserName,
  currentUserEmail,
  currentBusinessLocation,
  currentBusinessDescription = '',
  currentBusinessType = '',
  currentInstagramUsername = '',
  currentTiktokUsername = '',
  currentWhatsappNumber = '',
  onUpdateSettings,
  onDeleteAccount,
  currentTheme, 
  onThemeChange,
}) {
  // use injected hooks if available, otherwise fallback to wrappers above
  const toast = (typeof useToast === 'function') ? useToast() : _toast;
  const alert = (typeof useAlert === 'function') ? useAlert() : _alert;
  const [newBusinessName, setNewBusinessName] = useState(currentBusinessName);
  const [newUserName, setNewUserName] = useState(currentUserName);
  const [newBusinessLocation, setNewBusinessLocation] = useState(currentBusinessLocation);
  const [newBusinessDescription, setNewBusinessDescription] = useState(currentBusinessDescription);
  const [newBusinessType, setNewBusinessType] = useState(currentBusinessType);
  const [newInstagramUsername, setNewInstagramUsername] = useState(currentInstagramUsername);
  const [newTiktokUsername, setNewTiktokUsername] = useState(currentTiktokUsername);
  const [newWhatsappNumber, setNewWhatsappNumber] = useState(currentWhatsappNumber);
  // state
  const [newProvince, setNewProvince] = useState("");
  const [newCity, setNewCity] = useState("");
  const [loading, setLoading] = useState(false);
  const { user } = useAuth();

  // Pastikan jenis usaha dari AI tetap muncul di dropdown walau tidak ada di preset
  const businessTypeOptions = useMemo(() => {
    const base = [...BUSINESS_TYPES];
    const candidates = [currentBusinessType, newBusinessType].filter(Boolean);
    candidates.forEach((val) => {
      if (!base.includes(val)) base.unshift(val); // taruh di atas agar terlihat
    });
    return base;
  }, [currentBusinessType, newBusinessType]);

  useEffect(() => {
    // Sync local form state
    setNewBusinessName(currentBusinessName);
    setNewUserName(currentUserName);
    setNewBusinessDescription(currentBusinessDescription || '');
    setNewBusinessType(currentBusinessType || '');
    setNewInstagramUsername(currentInstagramUsername || '');
    setNewTiktokUsername(currentTiktokUsername || '');
    setNewWhatsappNumber(currentWhatsappNumber || '');
    // parse currentBusinessLocation into province/city if stored as "Province, City"
    if (currentBusinessLocation && currentBusinessLocation.includes(",")) {
      const parts = currentBusinessLocation.split(",").map(p => p.trim());
      setNewProvince(parts[0] || "");
      setNewCity(parts[1] || "");
    } else {
      setNewProvince(currentBusinessLocation || "");
      setNewCity("");
    }

    // Sync theme state from HTML element
  }, [currentBusinessName, currentUserName, currentBusinessLocation, currentBusinessDescription, currentBusinessType, currentInstagramUsername, currentTiktokUsername, currentWhatsappNumber]);

  // Handler untuk toggle tema
  const handleThemeToggle = async () => {
  // Tentukan tema baru
  const newTheme = currentTheme === 'light' ? 'dark' : 'light';
    
  // Simpan ke cookie (tidak perlu user login)
  setTheme(newTheme);
    
  // Update state di parent (DashboardView)
  onThemeChange(newTheme);
    
  toast.success(`Tema berubah ke ${newTheme === 'dark' ? 'Gelap' : 'Terang'}`);
  };

  // when submitting combine province + optional city
  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    if (newBusinessName.trim() === "" || newUserName.trim() === "") {
      toast.error("Nama dan Nama Bisnis tidak boleh kosong.");
      setLoading(false);
      return;
    }

    if (newProvince.trim() === "") {
      toast.error("Provinsi tidak boleh kosong. (Kota opsional)");
      setLoading(false);
      return;
    }

    if (newBusinessType.trim() === "") {
      toast.error("Jenis Usaha tidak boleh kosong. Pilih dari daftar untuk AI lebih akurat.");
      setLoading(false);
      return;
    }

    try {
      await onUpdateSettings({
        businessName: newBusinessName,
        userName: newUserName,
        // combine province + optional city
        businessLocation: newProvince + (newCity ? `, ${newCity}` : ""),
        businessDescription: newBusinessDescription,
        businessType: newBusinessType,
        instagramUsername: newInstagramUsername,
        tiktokUsername: newTiktokUsername,
        whatsappNumber: newWhatsappNumber,
      });

      toast.success("Pengaturan berhasil diperbarui! AI & Tren Pasar telah dioptimasi.");
    } catch (error) {
      console.error("Update settings error:", error);
      toast.error(error.message || "Gagal menyimpan pengaturan.");
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteAccount = () => {
    alert.error(
      'Hapus Akun Permanen?',
      `Anda yakin ingin menghapus akun ${currentUserEmail}? Semua data akan hilang dan tidak bisa dikembalikan.`,
      async () => {
        await onDeleteAccount();
        toast.info("Akun berhasil dihapus. Sampai jumpa lagi.");
      },
      null, // onCancel
      'Hapus Permanen',
      'Batal'
    );
  };

  // derive current province/city for comparison
  const _currProvince = currentBusinessLocation && currentBusinessLocation.includes(",")
    ? currentBusinessLocation.split(",").map(p => p.trim())[0]
    : (currentBusinessLocation || "");
  const _currCity = currentBusinessLocation && currentBusinessLocation.includes(",")
    ? currentBusinessLocation.split(",").map(p => p.trim())[1] || ""
    : "";
  const isFormUnchanged =
    newBusinessName === currentBusinessName &&
    newUserName === currentUserName &&
    newProvince === _currProvince &&
    newCity === _currCity &&
    (newBusinessDescription || '') === (currentBusinessDescription || '') &&
    (newBusinessType || '') === (currentBusinessType || '') &&
    (newInstagramUsername || '') === (currentInstagramUsername || '') &&
    (newTiktokUsername || '') === (currentTiktokUsername || '') &&
    (newWhatsappNumber || '') === (currentWhatsappNumber || '');

  return (
    <div className="space-y-6">
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Pengaturan nama dan lokasi */}
        <div className="space-y-6">
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-700">
            <h3 className="text-lg font-semibold text-slate-800:text-slate-900 mb-4">Pengaturan Bisnis & Akun</h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Nama Bisnis */}
              <div className="md:col-span-2">
                <label className="block text-sm font-semibold text-slate-700 dark:text-slate-900 mb-2">Nama Bisnis</label>
                <input
                  id="businessName"
                  type="text"
                  value={newBusinessName}
                  onChange={(e) => setNewBusinessName(e.target.value)}
                  placeholder="Cth: Kopi Pintar AI"
                  className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg text-sm bg-white :bg-slate-800 text-slate-900 dark:text-slate-900"
                  disabled={loading}
                />
              </div>

              {/* Deskripsi Bisnis (Opsional) */}
              <div className="md:col-span-2">
                <label className="block text-sm font-semibold text-slate-700 dark:text-slate-900 mb-2">Deskripsi Bisnis (Opsional)</label>
                <textarea
                  id="businessDescription"
                  value={newBusinessDescription}
                  onChange={(e) => setNewBusinessDescription(e.target.value)}
                  placeholder="Jelaskan produk, target pasar, dan keunggulan utama"
                  className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg text-sm bg-white :bg-slate-800 text-slate-900 dark:text-slate-900 min-h-[96px]"
                  disabled={loading}
                />
                <p className="text-xs text-slate-700 mt-1">Opsional, tetapi membantu AI memahami bisnismu.</p>
              </div>

              {/* Nama Pengguna */}
              <div className="md:col-span-2">
                <label className="block text-sm font-semibold text-slate-700 dark:text-slate-900 mb-2">Nama Pengguna</label>
                <input
                  id="userName"
                  type="text"
                  value={newUserName}
                  onChange={(e) => setNewUserName(e.target.value)}
                  placeholder="Cth: Budi Santoso"
                  className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg text-sm bg-white:bg-slate-900 text-slate :text-slate-900"
                  disabled={loading}
                />
                <p className="text-xs text-slate-000">Email: <span className="font-mono">{currentUserEmail}</span></p>
              </div>

              {/* Jenis Usaha - Single dropdown untuk optimasi AI & Tren Pasar */}
              <div className="md:col-span-2">
                <label className="block text-sm font-semibold text-slate-700 dark:text-slate-900 mb-2">Jenis Usaha <span className="text-red-500">*</span></label>
                <select
                  value={newBusinessType}
                  onChange={(e) => setNewBusinessType(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg text-sm bg-white:bg-slate-800 text-slate-900:text-slate-900 font-medium"
                  disabled={loading}
                >
                  <option value="">Pilih Jenis Usaha (Penting untuk AI Akurat)</option>
                  {businessTypeOptions.map((type) => (
                    <option key={type} value={type}>{type}</option>
                  ))}
                </select>
                <p className="text-xs text-slate-700 mt-1">✓ Dipilih untuk mengoptimasi hasil AI, tren pasar, dan konsultasi bisnis Anda</p>
              </div>

              <div className="md:col-span-1">
                <label className="block text-sm font-semibold text-slate-700 dark:text-slate-900 mb-2">Provinsi</label>
                <select
                  value={newProvince}
                  onChange={(e) => { setNewProvince(e.target.value); setNewCity(""); }}
                  className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg text-sm bg-white:bg-slate-800 text-slate-900:text-slate-900"
                  disabled={loading}
                >
                  <option value="">Pilih Provinsi</option>
                  {Object.keys(PROVINCES).map((p) => (
                    <option key={p} value={p}>{p}</option>
                  ))}
                </select>
              </div>

              <div className="md:col-span-1">
                <label className="block text-sm font-semibold text-slate-700 dark:text-slate-900 mb-2">Kota / Kabupaten</label>
                <select
                  value={newCity}
                  onChange={(e) => setNewCity(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg text-sm bg-white:bg-slate-800 text-slate-900:text-slate-900"
                  disabled={loading || !newProvince}
                >
                  <option value="">{newProvince ? "(Opsional) Pilih Kota/Kabupaten" : "Pilih provinsi dulu"}</option>
                  {(PROVINCES[newProvince] || []).map((c) => (
                    <option key={c} value={c}>{c}</option>
                  ))}
                </select>
                {!newProvince && <p className="text-xs text-slate-400 mt-1">Pilih provinsi terlebih dahulu untuk memilih kota.</p>}
              </div>

              {/* Social Media Usernames */}
              <div className="md:col-span-2">
                <h4 className="text-md font-semibold text-slate-800 dark:text-slate-900 mb-3 mt-4">Username Media Sosial (Opsional)</h4>
                <p className="text-xs text-slate-700 mb-3">Bantu AI mengarahkan pelanggan ke akun sosial media Anda dalam strategi pemasaran.</p>
              </div>

              <div className="md:col-span-1">
                <label className="block text-sm font-semibold text-slate-700 dark:text-slate-900 mb-2 flex items-center gap-2">
                  <i className="fab fa-instagram text-pink-600"></i> Instagram
                </label>
                <div className="flex items-center">
                  <span className="px-3 py-2 bg-slate-00 border border-r-0 border-slate-500 rounded-l-lg text-sm text-slate-00">@</span>
                  <input
                    type="text"
                    value={newInstagramUsername}
                    onChange={(e) => setNewInstagramUsername(e.target.value)}
                    placeholder="username"
                    className="flex-1 px-3 py-2 border border-slate-500 dark:border-slate-600 rounded-r-lg text-sm bg-white text-slate-900"
                    disabled={loading}
                  />
                </div>
              </div>

              <div className="md:col-span-1">
                <label className="block text-sm font-semibold text-slate-700 dark:text-slate-900 mb-2 flex items-center gap-2">
                  <i className="fab fa-tiktok"></i> TikTok
                </label>
                <div className="flex items-center">
                  <span className="px-3 py-2 bg-slate-00 border border-r-0 border-slate-600 rounded-l-lg text-sm text-slate-00">@</span>
                  <input
                    type="text"
                    value={newTiktokUsername}
                    onChange={(e) => setNewTiktokUsername(e.target.value)}
                    placeholder="username"
                    className="flex-1 px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-r-lg text-sm bg-white text-slate-900"
                    disabled={loading}
                  />
                </div>
              </div>

              <div className="md:col-span-2">
                <label className="block text-sm font-semibold text-slate-700 dark:text-slate-900 mb-2 flex items-center gap-2">
                  <i className="fab fa-whatsapp text-green-600"></i> WhatsApp
                </label>
                <div className="flex items-center">
                  <span className="px-3 py-2 bg-slate-00 border border-r-0 border-slate-600 rounded-l-lg text-sm text-slate-00">+62</span>
                  <input
                    type="text"
                    value={newWhatsappNumber}
                    onChange={(e) => setNewWhatsappNumber(e.target.value)}
                    placeholder="8123456789"
                    className="flex-1 px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-r-lg text-sm bg-white text-slate-900"
                    disabled={loading}
                  />
                </div>
                <p className="text-xs text-slate-700 mt-1">Tanpa 0 di awal. Contoh: 8123456789</p>
              </div>

              {/* Additional settings can be added here */}
            </div>
          </div>

          {/* Actions */}
          <div className="flex justify-end gap-3">
            <button
              type="submit"
              className="bg-blue-600 hover:bg-blue-700 disabled:bg-slate-00 text-white font-semibold py-2 px-6 rounded-lg transition-all flex items-center gap-2"
              disabled={loading || isFormUnchanged}
            >
              {loading ? (
                <>
                  <i className="fas fa-spinner fa-spin"></i> Menyimpan...
                </>
              ) : (
                <>
                  <i className="fas fa-save"></i> Simpan Perubahan
                </>
              )}
            </button>
          </div>
        </div>
      </form>
    </div>
  );
}