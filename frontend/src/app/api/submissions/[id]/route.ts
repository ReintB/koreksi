import { NextResponse } from "next/server";

import { db } from "@/lib/db";
import { pastikanAdmin } from "@/lib/otorisasi";

/**
 * Menghapus satu pengumpulan beserta nilainya.
 *
 * Diperlukan karena mata kuliah dan tugas tidak bisa dihapus selama masih ada
 * pengumpulan di bawahnya — penjagaan yang memang disengaja, tetapi tanpa
 * endpoint ini tidak ada jalan keluarnya sama sekali: mata kuliah percobaan
 * yang terlanjur dikirimi satu tugas akan menetap selamanya.
 *
 * Baris evaluasi ikut terhapus lewat ON DELETE CASCADE pada skemanya.
 */
export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const sesi = await pastikanAdmin();
  if (!sesi.ok) return sesi.balasan;

  const { id } = await params;
  const sql = db();

  const baris = await sql`
    DELETE FROM submission WHERE id = ${id} RETURNING id
  `;

  if (baris.length === 0) {
    return NextResponse.json(
      { detail: "Pengumpulan tidak ditemukan." },
      { status: 404 }
    );
  }

  return new Response(null, { status: 204 });
}
