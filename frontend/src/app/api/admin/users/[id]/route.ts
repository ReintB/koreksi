import { NextResponse } from "next/server";
import { z } from "zod";

import { db } from "@/lib/db";
import { pastikanAdmin } from "@/lib/otorisasi";
import { pengguna } from "@/lib/pengguna";

const skema = z.object({
  role: z.enum(["user", "admin"]).optional(),
  active: z.boolean().optional(),
  // String kosong berarti melepas tautan ke roster.
  nim: z.string().optional(),
});

/** Mengubah peran, status aktif, atau tautan NIM sebuah akun. */
export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const sesi = await pastikanAdmin();
  if (!sesi.ok) return sesi.balasan;

  const { id } = await params;
  const isi = skema.safeParse(await request.json());

  if (!isi.success) {
    return NextResponse.json(
      { detail: "Perubahan pengguna tidak sesuai." },
      { status: 400 }
    );
  }

  const sql = db();
  const sasaran = await sql`SELECT id, email, nim FROM app_user WHERE id = ${id}`;

  if (sasaran.length === 0) {
    return NextResponse.json(
      { detail: "Pengguna tidak ditemukan." },
      { status: 404 }
    );
  }

  const emailSasaran = (sasaran[0].email as string).toLowerCase();
  const mengubahDiriSendiri = emailSasaran === sesi.email.toLowerCase();

  // Admin terakhir yang menurunkan perannya sendiri akan mengunci semua orang
  // di luar halaman admin, dan tidak ada yang tersisa untuk mengembalikannya.
  if (mengubahDiriSendiri && (isi.data.role || isi.data.active !== undefined)) {
    return NextResponse.json(
      { detail: "Peran dan status akun sendiri tidak bisa diubah dari sini." },
      { status: 400 }
    );
  }

  if (isi.data.nim !== undefined) {
    const nim = isi.data.nim.trim();

    if (nim !== "") {
      const [mahasiswa, dipakai] = await Promise.all([
        sql`SELECT nim FROM mahasiswa WHERE nim = ${nim}`,
        sql`SELECT id FROM app_user WHERE nim = ${nim} AND id <> ${id}`,
      ]);

      if (mahasiswa.length === 0) {
        return NextResponse.json(
          { detail: `NIM ${nim} tidak ada pada roster.` },
          { status: 404 }
        );
      }

      // Satu NIM hanya boleh dipegang satu akun. Tanpa ini dua akun Google
      // bisa mengirim tugas atas nama mahasiswa yang sama.
      if (dipakai.length > 0) {
        return NextResponse.json(
          { detail: `NIM ${nim} sudah tertaut ke akun lain.` },
          { status: 409 }
        );
      }
    }

    await sql`UPDATE app_user SET nim = ${nim === "" ? null : nim} WHERE id = ${id}`;
  }

  if (isi.data.role !== undefined) {
    await sql`UPDATE app_user SET role = ${isi.data.role} WHERE id = ${id}`;
  }

  if (isi.data.active !== undefined) {
    await sql`UPDATE app_user SET active = ${isi.data.active} WHERE id = ${id}`;
  }

  return NextResponse.json(await pengguna(id));
}
