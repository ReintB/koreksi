-- Skema Koreksi Tugas.
--
-- Bentuknya diturunkan dari tipe yang sudah dituntut frontend di
-- src/lib/master-data.ts, src/lib/submission.ts, dan src/hooks/use-submissions.ts.
-- Kolom sengaja memakai snake_case; pemetaan ke camelCase dilakukan di
-- lapisan route handler, bukan di sini.
--
-- Jalankan ulang aman: semua objek dibuat dengan IF NOT EXISTS.

-- ---------- master data ----------

CREATE TABLE IF NOT EXISTS mata_kuliah (
  id    text PRIMARY KEY,
  nama  text NOT NULL
);

CREATE TABLE IF NOT EXISTS tugas (
  id               text PRIMARY KEY,
  mata_kuliah_id   text NOT NULL REFERENCES mata_kuliah(id) ON DELETE CASCADE,
  nomor            integer NOT NULL,
  judul            text NOT NULL,
  -- null berarti tugas tanpa batas waktu
  tenggat          timestamptz,
  rubrik_file_name text,
  rubrik_text      text,
  UNIQUE (mata_kuliah_id, nomor)
);

CREATE TABLE IF NOT EXISTS kelas_praktikum (
  id    text PRIMARY KEY,
  nama  text NOT NULL
);

CREATE TABLE IF NOT EXISTS angkatan (
  id    text PRIMARY KEY,
  tahun text NOT NULL
);

-- ---------- roster mahasiswa ----------

CREATE TABLE IF NOT EXISTS mahasiswa (
  id       text PRIMARY KEY,
  nim      text NOT NULL UNIQUE,
  nama     text NOT NULL,
  angkatan text NOT NULL,
  email    text,
  -- Satu kelas praktikum berlaku untuk seluruh mata kuliah yang diambil.
  kelas    text
);

-- ---------- akun google ----------

-- Identitas dijamin Google; baris ini menyimpan yang tidak diketahui Google:
-- peran, status aktif, jejak login, dan tautan ke baris roster.
CREATE TABLE IF NOT EXISTS app_user (
  id          text PRIMARY KEY,
  email       text NOT NULL UNIQUE,
  name        text NOT NULL,
  avatar_url  text,
  role        text NOT NULL DEFAULT 'user' CHECK (role IN ('user', 'admin')),
  active      boolean NOT NULL DEFAULT true,
  login_count integer NOT NULL DEFAULT 0,
  last_login  timestamptz,
  created_at  timestamptz NOT NULL DEFAULT now(),
  -- Penautan ke roster dilakukan admin, bukan diisi mahasiswa sendiri.
  nim         text REFERENCES mahasiswa(nim) ON DELETE SET NULL
);

-- ---------- pengumpulan ----------

CREATE TABLE IF NOT EXISTS submission (
  id             text PRIMARY KEY,
  nim            text NOT NULL REFERENCES mahasiswa(nim) ON DELETE CASCADE,
  mata_kuliah_id text NOT NULL REFERENCES mata_kuliah(id) ON DELETE CASCADE,
  tugas_id       text NOT NULL REFERENCES tugas(id) ON DELETE CASCADE,
  link_youtube   text NOT NULL,
  link_drive     text,
  status         text NOT NULL DEFAULT 'menunggu'
                 CHECK (status IN ('menunggu', 'diproses', 'selesai', 'gagal')),
  -- Hasil mesin dan hasil koreksi manual disimpan terpisah supaya nilai
  -- otomatis tidak hilang saat asprak menimpanya. Frontend menampilkan
  -- skor_manual bila ada, dan menandainya sebagai "ditimpa".
  skor_otomatis  integer CHECK (skor_otomatis BETWEEN 0 AND 100),
  skor_manual    integer CHECK (skor_manual BETWEEN 0 AND 100),
  catatan_timpa  text,
  transkrip      text,
  error_message  text,
  dikirim_pada   timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS submission_nim_idx ON submission (nim);
CREATE INDEX IF NOT EXISTS submission_tugas_idx ON submission (tugas_id);

CREATE TABLE IF NOT EXISTS evaluasi (
  id            text PRIMARY KEY,
  submission_id text NOT NULL REFERENCES submission(id) ON DELETE CASCADE,
  materi        text NOT NULL,
  status        text NOT NULL CHECK (status IN ('terpenuhi', 'sebagian', 'belum')),
  catatan       text,
  urutan        integer NOT NULL DEFAULT 0
);

CREATE INDEX IF NOT EXISTS evaluasi_submission_idx ON evaluasi (submission_id);

-- ---------- kode mata kuliah ----------

-- Ditambahkan belakangan, jadi ditulis sebagai ALTER agar database yang sudah
-- berisi data tidak perlu dibuat ulang. Boleh kosong: mata kuliah yang sudah
-- ada tidak punya kode, dan tampilan menanganinya dengan menyembunyikan
-- awalan kode alih-alih menampilkan strip kosong.
ALTER TABLE mata_kuliah ADD COLUMN IF NOT EXISTS kode text;

-- ---------- satu pengumpulan per tugas ----------

-- Seluruh tampilan memperlakukan satu mahasiswa punya paling banyak satu
-- pengumpulan per tugas: rekap mencarinya dengan find, dan ringkasan status
-- menghitung per baris. Tanpa batasan ini pengiriman ulang menghasilkan baris
-- kedua, dan rekap diam-diam memilih salah satunya. Dibuat sebagai unique
-- index, bukan constraint, karena hanya index yang mendukung IF NOT EXISTS.
CREATE UNIQUE INDEX IF NOT EXISTS submission_nim_tugas_idx
  ON submission (nim, tugas_id);

-- ---------- kelas praktikum menjadi tunggal ----------

-- Semula kelas disimpan per mata kuliah pada tabel mahasiswa_kelas. Ternyata
-- satu mahasiswa hanya punya satu kelas praktikum yang berlaku untuk seluruh
-- mata kuliah, sehingga tabel itu tidak diperlukan. Dua pernyataan berikut
-- merapikan database yang terlanjur memakai bentuk lama; isinya dipindahkan
-- lebih dahulu ke mahasiswa.kelas sebelum tabel lamanya dibuang.
ALTER TABLE mahasiswa ADD COLUMN IF NOT EXISTS kelas text;
DROP TABLE IF EXISTS mahasiswa_kelas;

-- ---------- mata kuliah milik satu angkatan ----------

-- Tiap angkatan mengambil mata kuliah praktikum yang berbeda. Penanda itu
-- ditaruh sebagai kolom pada mata kuliah, bukan tabel penghubung, karena
-- tugas beserta tenggat dan rubriknya menggantung pada satu baris mata
-- kuliah: satu baris yang dipakai bersama dua angkatan berarti keduanya ikut
-- berbagi tenggat yang sama, padahal jelas berbeda. Angkatan berikutnya yang
-- mengambil mata kuliah bernama sama dibuat sebagai baris tersendiri dengan
-- tugasnya sendiri.
--
-- Boleh kosong, dan kosong berarti berlaku untuk semua angkatan. Baris yang
-- terlanjur ada belum punya angkatan, dan menyembunyikannya dari semua orang
-- lebih merugikan daripada menampilkannya terlalu luas.
ALTER TABLE mata_kuliah ADD COLUMN IF NOT EXISTS angkatan text;
