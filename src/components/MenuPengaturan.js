// src/components/MenuPengaturan.js
'use client';

import { useEffect, useState } from 'react';
import { saveUserSettings } from '@/lib/userSettings';

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

// PROVINCE -> CITIES mapping (Indonesia — 38 provinsi, contoh kota/kabupaten utama)
const PROVINCES = {
  "Aceh": [
    "Aceh Barat","Aceh Barat Daya","Aceh Besar","Aceh Jaya","Aceh Selatan","Aceh Singkil",
    "Aceh Tamiang","Aceh Tengah","Aceh Tenggara","Aceh Timur","Aceh Utara","Banda Aceh",
    "Bener Meriah","Bireuen","Blang Pidie","Gayo Lues","Jantho (Aceh Besar)","Kota Langsa",
    "Lhokseumawe","Meulaboh","Nagan Raya","Pidie","Pidie Jaya","Simeulue","Subulussalam"
  ],
  "Sumatera Utara": [
    "Asahan","Batu Bara","Binjai","Dairi","Deli Serdang","Humbang Hasundutan","Karo",
    "Labuhanbatu","Labuhanbatu Selatan","Labuhanbatu Utara","Langkat","Mandailing Natal",
    "Nias","Nias Barat","Nias Selatan","Nias Utara","Padang Lawas","Padang Lawas Utara",
    "Pakpak Bharat","Palas","Pematang Siantar","Samosir","Serdang Bedagai","Sibolga",
    "Simalungun","Tapanuli Selatan","Tapanuli Tengah","Tapanuli Utara","Taput (Tapanuli Utara)",
    "Toba Samosir","Tebing Tinggi","Tanjungbalai","Medan","Gunungsitoli"
  ],
  "Sumatera Barat": [
    "Agam","Dharmasraya","Kab. Kepulauan Mentawai","Kota Bukittinggi","Kota Padang","Kota Padang Panjang",
    "Kota Pariaman","Kota Payakumbuh","Kota Sawahlunto","Kota Solok","Kota Solok Selatan","Kota Sungai Penuh",
    "Kota Batusangkar","Kota Payakumbuh","Kota Pariaman","Kota Padang Pariaman","Kota Tanah Datar",
    "Pasaman","Pasaman Barat","Pesisir Selatan","Sijunjung","Solok","Solok Selatan"
  ],
  "Riau": [
    "Bengkalis","Indragiri Hilir","Indragiri Hulu","Kampar","Kepulauan Meranti","Kota Pekanbaru",
    "Kota Dumai","Kuansing (Rokan Hulu)","Pelalawan","Rokan Hilir","Rokan Hulu","Siak"
  ],
  "Kepulauan Bangka Belitung": [
    "Bangka","Bangka Barat","Bangka Selatan","Bangka Tengah","Belitung","Belitung Timur","Pangkal Pinang"
  ],
  "Jambi": [
    "Bungo","Kerinci","Merangin","Muaro Jambi","Sarolangun","Sungaipenuh","Tanjung Jabung Barat",
    "Tanjung Jabung Timur","Tebo","Kota Jambi"
  ],
  "Bengkulu": [
    "Bengkulu Selatan","Bengkulu Tengah","Bengkulu Utara","Kaur","Kota Bengkulu","Kepahiang","Lebong",
    "Rejang Lebong","Seluma","Muko-Muko"
  ],
  "Lampung": [
    "Lampung Barat","Lampung Selatan","Lampung Tengah","Lampung Timur","Lampung Utara","Mesuji",
    "Metro","Pesisir Barat","Pringsewu","Tanggamus","Tulang Bawang","Tulang Bawang Barat","Way Kanan",
    "Kota Bandar Lampung","Kota Metro","Baradatu"
  ],
  "DKI Jakarta": [
    "Jakarta Barat","Jakarta Pusat","Jakarta Selatan","Jakarta Timur","Jakarta Utara","Kepulauan Seribu"
  ],
  "Banten": [
    "Kab. Serang","Kota Serang","Tangerang","Kota Tangerang","Kota Tangerang Selatan","Kota Cilegon",
    "Pandeglang","Lebak","Tangerang","Tangerang Selatan"
  ],
  "Jawa Barat": [
    "Bandung","Bandung Barat","Bekasi","Bogor","Ciamis","Cianjur","Cirebon","Garut","Indramayu","Kota Bandung",
    "Kota Bekasi","Kota Bogor","Kota Cirebon","Kota Sukabumi","Kota Tasikmalaya","Kuningan","Majalengka",
    "Pangandaran","Purwakarta","Subang","Sukabumi","Sumedang","Tasikmalaya"
  ],
  "Jawa Tengah": [
    "Banjarnegara","Banyumas","Batang","Blora","Boyolali","Brebes","Cilacap","Demak","Grobogan","Jepara",
    "Karanganyar","Kebumen","Kendal","Klaten","Kudus","Magelang","Pati","Pekalongan","Pemalang","Purbalingga",
    "Purworejo","Rembang","Semarang","Sragen","Sukoharjo","Tegal","Temanggung","Wonogiri","Wonosobo",
    "Kota Magelang","Kota Pekalongan","Kota Salatiga","Kota Semarang","Kota Surakarta (Solo)","Kota Tegal"
  ],
  "DI Yogyakarta": [
    "Bantul","Gung Kidul (Gunungkidul)","Kota Yogyakarta","Kulon Progo","Sleman"
  ],
  "Jawa Timur": [
    "Bangkalan","Banyuwangi","Blitar","Bojonegoro","Bondowoso","Gresik","Jember","Jombang","Kediri",
    "Kota Batu","Kota Blitar","Kota Kediri","Kota Madiun","Kota Malang","Kota Mojokerto","Kota Pasuruan",
    "Kota Probolinggo","Kota Surabaya","Lamongan","Lumajang","Madiun","Magetan","Mojokerto","Nganjuk","Pacitan",
    "Pamekasan","Pasuruan","Ponorogo","Probolinggo","Sampang","Sidoarjo","Situbondo","Sumenep","Trenggalek",
    "Tuban","Tulungagung"
  ],
  "Bali": [
    "Badung","Bangli","Buleleng","Gianyar","Jembrana","Karangasem","Klungkung","Kota Denpasar","Tabanan"
  ],
  "Nusa Tenggara Barat": [
    "Bima","Dompu","Kab. Lombok Barat","Kab. Lombok Tengah","Kab. Lombok Timur","Kab. Lombok Utara",
    "Sumbawa","Sumbawa Barat","Kota Bima","Kota Mataram"
  ],
  "Nusa Tenggara Timur": [
    "Alor","Belu","Ende","Flores Timur","Kupang","Lembata","Manggarai","Manggarai Barat","Manggarai Timur",
    "Nagekeo","Ngada","Rote Ndao","Sabu Raijua","Sikka","Sumba Barat","Sumba Barat Daya","Sumba Tengah",
    "Sumba Timur","Kupang Kota"
  ],
  "Kalimantan Barat": [
    "Bengkayang","Kapuas Hulu","Kayong Utara","Kubu Raya","Lanud","Melawi","Mempawah","Pontianak",
    "Sambas","Sanggau","Sintang","Singkawang","Ketapang"
  ],
  "Kalimantan Tengah": [
    "Barito Selatan","Barito Timur","Barito Utara","Gunung Mas","Kapuas","Katingan","Lamandau",
    "Murung Raya","Pulang Pisau","Palangka Raya","Sukamara","Kotawaringin Barat","Kotawaringin Timur"
  ],
  "Kalimantan Selatan": [
    "Balangan","Banjar","Barito Kuala","Hulu Sungai Selatan","Hulu Sungai Tengah","Hulu Sungai Utara",
    "Tabalong","Tanah Bumbu","Tanah Laut","Tapin","Banjarmasin","Banjarbaru"
  ],
  "Kalimantan Timur": [
    "Berau","Kota Balikpapan","Kota Bontang","Kota Samarinda","Kutai Barat","Kutai Kartanegara",
    "Kutai Timur","Paser","Penajam Paser Utara"
  ],
  "Kalimantan Utara": [
    "Bulungan","Malinau","Nunukan","Tana Tidung","Tarakan"
  ],
  "Sulawesi Utara": [
    "Bolaang Mongondow","Kepulauan Sangihe","Kepulauan Talaud","Kota Bitung","Kota Kotamobagu","Kota Manado",
    "Kota Tomohon","Minahasa","Minahasa Selatan","Minahasa Tenggara","Minahasa Utara"
  ],
  "Gorontalo": [
    "Boalemo","Gorontalo","Gorontalo Utara","Pohuwato","Bone Bolango","Kota Gorontalo"
  ],
  "Sulawesi Tengah": [
    "Banggai","Donggala","Morowali","Palu","Poso","Sigi","Tojo Una-Una","Buol","Banggai Kepulauan"
  ],
  "Sulawesi Barat": [
    "Majene","Mamasa","Mamuju","Mamuju Tengah","Mamuju Utara","Polewali Mandar"
  ],
  "Sulawesi Selatan": [
    "Barru","Bantaeng","Bone","Bulukumba","Enrekang","Gowa","Jeneponto","Kabupaten Kepulauan Selayar",
    "Luwu","Luwu Timur","Luwu Utara","Makassar","Maros","Parepare","Pangkajene Kepulauan","Pinrang",
    "Polewali Mandar (part)","Sidenreng Rappang (Sidenreng Rappang)","Sinjai","Soppeng","Takalar",
    "Tana Toraja","Toraja Utara","Wajo"
  ],
  "Sulawesi Tenggara": [
    "Bau-Bau","Buton","Kendari","Kolaka","Muna","Bombana","Wakatobi","Konawe","Konawe Selatan","Konawe Utara"
  ],
  "Maluku": [
    "Ambon","Buru","Buru Selatan","Maluku Tengah","Maluku Tenggara","Maluku Tenggara Barat","Seram Bagian Barat",
    "Seram Bagian Timur","Tual"
  ],
  "Maluku Utara": [
    "Halmahera Barat","Halmahera Tengah","Halmahera Utara","Halmahera Selatan","Halmahera Timur","Kota Ternate",
    "Kota Tidore Kepulauan","Pulau Taliabu","Pulau Morotai"
  ],
  "Papua": [
    "Asmat","Boven Digoel","Biak Numfor","Bintuni (Teluk Bintuni)","Deiyai","Dogiyai","Jayapura","Jayawijaya",
    "Keerom","Mamberamo Raya","Mamberamo Tengah","Mappi","Merauke","Mimika","Nabire","Nduga","Paniai","Pegunungan Bintang",
    "Puncak","Puncak Jaya","Sarmi","Sinak (Sinaru)","Supiori","Tolikara","Yahukimo","Yalimo"
  ],
  "Papua Barat": [
    "Fakfak","Kaimana","Manokwari","Maybrat","Pegunungan Arfak","Raja Ampat","Sorong","Sorong Selatan","Tambrauw","Teluk Bintuni",
    "Teluk Wondama"
  ],
  // New provinces from pemekaran (Papua Tengah, Papua Pegunungan, Papua Selatan, Papua Barat Daya)
  "Papua Tengah": ["Nabire","Paniai","Dogiyai","Deiyai","Intan Jaya","Mimika (part)"],
  "Papua Pegunungan": ["Jayawijaya","Yalimo","Lanny Jaya","Mamberamo Tengah"],
  "Papua Selatan": ["Merauke","Boven Digoel","Mappi","Asmat","Bintuni"],
  "Papua Barat Daya": ["Kaimana","Teluk Arguni","Raja Ampat","Sorong Selatan"]
};


export default function MenuPengaturan({ 
  currentBusinessName, 
  currentUserName, 
  currentUserEmail, 
  currentBusinessLocation, 
  currentBusinessDescription = '',
  onUpdateSettings, 
  onDeleteAccount 
}) {
  // use injected hooks if available, otherwise fallback to wrappers above
  const toast = (typeof useToast === 'function') ? useToast() : _toast;
  const alert = (typeof useAlert === 'function') ? useAlert() : _alert;
  const [newBusinessName, setNewBusinessName] = useState(currentBusinessName);
  const [newUserName, setNewUserName] = useState(currentUserName);
  const [newBusinessLocation, setNewBusinessLocation] = useState(currentBusinessLocation);
  const [newBusinessDescription, setNewBusinessDescription] = useState(currentBusinessDescription);
  // state
  const [newProvince, setNewProvince] = useState("");
  const [newCity, setNewCity] = useState("");
  const [loading, setLoading] = useState(false);
  const [isDarkMode, setIsDarkMode] = useState(false); // State tema lokal hanya untuk icon

  useEffect(() => {
    // Sync local form state
    setNewBusinessName(currentBusinessName);
    setNewUserName(currentUserName);
    setNewBusinessDescription(currentBusinessDescription || '');
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
    setIsDarkMode(document.documentElement.classList.contains('dark'));
  }, [currentBusinessName, currentUserName, currentBusinessLocation, currentBusinessDescription]);

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

    try {
        await onUpdateSettings({
            businessName: newBusinessName,
            userName: newUserName,
            // combine province + optional city
          businessLocation: newProvince + (newCity ? `, ${newCity}` : ""),
          businessDescription: newBusinessDescription,
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

  // derive current province/city for comparison
  const _currProvince = currentBusinessLocation && currentBusinessLocation.includes(",")
    ? currentBusinessLocation.split(",").map(p=>p.trim())[0]
    : (currentBusinessLocation || "");
  const _currCity = currentBusinessLocation && currentBusinessLocation.includes(",")
    ? currentBusinessLocation.split(",").map(p=>p.trim())[1] || ""
    : "";
  const isFormUnchanged = 
    newBusinessName === currentBusinessName && 
    newUserName === currentUserName &&
    newProvince === _currProvince &&
    newCity === _currCity &&
    (newBusinessDescription || '') === (currentBusinessDescription || '');

  return (
    <div className="space-y-6">
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Pengaturan nama dan lokasi */}
        <div className="space-y-6">
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-700">
            <h3 className="text-lg font-semibold text-slate-800 dark:text-slate-100 mb-4">Pengaturan Bisnis & Akun</h3>

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
                <p className="text-xs text-slate-500 mt-1">Opsional, tetapi membantu AI memahami bisnismu.</p>
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
                  className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg text-sm bg-white:bg-slate-900 text-slate-900 dark:text-slate-900"
                  disabled={loading}
                />
                <p className="text-xs text-slate-900 mt-2">Email: <span className="font-mono">{currentUserEmail}</span></p>
              </div>

              {/* Judul Bisnis dihapus sesuai permintaan */}

              <div className="md:col-span-1">
                <label className="block text-sm font-semibold text-slate-700 dark:text-slate-900 mb-2">Provinsi</label>
                <select
                  value={newProvince}
                  onChange={(e) => { setNewProvince(e.target.value); setNewCity(""); }}
                  className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg text-sm bg-white:bg-slate-800 text-slate-900 dark:text-slate-900"
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
                  className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg text-sm bg-white:bg-slate-800 text-slate-900 dark:text-slate-900"
                  disabled={loading || !newProvince}
                >
                  <option value="">{newProvince ? "(Opsional) Pilih Kota/Kabupaten" : "Pilih provinsi dulu"}</option>
                  {(PROVINCES[newProvince] || []).map((c) => (
                    <option key={c} value={c}>{c}</option>
                  ))}
                </select>
                {!newProvince && <p className="text-xs text-slate-400 mt-1">Pilih provinsi terlebih dahulu untuk memilih kota.</p>}
              </div>

              {/* Additional settings can be added here */}
            </div>
          </div>

          {/* Actions */}
          <div className="flex justify-end gap-3">
            <button
              type="submit"
              className="bg-blue-600 hover:bg-blue-700 disabled:bg-slate-700 text-white font-semibold py-2 px-6 rounded-lg transition-all flex items-center gap-2"
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