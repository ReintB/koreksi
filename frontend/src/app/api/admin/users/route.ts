import { NextResponse } from "next/server";

import { db } from "@/lib/db";
import { pastikanAdmin } from "@/lib/otorisasi";
import { bentukPengguna } from "@/lib/pengguna";

/**
 * Daftar akun Google yang pernah masuk, beserta peran dan tautan rosternya.
 *
 * Barisnya dibuat oleh event signIn saat seseorang login, jadi daftar ini
 * kosong sampai ada yang benar-benar masuk.
 */
export async function GET() {
  const sesi = await pastikanAdmin();
  if (!sesi.ok) return sesi.balasan;

  const sql = db();

  const baris = await sql`
    SELECT u.id, u.email, u.name, u.avatar_url, u.role, u.active,
           u.login_count, u.last_login, u.created_at, u.nim,
           m.id AS mhs_id, m.nama AS mhs_nama
      FROM app_user u
      LEFT JOIN mahasiswa m ON m.nim = u.nim
     ORDER BY u.last_login DESC NULLS LAST, u.email
  `;

  return NextResponse.json(
    baris.map((b) =>
      bentukPengguna(
        b,
        b.nim ? { id: b.mhs_id, nim: b.nim, nama: b.mhs_nama } : null
      )
    )
  );
}
