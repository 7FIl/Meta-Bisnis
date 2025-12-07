This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://github.com/vercel/next.js/tree/canary/packages/create-next-app).

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.js`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.

✨ Fitur Utama

Meta Bisnis dirancang untuk membantu pengguna:
Konsultasi Ide Bisnis & Analisis Modal AI
Pengguna dapat memasukkan modal, lokasi, dan minat, lalu AI akan merekomendasikan ide bisnis yang cuan (menguntungkan).
Hasil rekomendasi mencakup perkiraan modal (capital_est), target pasar, tantangan utama, dan laporan rincian modal dalam format Excel (XLSX).
Fitur onboarding manual juga tersedia untuk pengguna yang sudah memiliki bisnis.

Dashboard Operasional
Manajemen Stok Barang: Pencatatan dan pembaruan inventaris dengan harga beli dan harga jual.
Riwayat Penjualan: Pencatatan transaksi penjualan, pengeluaran pemasaran, dan pendapatan lain-lain, dengan opsi ekspor ke CSV.
Kehadiran Karyawan: Pencatatan dan pengelolaan status kehadiran karyawan.

Laporan dan Analisis Keuangan
Menampilkan ringkasan dan rincian Laporan Keuangan (Penjualan, Pendapatan Lain, Pengeluaran Pemasaran) dengan filter periode bulanan atau rentang tanggal.

Chat AI & Pemasaran Otomatis
Chat AI: Fitur chatbot yang dapat menjawab pertanyaan seputar Analisis Bisnis, Ide Keuangan, dan Strategi Penjualan berdasarkan konteks bisnis yang sedang berjalan.
Web Search: Chat AI dapat diaktifkan dengan Web Search menggunakan Tavily API untuk mendapatkan data dan tren real-time.
Studio Pemasaran AI: Generator konten promosi (caption) yang disesuaikan untuk platform Instagram, TikTok, dan WhatsApp menggunakan konteks brand bisnis.

🛠️ Teknologi yang Digunakan

Frontend Framework: Next.js
UI/Styling: React, Tailwind CSS
Database & Backend-as-a-Service: Google Firebase
Authentication: Firebase Auth (Email/Password, Google Sign-In)
Database: Cloud Firestore (untuk menyimpan data pengguna dan bisnis)
AI/LLM Providers:
Groq API (untuk chat dan content generation)
Tavily API (untuk web search data real-time)

Data Processing: xlsx (untuk menghasilkan file Excel).

🧩 Skrip yang Tersedia
Dalam direktori proyek, Anda dapat menjalankan:
dev (Perintah: next dev) untuk Menjalankan aplikasi dalam mode pengembangan.
build (Perintah: next build) untuk Membuat build siap produksi.
start (Perintah: next start) untuk Menjalankan build produksi yang sudah dikompilasi.
lint (Perintah: eslint) untuk Menjalankan linter untuk memeriksa kode.

