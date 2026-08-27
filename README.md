# Koreksi Tugas

Sistem koreksi otomatis untuk tugas video praktikum Teknologi Rekayasa Otomasi (TRO). Mahasiswa mengirim link video YouTube penjelasan materi; sistem (nantinya) mentranskrip video tersebut dan mencocokkannya dengan rubrik tugas untuk menghasilkan penilaian per topik secara otomatis.

Lihat [`PRODUCT.md`](./PRODUCT.md) untuk detail produk, pengguna, dan status pengembangan saat ini.

## Menjalankan proyek

```bash
npm install
npm run dev
```

Buka [http://localhost:3000](http://localhost:3000) di browser.

## Struktur singkat

- `src/app/(mahasiswa)` — halaman mahasiswa: kirim tugas, riwayat pengumpulan, profil.
- `src/app/admin` — halaman admin (asisten praktikum & dosen): daftar pengumpulan dan pengaturan tugas/rubrik/kelas/angkatan.
- `src/app/login` — halaman login (Google, belum terhubung ke `next-auth`).
- `src/components/ui` — komponen shadcn/ui.
- `src/lib`, `src/hooks` — data master (localStorage, sementara) dan util.

## Status

Frontend sudah dibangun dengan data contoh (dummy). Belum terhubung: autentikasi Google, backend/API pengumpulan tugas, transkripsi video, dan mesin penilaian berbasis LLM.
