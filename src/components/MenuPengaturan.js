// src/components/MenuPengaturan.js
'use client';

import { useState, useEffect } from 'react';
import { useToast } from './Toast';
import { useAlert } from './Alert'; 
import Image from 'next/image';

export default function MenuPengaturan({ 
    currentBusinessName, 
    currentUserName, 
    currentUserEmail, 
    currentBusinessTitle, 
    currentBusinessLocation, 
    currentBusinessImage, 
    onUpdateSettings, 
    onDeleteAccount 
}) {
  const toast = useToast();
  const alert = useAlert();
  const [newBusinessName, setNewBusinessName] = useState(currentBusinessName);
  const [newUserName, setNewUserName] = useState(currentUserName);
  const [newBusinessTitle, setNewBusinessTitle] = useState(currentBusinessTitle);
  const [newBusinessLocation, setNewBusinessLocation] = useState(currentBusinessLocation);
  const [newBusinessImage, setNewBusinessImage] = useState(currentBusinessImage);
  
  const [loading, setLoading] = useState(false);
  const [isDarkMode, setIsDarkMode] = useState(false); // State tema lokal hanya untuk icon

  useEffect(() => {
    // Sync local form state
    setNewBusinessName(currentBusinessName);
    setNewUserName(currentUserName);
    setNewBusinessTitle(currentBusinessTitle);
    setNewBusinessLocation(currentBusinessLocation);
    setNewBusinessImage(currentBusinessImage);

    // Sync theme state from HTML element
    setIsDarkMode(document.documentElement.classList.contains('dark'));
  }, [currentBusinessName, currentUserName, currentBusinessTitle, currentBusinessLocation, currentBusinessImage]);

  // Handler untuk toggle tema
  const handleThemeToggle = () => {
    const newMode = !document.documentElement.classList.contains('dark');
    setIsDarkMode(newMode);
    
    if (newMode) {
      document.documentElement.classList.add('dark');
      localStorage.setItem('theme', 'dark');
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('theme', 'light');
    }
  };


  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    if (newBusinessName.trim() === "" || newUserName.trim() === "") {
        toast.error("Nama dan Nama Bisnis tidak boleh kosong.");
        setLoading(false);
        return;
    }
    
    if (newBusinessTitle.trim() === "" || newBusinessLocation.trim() === "") {
        toast.error("Judul Bisnis dan Lokasi Bisnis tidak boleh kosong.");
        setLoading(false);
        return;
    }

    try {
        await onUpdateSettings({
            businessName: newBusinessName,
            userName: newUserName,
            businessTitle: newBusinessTitle, 
            businessLocation: newBusinessLocation, 
            businessImage: newBusinessImage, 
        });

        toast.success("Pengaturan berhasil diperbarui!");
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

  const isFormUnchanged = 
    newBusinessName === currentBusinessName && 
    newUserName === currentUserName &&
    newBusinessTitle === currentBusinessTitle &&
    newBusinessLocation === currentBusinessLocation &&
    newBusinessImage === currentBusinessImage;

  return (
    <div className="space-y-6">
      {/* Main Settings Card */}
      <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-700 animate-fade-in relative">
        
        {/* TOP RIGHT ICONS CONTAINER (Theme Toggle & Delete Account) */}
        <div className="absolute top-4 right-4 flex gap-3">
             {/* Theme Toggle Icon (Sun/Moon) */}
            <button 
                type="button"
                onClick={handleThemeToggle}
                title={isDarkMode ? 'Ganti ke Mode Terang' : 'Ganti ke Mode Gelap'}
                className="text-xl text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-100 transition-colors"
            >
                {isDarkMode ? 
                    <i className="fas fa-sun text-yellow-500"></i> : 
                    <i className="fas fa-moon text-indigo-700"></i>
                }
            </button>
            
            {/* Delete Account Icon (Trash) */}
            <button 
                type="button"
                onClick={handleDeleteAccount}
                title="Hapus Akun Permanen"
                className="text-red-500 hover:text-red-700 dark:text-red-400 dark:hover:text-red-600 transition-colors"
            >
                <i className="fas fa-trash-alt text-xl"></i>
            </button>
        </div>


        <h2 className="text-xl font-bold text-slate-800 dark:text-slate-100 mb-6 flex items-center gap-2">
          <i className="fas fa-cog text-blue-600"></i> Pengaturan Akun & Bisnis
        </h2>

        <form onSubmit={handleSubmit} className="space-y-6">
          
          {/* User Name Setting */}
          <div className="p-4 border border-slate-100 dark:border-slate-700 rounded-lg">
            <label htmlFor="userName" className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">
              Nama Pengguna (Tampil di Dashboard)
            </label>
            <input
              id="userName"
              type="text"
              value={newUserName}
              onChange={(e) => setNewUserName(e.target.value)}
              placeholder="Cth: Budi Santoso"
              required
              // Light mode: bg-white, text-slate-800
              className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg text-sm focus:ring-1 focus:ring-blue-500 outline-none bg-white text-slate-800 dark:bg-slate-700 dark:text-slate-200"
              disabled={loading}
            />
            <p className="text-xs text-slate-500 mt-1">Email: <span className="font-mono text-slate-600 dark:text-slate-400">{currentUserEmail}</span></p>
          </div>

          {/* Business Name Setting (Name in Sidebar) */}
          <div className="p-4 border border-slate-100 dark:border-slate-700 rounded-lg">
            <label htmlFor="businessName" className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">
              Nama Bisnis (Di Sidebar & Banner)
            </label>
            <input
              id="businessName"
              type="text"
              value={newBusinessName}
              onChange={(e) => setNewBusinessName(e.target.value)}
              placeholder="Cth: Kopi Pintar AI"
              required
              className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg text-sm focus:ring-1 focus:ring-blue-500 outline-none bg-white text-slate-800 dark:bg-slate-700 dark:text-slate-200"
              disabled={loading}
            />
          </div>
          
          {/* Business Title (Title in Cards) */}
          <div className="p-4 border border-slate-100 dark:border-slate-700 rounded-lg">
            <label htmlFor="businessTitle" className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">
              Judul Bisnis (Tagline/Deskripsi Singkat)
            </label>
            <input
              id="businessTitle"
              type="text"
              value={newBusinessTitle}
              onChange={(e) => setNewBusinessTitle(e.target.value)}
              placeholder="Cth: Platform AI untuk UMKM"
              required
              className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg text-sm focus:ring-1 focus:ring-blue-500 outline-none bg-white text-slate-800 dark:bg-slate-700 dark:text-slate-200"
              disabled={loading}
            />
          </div>

          {/* Business Location */}
          <div className="p-4 border border-slate-100 dark:border-slate-700 rounded-lg">
            <label htmlFor="businessLocation" className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">
              Lokasi Bisnis (Untuk Analisis Pasar)
            </label>
            <input
              id="businessLocation"
              type="text"
              value={newBusinessLocation}
              onChange={(e) => setNewBusinessLocation(e.target.value)}
              placeholder="Cth: Jakarta Selatan"
              required
              className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg text-sm focus:ring-1 focus:ring-blue-500 outline-none bg-white text-slate-800 dark:bg-slate-700 dark:text-slate-200"
              disabled={loading}
            />
          </div>

          {/* Business Image URL */}
          <div className="p-4 border border-slate-100 dark:border-slate-700 rounded-lg flex items-center gap-4">
            <div className="flex-1">
              <label htmlFor="businessImage" className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">
                Gambar Bisnis (URL Logo/Ikon)
              </label>
              <input
                id="businessImage"
                type="url"
                value={newBusinessImage}
                onChange={(e) => setNewBusinessImage(e.target.value)}
                placeholder="/globe.svg"
                className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg text-sm focus:ring-1 focus:ring-blue-500 outline-none bg-white text-slate-800 dark:bg-slate-700 dark:text-slate-200"
                disabled={loading}
              />
            </div>
            <div className="flex-shrink-0">
                <p className="text-xs text-slate-500 mb-1">Preview:</p>
                <Image
                    src={newBusinessImage || '/globe.svg'}
                    alt="Business Icon"
                    width={48}
                    height={48}
                    className="rounded-lg object-cover border border-slate-200 dark:border-slate-600"
                />
            </div>
          </div>

          <div className="flex justify-end pt-4 border-t border-slate-200 dark:border-slate-700">
            <button
              type="submit"
              className="bg-blue-600 hover:bg-blue-700 disabled:bg-slate-400 text-white font-semibold py-2 px-6 rounded-lg transition-all flex items-center gap-2"
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
        </form>
      </div>
    </div>
  );
}