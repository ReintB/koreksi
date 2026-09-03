import { NextResponse } from "next/server";
import { z } from "zod";

import { db } from "@/lib/db";
import { pastikanAdmin, pastikanAksesMahasiswa } from "@/lib/otorisasi";

// NIM tidak ikut bisa diubah: kolom itu dirujuk submission dan app_user, dan
// foreign key-nya tidak memakai ON UPDATE CASCADE. Mengganti NIM berarti
// membuat baris baru lalu memindahkan pengumpulannya, bukan menyunting.
const skemaUbah = z.object({
  nama: z.string().trim().min(3, "Nama minimal 3 karakter"),
  angkatan: z.string().trim().min(1, "Angkatan wajib diisi"),
  kelas: z.string().trim().nullable().optional(),
});

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

/** Menyunting data satu mahasiswa. NIM-nya sendiri tidak bisa diubah. */
export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ nim: string }> }
) {
  const sesi = await pastikanAdmin();
  if (!sesi.ok) return sesi.balasan;

  const { nim } = await params;
  const isi = skemaUbah.safeParse(await request.json());

  if (!isi.success) {
    return NextResponse.json(
      { detail: isi.error.issues[0]?.message ?? "Data mahasiswa tidak sesuai." },
      { status: 400 }
    );
  }

  const sql = db();

  const baris = await sql`
    UPDATE mahasiswa
       SET nama = ${isi.data.nama},
           angkatan = ${isi.data.angkatan},
           kelas = ${isi.data.kelas || null}
     WHERE nim = ${nim}
    RETURNING nim
  `;

  if (baris.length === 0) {
    return NextResponse.json(
      { detail: "Mahasiswa tidak ditemukan." },
      { status: 404 }
    );
  }

  return new Response(null, { status: 204 });
}

/**
 * Mengeluarkan satu mahasiswa dari roster.
 *
 * Ditolak bila masih punya pengumpulan. Foreign key submission memakai
 * ON DELETE CASCADE, jadi tanpa penjagaan ini satu klik akan melenyapkan
 * seluruh nilai mahasiswa tersebut tanpa peringatan apa pun.
 */
export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ nim: string }> }
) {
  const sesi = await pastikanAdmin();
  if (!sesi.ok) return sesi.balasan;

  const { nim } = await params;
  const sql = db();

  const pengumpulan = await sql`
    SELECT count(*)::int AS jumlah FROM submission WHERE nim = ${nim}
  `;

  if ((pengumpulan[0].jumlah as number) > 0) {
    return NextResponse.json(
      {
        detail:
          `Mahasiswa ini masih punya ${pengumpulan[0].jumlah} pengumpulan. ` +
          "Hapus pengumpulannya terlebih dahulu bila memang ingin dikeluarkan.",
      },
      { status: 409 }
    );
  }

  const baris = await sql`
    DELETE FROM mahasiswa WHERE nim = ${nim} RETURNING nim
  `;

  if (baris.length === 0) {
    return NextResponse.json(
      { detail: "Mahasiswa tidak ditemukan." },
      { status: 404 }
    );
  }

  return new Response(null, { status: 204 });
}
