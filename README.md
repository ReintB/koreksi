# Koreksi Tugas

Sistem koreksi otomatis tugas video praktikum berbasis **Next.js + FastAPI + PostgreSQL**.

Production URL:

- https://koreksi.otomasi.app
- Frontend PM2: `koreksi-frontend` → port `9100`
- Backend PM2: `koreksi-backend` → port `9101`

## Arsitektur

```text
Cloudflare Tunnel
      │
      ▼
koreksi.otomasi.app
      │
      ▼
Next.js :9100
      │ /api/* rewrite
      ▼
FastAPI :9101
      │
      ├── PostgreSQL
      ├── Google OAuth
      ├── VIOLA-GENERATE
      └── /home/sirobo/koreksi/data
```
## Alur Koreksi

1. Mahasiswa login memakai Google OAuth.
2. Admin menghubungkan akun Google ke NIM roster PostgreSQL.
3. Mahasiswa memilih mata kuliah/tugas dan mengirim link YouTube.
4. Backend mencoba mengambil subtitle/VTT lebih dahulu.
5. Jika subtitle gagal, video/audio diproses dengan FFmpeg + STT.
6. Transkrip dan rubrik dikirim ke model `VIOLA-GENERATE`.
7. Skor, evaluasi rubrik, audit event, dan transkrip disimpan ke PostgreSQL.
8. Laporan DOCX dibuat dan disimpan di data root.
9. Nilai legacy dapat disinkronkan ke `Nilai.xlsx` untuk kompatibilitas arsip lama.

## Data

Semua materi dan output runtime berada di luar Git:

```text
/home/sirobo/koreksi/data/
├── MataKuliah/
├── Koreksi/
├── transcripts/
├── rubrics/
├── runtime/
└── auth/
```

Folder `data/` sengaja masuk `.gitignore` agar materi mahasiswa, transkrip, nilai, dan hasil koreksi tidak ter-push ke repository.
## Autentikasi dan Admin

Google OAuth callback:

```text
https://koreksi.otomasi.app/api/auth/google/callback
```

Admin utama dikonfigurasi melalui environment `ADMIN_EMAIL`. Pada deployment saat ini akun admin utama adalah `rofiqcp@gmail.com`.

Halaman admin:

- `/admin` — submission dan status koreksi
- `/admin/rekap` — rekap per kelas/tugas
- `/admin/tugas` — mata kuliah, tugas, rubrik, kelas, angkatan
- `/admin/pengguna` — user Google, login terakhir, role, status, dan relasi akun ke NIM

Endpoint perubahan master data, user, retry, dan override skor dilindungi role admin.

## Environment

Secret **tidak boleh dimasukkan ke Git**. Backend membaca konfigurasi dari `backend/.env`.

Variabel utama meliputi `DATABASE_URL`, `AI_BASE_URL`, `AI_API_KEY`, `AI_MODEL`, `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`, `GOOGLE_CALLBACK_URL`, `SESSION_SECRET`, `JWT_SECRET`, `JWT_SECRET_KEY`, `FRONTEND_URL`, dan `ADMIN_EMAIL`.
## Operasional

Gunakan `/home/sirobo/koreksi/server.sh`:

```bash
./server.sh 1        # start PM2
./server.sh 2        # backend check/seed + frontend lint/build
./server.sh 3        # stop service Koreksi
./server.sh 4        # status, port, health
./server.sh restart  # restart frontend + backend
./server.sh logs     # log PM2 Koreksi
```

Health backend:

```bash
curl http://127.0.0.1:9101/api/health
curl http://127.0.0.1:9100/api/health
```

Frontend meneruskan `/api/*` ke backend internal `127.0.0.1:9101`, sehingga backend tidak perlu dipublikasikan langsung oleh Cloudflare.

## Development

Frontend: Next.js 16 + React 19 + TypeScript. Backend: FastAPI + SQLAlchemy + PostgreSQL. Sebelum perubahan frontend, ikuti panduan Next.js lokal di `frontend/node_modules/next/dist/docs/` sesuai `AGENTS.md` bila tersedia.
