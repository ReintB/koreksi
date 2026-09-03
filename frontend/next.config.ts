import type { NextConfig } from "next";

// Alamat backend dibaca dari environment supaya build yang sama bisa dipakai
// di mana pun: lokal memakai default di bawah, host lain (Vercel, staging)
// tinggal mengisi BACKEND_URL. Slash di ujung dibuang agar tidak jadi "//api".
const BACKEND_URL = (
  process.env.BACKEND_URL ?? "http://127.0.0.1:9101"
).replace(/\/+$/, "");

const nextConfig: NextConfig = {
  reactCompiler: true,
  async rewrites() {
    // `fallback` dijalankan setelah dynamic route, bukan sebelumnya seperti
    // rewrite biasa. Bedanya menentukan: /api/auth/callback/google hanya
    // dilayani catch-all [...nextauth] yang dinamis, sehingga dengan rewrite
    // biasa ia keburu diproksikan ke backend dan login gagal. Di sini
    // artinya jadi tepat — teruskan ke backend hanya yang tidak ditangani
    // aplikasi ini sendiri.
    return {
      fallback: [
        {
          source: "/api/:path*",
          destination: `${BACKEND_URL}/api/:path*`,
        },
      ],
    };
  },
};

export default nextConfig;
