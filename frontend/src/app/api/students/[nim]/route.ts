import { NextResponse } from "next/server";

import { db } from "@/lib/db";
import { pastikanAksesMahasiswa } from "@/lib/otorisasi";

/**
 * Profil satu mahasiswa.
 *
 * Mengembalikan null dengan status 200, bukan 404, ketika NIM tidak ada.
 * Halaman profil memanggil endpoint ini dengan NIM penampung saat akun belum
 * ditautkan admin, dan 404 akan menjadikannya pesan galat padahal keadaan itu
 * normal.
 */
export async function GET(
  _request: Request,
  { params }: { params: Promise<{ nim: string }> }
) {
  const { nim } = await params;

  const sesi = await pastikanAksesMahasiswa(nim);
  if (!sesi.ok) return sesi.balasan;

  const sql = db();

  const baris = await sql`
    SELECT id, nim, nama, angkatan, email, kelas
      FROM mahasiswa WHERE nim = ${nim}
  `;

  if (baris.length === 0) return NextResponse.json(null);

  const b = baris[0];

  return NextResponse.json({
    id: b.id,
    nama: b.nama,
    nim: b.nim,
    angkatan: b.angkatan,
    email: b.email ?? null,
    kelas: (b.kelas as string | null) ?? null,
  });
}
