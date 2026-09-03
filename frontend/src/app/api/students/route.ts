import { NextResponse } from "next/server";
import { z } from "zod";

import { db } from "@/lib/db";
import { pastikanAdmin } from "@/lib/otorisasi";

const skemaMahasiswa = z.object({
  nim: z.string().trim().min(1, "NIM wajib diisi"),
  nama: z.string().trim().min(3, "Nama minimal 3 karakter"),
  angkatan: z.string().trim().min(1, "Angkatan wajib diisi"),
  kelas: z.string().trim().nullable().optional(),
});

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

/** Menambah satu mahasiswa ke roster. */
export async function POST(request: Request) {
  const sesi = await pastikanAdmin();
  if (!sesi.ok) return sesi.balasan;

  const isi = skemaMahasiswa.safeParse(await request.json());

  if (!isi.success) {
    return NextResponse.json(
      { detail: isi.error.issues[0]?.message ?? "Data mahasiswa tidak sesuai." },
      { status: 400 }
    );
  }

  const { nim, nama, angkatan, kelas } = isi.data;
  const sql = db();

  const sudahAda = await sql`SELECT nim FROM mahasiswa WHERE nim = ${nim}`;

  if (sudahAda.length > 0) {
    return NextResponse.json(
      { detail: `NIM ${nim} sudah ada di roster.` },
      { status: 409 }
    );
  }

  // Id diturunkan dari NIM, bukan diacak, supaya barisnya masih bisa dikenali
  // saat menelusuri database secara langsung.
  await sql`
    INSERT INTO mahasiswa (id, nim, nama, angkatan, kelas)
    VALUES (${`mhs-${nim}`}, ${nim}, ${nama}, ${angkatan}, ${kelas || null})
  `;

  return NextResponse.json({ nim }, { status: 201 });
}
