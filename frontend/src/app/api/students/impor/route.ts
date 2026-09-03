import { NextResponse } from "next/server";
import { z } from "zod";

import { db } from "@/lib/db";
import { pastikanAdmin } from "@/lib/otorisasi";

const BATAS = 5000;

const skema = z.object({
  mahasiswa: z
    .array(
      z.object({
        nim: z.string().trim().min(1),
        nama: z.string().trim().min(1),
        angkatan: z.string().trim().min(1),
        kelas: z.string().trim().nullable(),
      })
    )
    .min(1, "Tidak ada baris yang bisa diimpor")
    .max(BATAS, `Maksimal ${BATAS} baris sekali impor`),
});

/**
 * Memasukkan banyak mahasiswa sekaligus dari berkas CSV.
 *
 * Satu angkatan bisa berisi ratusan mahasiswa, dan mengirimnya satu per satu
 * lewat POST /api/students berarti ratusan perjalanan bolak-balik ke database.
 * Di sini seluruh baris dikirim sebagai empat larik lalu dibongkar dengan
 * unnest, sehingga cukup satu pernyataan.
 *
 * NIM yang sudah ada diperbarui, bukan ditolak, supaya berkas yang sama bisa
 * diimpor ulang setelah dikoreksi tanpa membersihkan roster lebih dulu.
 */
export async function POST(request: Request) {
  const sesi = await pastikanAdmin();
  if (!sesi.ok) return sesi.balasan;

  const isi = skema.safeParse(await request.json());

  if (!isi.success) {
    return NextResponse.json(
      { detail: isi.error.issues[0]?.message ?? "Data impor tidak sesuai." },
      { status: 400 }
    );
  }

  const daftar = isi.data.mahasiswa;

  // Baris terakhir menang bila NIM yang sama muncul dua kali dalam satu
  // berkas. Tanpa ini unnest akan menyisipkan NIM yang sama dua kali dalam
  // satu pernyataan, dan Postgres menolak seluruh impor.
  const unik = new Map(daftar.map((item) => [item.nim, item]));
  const baris = [...unik.values()];

  const sql = db();

  const sudahAda = await sql`
    SELECT nim FROM mahasiswa WHERE nim = ANY(${baris.map((b) => b.nim)})
  `;

  await sql`
    INSERT INTO mahasiswa (id, nim, nama, angkatan, kelas)
    SELECT 'mhs-' || t.nim, t.nim, t.nama, t.angkatan, nullif(t.kelas, '')
      FROM unnest(
             ${baris.map((b) => b.nim)}::text[],
             ${baris.map((b) => b.nama)}::text[],
             ${baris.map((b) => b.angkatan)}::text[],
             ${baris.map((b) => b.kelas ?? "")}::text[]
           ) AS t(nim, nama, angkatan, kelas)
    ON CONFLICT (nim) DO UPDATE SET
      nama = EXCLUDED.nama,
      angkatan = EXCLUDED.angkatan,
      kelas = EXCLUDED.kelas
  `;

  return NextResponse.json({
    total: baris.length,
    baru: baris.length - sudahAda.length,
    diperbarui: sudahAda.length,
    // Baris berulang dalam berkas dilaporkan supaya tidak diam-diam hilang.
    duplikatDalamBerkas: daftar.length - baris.length,
  });
}
