import { NextResponse } from "next/server";
import { z } from "zod";

import { db } from "@/lib/db";
import { pastikanAdmin } from "@/lib/otorisasi";
import { SKOR_MAX, SKOR_MIN } from "@/lib/score-override";

const skema = z.object({
  skor: z.number().int().min(SKOR_MIN).max(SKOR_MAX),
  catatan: z.string().optional(),
});

/**
 * Menimpa skor hasil koreksi otomatis.
 *
 * Nilai mesin disimpan terpisah di skor_otomatis dan tidak disentuh, supaya
 * hasil aslinya tetap terlihat dan penimpaan bisa dibatalkan.
 */
export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const sesi = await pastikanAdmin();
  if (!sesi.ok) return sesi.balasan;

  const { id } = await params;
  const isi = skema.safeParse(await request.json());

  if (!isi.success) {
    return NextResponse.json(
      { detail: `Skor harus bilangan bulat ${SKOR_MIN} sampai ${SKOR_MAX}.` },
      { status: 400 }
    );
  }

  const sql = db();

  // Status ikut berpindah, bukan hanya kolom nilainya. Tanpa ini baris yang
  // sudah dinilai tetap berbunyi "Menunggu dinilai" sambil memajang angkanya,
  // tidak bisa dibuka, dan asisten kehilangan jejak sudah menilai sampai mana.
  const baris = await sql`
    UPDATE submission
       SET skor_manual = ${isi.data.skor},
           catatan_timpa = ${isi.data.catatan?.trim() || null},
           status = 'dinilai_manual'
     WHERE id = ${id}
    RETURNING id
  `;

  if (baris.length === 0) {
    return NextResponse.json(
      { detail: "Pengumpulan tidak ditemukan." },
      { status: 404 }
    );
  }

  return new Response(null, { status: 204 });
}

/** Mengembalikan skor ke hasil koreksi otomatis. */
export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const sesi = await pastikanAdmin();
  if (!sesi.ok) return sesi.balasan;

  const { id } = await params;
  const sql = db();

  // Statusnya dikembalikan ke keadaan sebelum ditimpa: "selesai" bila mesin
  // pernah memberi nilai, "menunggu" bila belum pernah — bukan dibiarkan
  // tetap "dinilai_manual" pada baris yang sudah tidak punya nilai manual.
  const baris = await sql`
    UPDATE submission
       SET skor_manual = NULL,
           catatan_timpa = NULL,
           status = CASE WHEN skor_otomatis IS NULL THEN 'menunggu' ELSE 'selesai' END
     WHERE id = ${id}
    RETURNING id
  `;

  if (baris.length === 0) {
    return NextResponse.json(
      { detail: "Pengumpulan tidak ditemukan." },
      { status: 404 }
    );
  }

  return new Response(null, { status: 204 });
}
