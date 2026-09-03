import { NextResponse } from "next/server";

import { db } from "@/lib/db";
import { pastikanAdmin } from "@/lib/otorisasi";

/**
 * Daftar mahasiswa, dipakai halaman rekap untuk mengetahui siapa saja yang
 * seharusnya mengumpulkan. Tanpa daftar ini "belum mengumpulkan" tidak bisa
 * dijawab, karena mahasiswa yang tidak mengirim apa pun tidak meninggalkan
 * jejak di tabel submission.
 *
 * Tidak menerima penyaring mata kuliah: satu kelas praktikum berlaku untuk
 * seluruh mata kuliah, jadi pesertanya sama untuk mata kuliah mana pun.
 *
 * Berisi nama dan NIM seluruh peserta, jadi hanya untuk admin.
 */
export async function GET() {
  const sesi = await pastikanAdmin();
  if (!sesi.ok) return sesi.balasan;

  const sql = db();

  const baris = await sql`
    SELECT id, nim, nama, angkatan, email, kelas
      FROM mahasiswa
     ORDER BY nama
  `;

  return NextResponse.json(
    baris.map((b) => ({
      id: b.id,
      nama: b.nama,
      nim: b.nim,
      // "-" menandai kelas yang belum ditetapkan, sama seperti yang dipakai
      // rekap, supaya penyaringan kelas tidak perlu menangani null.
      kelasPraktikum: b.kelas ?? "-",
      angkatan: b.angkatan,
      email: b.email ?? null,
    }))
  );
}
