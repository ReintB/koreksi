import { NextResponse } from "next/server";
import { z } from "zod";

import { db } from "@/lib/db";
import { pastikanAdmin, pastikanMasuk } from "@/lib/otorisasi";

const skema = z.object({
  mataKuliah: z.array(
    z.object({
      id: z.string().min(1),
      nama: z.string().min(1),
      kode: z.string().nullable(),
      angkatan: z.string().nullable(),
    })
  ),
  tugas: z.array(
    z.object({
      id: z.string().min(1),
      mataKuliahId: z.string().min(1),
      nomor: z.number().int().positive(),
      judul: z.string().min(1),
      tenggat: z.string().nullable(),
      rubrikFileName: z.string().nullable(),
      rubrikText: z.string().nullable(),
    })
  ),
  kelasPraktikum: z.array(
    z.object({ id: z.string().min(1), nama: z.string().min(1) })
  ),
  angkatan: z.array(
    z.object({ id: z.string().min(1), tahun: z.string().min(1) })
  ),
});

/** Membaca seluruh master data dan memetakannya ke bentuk yang dipakai frontend. */
async function baca() {
  const sql = db();

  const [mataKuliah, tugas, kelasPraktikum, angkatan] = await Promise.all([
    sql`SELECT id, nama, kode, angkatan FROM mata_kuliah
         ORDER BY angkatan DESC NULLS FIRST, nama`,
    sql`SELECT id, mata_kuliah_id, nomor, judul, tenggat, rubrik_file_name, rubrik_text
          FROM tugas ORDER BY mata_kuliah_id, nomor`,
    sql`SELECT id, nama FROM kelas_praktikum ORDER BY nama`,
    sql`SELECT id, tahun FROM angkatan ORDER BY tahun`,
  ]);

  return {
    mataKuliah: mataKuliah.map((b) => ({
      id: b.id,
      nama: b.nama,
      kode: b.kode ?? null,
      angkatan: b.angkatan ?? null,
    })),
    tugas: tugas.map((b) => ({
      id: b.id,
      mataKuliahId: b.mata_kuliah_id,
      nomor: b.nomor,
      judul: b.judul,
      tenggat: b.tenggat ? new Date(b.tenggat).toISOString() : null,
      rubrikFileName: b.rubrik_file_name,
      rubrikText: b.rubrik_text,
    })),
    kelasPraktikum: kelasPraktikum.map((b) => ({ id: b.id, nama: b.nama })),
    angkatan: angkatan.map((b) => ({ id: b.id, tahun: b.tahun })),
  };
}

export async function GET() {
  // Halaman mahasiswa juga memakai master data untuk mengisi dropdown,
  // jadi cukup menuntut sudah masuk, bukan admin.
  const sesi = await pastikanMasuk();
  if (!sesi.ok) return sesi.balasan;

  return NextResponse.json(await baca());
}

export async function PUT(request: Request) {
  const sesi = await pastikanAdmin();
  if (!sesi.ok) return sesi.balasan;

  const isi = skema.safeParse(await request.json());

  if (!isi.success) {
    return NextResponse.json(
      { detail: "Bentuk master data tidak sesuai." },
      { status: 400 }
    );
  }

  const data = isi.data;
  const sql = db();

  const idMataKuliah = data.mataKuliah.map((item) => item.id);
  const idTugas = data.tugas.map((item) => item.id);
  const idKelas = data.kelasPraktikum.map((item) => item.id);
  const idAngkatan = data.angkatan.map((item) => item.id);

  // Foreign key submission memakai ON DELETE CASCADE, jadi membuang mata
  // kuliah atau tugas ikut membuang seluruh pengumpulan di bawahnya. PUT ini
  // menerima keseluruhan master data, sehingga satu baris yang hilang dari
  // payload sudah cukup untuk melenyapkan nilai mahasiswa tanpa peringatan.
  // Perubahan semacam itu ditolak.
  const terancam = await sql`
    SELECT t.judul, m.nama AS mata_kuliah, count(*)::int AS jumlah
      FROM submission s
      JOIN tugas t ON t.id = s.tugas_id
      JOIN mata_kuliah m ON m.id = s.mata_kuliah_id
     WHERE NOT (s.tugas_id = ANY(${idTugas}))
        OR NOT (s.mata_kuliah_id = ANY(${idMataKuliah}))
     GROUP BY t.judul, m.nama
  `;

  if (terancam.length > 0) {
    const rincian = terancam
      .map((b) => `${b.mata_kuliah} - ${b.judul} (${b.jumlah} pengumpulan)`)
      .join("; ");

    return NextResponse.json(
      {
        detail:
          `Masih ada pengumpulan yang bergantung padanya: ${rincian}. ` +
          "Pindahkan pengumpulannya terlebih dahulu.",
      },
      { status: 409 }
    );
  }

  const perintah = [
    ...data.mataKuliah.map(
      (item) => sql`INSERT INTO mata_kuliah (id, nama, kode, angkatan)
                    VALUES (${item.id}, ${item.nama}, ${item.kode}, ${item.angkatan})
                    ON CONFLICT (id) DO UPDATE SET
                      nama = EXCLUDED.nama,
                      kode = EXCLUDED.kode,
                      angkatan = EXCLUDED.angkatan`
    ),
    ...data.kelasPraktikum.map(
      (item) => sql`INSERT INTO kelas_praktikum (id, nama) VALUES (${item.id}, ${item.nama})
                    ON CONFLICT (id) DO UPDATE SET nama = EXCLUDED.nama`
    ),
    ...data.angkatan.map(
      (item) => sql`INSERT INTO angkatan (id, tahun) VALUES (${item.id}, ${item.tahun})
                    ON CONFLICT (id) DO UPDATE SET tahun = EXCLUDED.tahun`
    ),
    ...data.tugas.map(
      (item) => sql`INSERT INTO tugas
                      (id, mata_kuliah_id, nomor, judul, tenggat, rubrik_file_name, rubrik_text)
                    VALUES
                      (${item.id}, ${item.mataKuliahId}, ${item.nomor}, ${item.judul},
                       ${item.tenggat}, ${item.rubrikFileName}, ${item.rubrikText})
                    ON CONFLICT (id) DO UPDATE SET
                      mata_kuliah_id = EXCLUDED.mata_kuliah_id,
                      nomor = EXCLUDED.nomor,
                      judul = EXCLUDED.judul,
                      tenggat = EXCLUDED.tenggat,
                      rubrik_file_name = EXCLUDED.rubrik_file_name,
                      rubrik_text = EXCLUDED.rubrik_text`
    ),
    // Baris yang tidak lagi ada di payload dibuang. Tugas lebih dulu supaya
    // tidak tertahan foreign key ke mata kuliah.
    sql`DELETE FROM tugas WHERE NOT (id = ANY(${idTugas}))`,
    sql`DELETE FROM mata_kuliah WHERE NOT (id = ANY(${idMataKuliah}))`,
    sql`DELETE FROM kelas_praktikum WHERE NOT (id = ANY(${idKelas}))`,
    sql`DELETE FROM angkatan WHERE NOT (id = ANY(${idAngkatan}))`,
  ];

  try {
    await sql.transaction(perintah);
  } catch (error) {
    return NextResponse.json(
      {
        detail:
          error instanceof Error ? error.message : "Gagal menyimpan master data.",
      },
      { status: 409 }
    );
  }

  return NextResponse.json(await baca());
}
