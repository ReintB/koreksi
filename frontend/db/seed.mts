/**
 * Mengisi database dengan data contoh, supaya setiap halaman langsung punya
 * isi dan endpoint bisa diuji dengan data yang masuk akal.
 *
 * Sumbernya src/lib/dummy-data.ts dan initialMasterData — bukan salinan baru,
 * supaya tidak ada dua versi data contoh yang bisa berbeda.
 *
 * Jalankan dari folder frontend:
 *   npx tsx --env-file=.env.local db/seed.mts
 *
 * Aman diulang: setiap penyisipan memakai ON CONFLICT.
 */
import { neon } from "@neondatabase/serverless";

import { dummyAdminSubmissions, dummyMahasiswa } from "@/lib/dummy-data";
import { initialMasterData } from "@/lib/master-data";

const url = process.env.DATABASE_URL;

if (!url) {
  console.error("DATABASE_URL belum diisi. Lihat frontend/.env.example.");
  process.exit(1);
}

const sql = neon(url);

// ---------- master data ----------

for (const item of initialMasterData.mataKuliah) {
  await sql`INSERT INTO mata_kuliah (id, nama, kode, angkatan)
            VALUES (${item.id}, ${item.nama}, ${item.kode}, ${item.angkatan})
            ON CONFLICT (id) DO UPDATE SET
              nama = EXCLUDED.nama,
              kode = EXCLUDED.kode,
              angkatan = EXCLUDED.angkatan`;
}

for (const item of initialMasterData.kelasPraktikum) {
  await sql`INSERT INTO kelas_praktikum (id, nama) VALUES (${item.id}, ${item.nama})
            ON CONFLICT (id) DO UPDATE SET nama = EXCLUDED.nama`;
}

for (const item of initialMasterData.angkatan) {
  await sql`INSERT INTO angkatan (id, tahun) VALUES (${item.id}, ${item.tahun})
            ON CONFLICT (id) DO UPDATE SET tahun = EXCLUDED.tahun`;
}

for (const item of initialMasterData.tugas) {
  await sql`INSERT INTO tugas (id, mata_kuliah_id, nomor, judul, tenggat, rubrik_file_name, rubrik_text)
            VALUES (${item.id}, ${item.mataKuliahId}, ${item.nomor}, ${item.judul},
                    ${item.tenggat}, ${item.rubrikFileName}, ${item.rubrikText})
            ON CONFLICT (id) DO UPDATE SET judul = EXCLUDED.judul, tenggat = EXCLUDED.tenggat`;
}

// ---------- roster ----------

for (const item of dummyMahasiswa) {
  await sql`INSERT INTO mahasiswa (id, nim, nama, angkatan, kelas)
            VALUES (${item.id}, ${item.nim}, ${item.nama}, ${item.angkatan},
                    ${item.kelasPraktikum})
            ON CONFLICT (nim) DO UPDATE SET
              nama = EXCLUDED.nama,
              angkatan = EXCLUDED.angkatan,
              kelas = EXCLUDED.kelas`;
}

// ---------- pengumpulan ----------

const idMataKuliah = new Map(
  initialMasterData.mataKuliah.map((item) => [item.nama, item.id])
);

/**
 * Mencari id tugas dari mata kuliah dan nomornya.
 *
 * Sebagian data contoh merujuk tugas yang tidak ada di initialMasterData
 * (Basis Data nomor 2, Jaringan nomor 1, Alpro nomor 3). Baris tugasnya
 * dibuat di sini, kalau tidak foreign key submission akan menolak.
 */
async function idTugas(mataKuliahId: string, nomor: number, judul: string) {
  const adaDiMaster = initialMasterData.tugas.find(
    (item) => item.mataKuliahId === mataKuliahId && item.nomor === nomor
  );

  if (adaDiMaster) return adaDiMaster.id;

  const id = `${mataKuliahId}-tugas-${nomor}`;

  await sql`INSERT INTO tugas (id, mata_kuliah_id, nomor, judul)
            VALUES (${id}, ${mataKuliahId}, ${nomor}, ${judul})
            ON CONFLICT (mata_kuliah_id, nomor) DO NOTHING`;

  const baris = await sql`SELECT id FROM tugas
                          WHERE mata_kuliah_id = ${mataKuliahId} AND nomor = ${nomor}`;

  return baris[0].id as string;
}

for (const item of dummyAdminSubmissions) {
  const mataKuliahId = idMataKuliah.get(item.mataKuliah);

  if (!mataKuliahId) {
    console.error(`Mata kuliah tidak dikenal: ${item.mataKuliah}`);
    process.exit(1);
  }

  const tugasId = await idTugas(mataKuliahId, item.tugasKe, item.judulTugas);

  // Data contoh sisi admin tidak menyimpan link video, karena tabel admin
  // memang tidak menampilkannya. Kolomnya wajib diisi, jadi dipakai tautan
  // contoh yang jelas terlihat sebagai data uji.
  const linkYoutube = `https://youtube.com/watch?v=contoh-${item.id}`;

  await sql`INSERT INTO submission
              (id, nim, mata_kuliah_id, tugas_id, link_youtube, status,
               skor_otomatis, transkrip, error_message, dikirim_pada)
            VALUES
              (${item.id}, ${item.nim}, ${mataKuliahId}, ${tugasId}, ${linkYoutube},
               ${item.status}, ${item.skor}, ${item.transkrip ?? null},
               ${item.errorMessage ?? null}, ${item.dikirimPada})
            ON CONFLICT (id) DO UPDATE SET
              status = EXCLUDED.status,
              skor_otomatis = EXCLUDED.skor_otomatis,
              transkrip = EXCLUDED.transkrip`;

  // Id evaluasi pada data contoh berulang antar submission, jadi diberi
  // awalan id submission supaya tidak bentrok sebagai primary key.
  for (const [urutan, evaluasi] of (item.evaluasi ?? []).entries()) {
    await sql`INSERT INTO evaluasi (id, submission_id, materi, status, catatan, urutan)
              VALUES (${`${item.id}-${urutan + 1}`}, ${item.id}, ${evaluasi.materi},
                      ${evaluasi.status}, ${evaluasi.catatan ?? null}, ${urutan})
              ON CONFLICT (id) DO UPDATE SET
                materi = EXCLUDED.materi, status = EXCLUDED.status, catatan = EXCLUDED.catatan`;
  }
}

// ---------- laporan ----------

const hitung = async (tabel: string) => {
  const baris = await sql.query(`SELECT count(*)::int AS jumlah FROM ${tabel}`);
  return baris[0].jumlah as number;
};

console.log("Seed selesai:");
for (const tabel of [
  "mata_kuliah", "tugas", "kelas_praktikum", "angkatan",
  "mahasiswa", "submission", "evaluasi",
]) {
  console.log(`  ${String(await hitung(tabel)).padStart(4)}  ${tabel}`);
}
