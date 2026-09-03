import { NextResponse, type NextRequest } from "next/server";

import { db } from "@/lib/db";
import { pastikanAdmin } from "@/lib/otorisasi";

/**
 * Daftar mahasiswa, dipakai halaman rekap untuk mengetahui siapa saja yang
 * seharusnya mengumpulkan. Tanpa daftar ini "belum mengumpulkan" tidak bisa
 * dijawab, karena mahasiswa yang tidak mengirim apa pun tidak meninggalkan
 * jejak di tabel submission.
 *
 * Berisi nama dan NIM seluruh peserta, jadi hanya untuk admin.
 */
export async function GET(request: NextRequest) {
  const sesi = await pastikanAdmin();
  if (!sesi.ok) return sesi.balasan;

  const courseId = request.nextUrl.searchParams.get("course_id");
  const sql = db();

  // Dengan course_id, yang dikembalikan hanya peserta mata kuliah tersebut
  // beserta kelas praktikumnya di situ — kelas bisa berbeda antar mata
  // kuliah. Tanpa course_id, kepesertaan tidak diketahui sehingga kelas
  // diisi "-" mengikuti cara rekap menandai kelas yang belum ditetapkan.
  const baris = courseId
    ? await sql`
        SELECT m.id, m.nim, m.nama, m.angkatan, m.email, mk.kelas
          FROM mahasiswa m
          JOIN mahasiswa_kelas mk
            ON mk.nim = m.nim AND mk.mata_kuliah_id = ${courseId}
         ORDER BY m.nama
      `
    : await sql`
        SELECT m.id, m.nim, m.nama, m.angkatan, m.email, '-' AS kelas
          FROM mahasiswa m
         ORDER BY m.nama
      `;

  return NextResponse.json(
    baris.map((b) => ({
      id: b.id,
      nama: b.nama,
      nim: b.nim,
      kelasPraktikum: b.kelas,
      angkatan: b.angkatan,
      email: b.email ?? null,
    }))
  );
}
