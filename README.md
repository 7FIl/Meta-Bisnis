Berdasarkan analisis mendalam terhadap kode sumber yang Anda unggah, berikut adalah README.md yang komprehensif dan profesional untuk proyek Meta Bisnis.

Dokumen ini mencakup deskripsi proyek, fitur teknis, cara instalasi, dan struktur kode.

🚀 Meta Bisnis - Asisten Cerdas UMKM Indonesia
Meta Bisnis adalah platform web terintegrasi berbasis AI yang dirancang untuk memberdayakan UMKM di Indonesia. Aplikasi ini membantu pengguna mulai dari tahap ideasi bisnis (konsultasi modal, lokasi, minat) hingga manajemen operasional sehari-hari (stok, keuangan, pemasaran, dan SDM).

Dibangun menggunakan Next.js dan ditenagai oleh Groq AI (Llama 3) serta Firebase, aplikasi ini menawarkan solusi all-in-one yang modern, responsif, dan mudah digunakan.

✨ Fitur Utama
1. 🤖 Konsultasi & Pendirian Bisnis (AI-Powered)
Rekomendasi Bisnis: Analisis peluang bisnis berdasarkan input modal, lokasi, dan minat pengguna.

Analisis Finansial Mendalam: Estimasi BEP (Break Even Point), ROI, dan margin keuntungan.

Export Rincian Modal: Menghasilkan file Excel (.xlsx) berisi rincian belanja modal dan proyeksi keuangan secara otomatis.

Onboarding Fleksibel: Mendukung pengguna yang baru ingin memulai bisnis atau yang sudah memiliki bisnis berjalan.

2. 📊 Dashboard Operasional
Manajemen Stok (Inventory): CRUD (Create, Read, Update, Delete) barang dengan pelacakan harga beli dan harga jual.

Kasir & Riwayat Penjualan: Pencatatan transaksi penjualan real-time yang terhubung langsung dengan pengurangan stok.

Manajemen Karyawan: Sistem absensi sederhana (Hadir, Sakit, Izin, Alfa) dan manajemen data pegawai.

Kalender Kegiatan: Penjadwalan event manual atau rencana konten pemasaran.

3. 💰 Manajemen Keuangan
Laporan Otomatis: Perhitungan otomatis untuk Penjualan Kotor, Pendapatan Lain, dan Pengeluaran Pemasaran.

Filter Periode: Filter laporan keuangan berdasarkan rentang tanggal atau bulan tertentu.

Ekspor Data: Kemampuan mengunduh laporan keuangan dalam format CSV.

4. 📢 Studio Pemasaran AI & Market Intelligence
Generator Konten: Membuat caption Instagram, skrip TikTok, dan pesan broadcast WhatsApp menggunakan AI yang disesuaikan dengan tone brand.

Market Intelligence: Grafik trafik toko dan analisis tren pasar viral (menggunakan integrasi Tavily API untuk data real-time).

Chatbot Bisnis: Asisten virtual kontekstual yang memahami data bisnis pengguna untuk menjawab pertanyaan strategi.

🛠️ Tech Stack
Frontend: Next.js 16 (App Router), React 19

Styling: Tailwind CSS v4

Backend / API: Next.js API Routes

Database & Auth: Google Firebase (Firestore, Authentication, Storage)

AI Integration:

Groq API (LLM Inference - Llama 3)

Tavily API (Real-time Web Search & Trends)

Utilities:

xlsx: Generasi file Excel.

chart.js: Visualisasi data grafik.

react-toastify (Custom implementation): Notifikasi UI.

⚙️ Persyaratan Sistem
Node.js (versi 18.17 atau lebih baru)

npm / yarn / pnpm

Akun Firebase (untuk database dan autentikasi)

API Key Groq (untuk fitur AI)

API Key Tavily (untuk fitur pencarian tren)

🚀 Cara Instalasi & Menjalankan
Clone Repository

Bash

git clone https://github.com/username-anda/meta-bisnis.git
cd meta-bisnis
Install Dependencies

Bash

npm install
# atau
yarn install
Konfigurasi Environment Variables Buat file .env.local di root folder dan isi dengan kredensial berikut (lihat Sample.env.txt):

Cuplikan kode

NEXT_PUBLIC_APP_URL=http://localhost:3000

# Firebase Config
NEXT_PUBLIC_FIREBASE_API_KEY=your_api_key
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your_project_id.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your_project_id
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your_project_id.appspot.com
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
NEXT_PUBLIC_FIREBASE_APP_ID=your_app_id

# AI Providers
TAVILY_API_KEY=tvly-xxxxxxxxxxxx
GROQ_API_KEY=gsk_xxxxxxxxxxxx
Jalankan Server Development

Bash

npm run dev
Buka http://localhost:3000 di browser Anda.

wm Struktur Proyek
meta-bisnis/
├── src/
│   ├── app/                 # Next.js App Router
│   │   ├── api/             # API Routes (Chat, News)
│   │   ├── verify/          # Halaman Verifikasi Email
│   │   ├── layout.js        # Root Layout & Providers
│   │   └── page.js          # Main Controller (Logic Switching View)
│   ├── components/          # Komponen UI Reusable
│   │   ├── DashboardView.js # Tampilan Utama setelah Login
│   │   ├── ConsultationView.js # Tampilan Awal (Landing/Konsultasi)
│   │   ├── MarketingStudio.js  # Fitur Generasi Konten
│   │   ├── MenuKeuangan.js     # Laporan Keuangan
│   │   ├── MenuStokBarang.js   # Manajemen Inventaris
│   │   └── ... (Komponen lainnya)
│   └── lib/                 # Helper Functions & Configs
│       ├── firebase.js      # Inisialisasi Firebase
│       ├── auth.js          # Logic Login/Register
│       ├── excelGenerator.js# Logic pembuatan file Excel
│       └── businessData.js  # CRUD ke Firestore
├── public/                  # Aset Statis (Gambar, Icon)
├── .env.local               # Environment Variables (Jangan di-commit)
└── package.json
🔐 Aturan Keamanan & Privasi
Autentikasi: Menggunakan Firebase Auth. Hanya domain email umum (Gmail, Yahoo, dll) yang diizinkan mendaftar untuk mencegah spam bot.

Data Pengguna: Data bisnis dan profil disimpan di Firestore dengan aturan keamanan (Security Rules) yang membatasi akses hanya kepada pemilik data (users/{uid}).

Verifikasi Email: Pengguna diwajibkan memverifikasi email sebelum bisa login sepenuhnya.

🤝 Kontribusi
Kontribusi sangat diterima! Silakan buat Pull Request atau laporkan Issues jika menemukan bug atau memiliki ide fitur baru.

Fork repository ini.

Buat branch fitur baru (git checkout -b fitur-keren).

Commit perubahan Anda (git commit -m 'Menambahkan fitur keren').

Push ke branch (git push origin fitur-keren).

Buat Pull Request.

📄 Lisensi
Proyek ini dilisensikan di bawah MIT License.

Dibuat dengan ❤️ untuk kemajuan UMKM Indonesia.
