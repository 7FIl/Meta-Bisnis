// next.config.mjs

/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    // Tambahkan hostname ini untuk mengizinkan gambar profil Google
    domains: ['lh3.googleusercontent.com'],
  },
};

export default nextConfig;