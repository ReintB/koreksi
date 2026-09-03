import { db } from "@/lib/db";
import { adminBawaan } from "@/lib/otorisasi";

/**
 * Membentuk satu akun ke bentuk AuthUser yang dipakai frontend.
 *
 * Dipakai daftar pengguna maupun balasan setelah perubahan, supaya keduanya
 * tidak menyusun bentuk yang sedikit berbeda dan halaman menampilkan hasil
 * yang tidak konsisten setelah menyimpan.
 */
export function bentukPengguna(
  baris: Record<string, unknown>,
  mahasiswa?: Record<string, unknown> | null
) {
  const email = baris.email as string;

  return {
    id: baris.id,
    email,
    name: baris.name,
    avatarUrl: (baris.avatar_url as string | null) ?? null,
    // ADMIN_EMAIL tetap tampil sebagai admin walau kolom perannya belum
    // diubah, supaya daftar tidak menyesatkan tentang siapa yang berkuasa.
    role: adminBawaan(email) || baris.role === "admin" ? "admin" : "user",
    active: baris.active !== false,
    loginCount: (baris.login_count as number | null) ?? 0,
    lastLogin: baris.last_login
      ? new Date(baris.last_login as string).toISOString()
      : null,
    createdAt: baris.created_at
      ? new Date(baris.created_at as string).toISOString()
      : null,
    student: mahasiswa
      ? { id: mahasiswa.id, nim: mahasiswa.nim, nama: mahasiswa.nama }
      : null,
  };
}

/** Mengambil satu akun beserta mahasiswa yang tertaut, bila ada. */
export async function pengguna(id: string) {
  const sql = db();

  const baris = await sql`
    SELECT id, email, name, avatar_url, role, active, login_count,
           last_login, created_at, nim
      FROM app_user WHERE id = ${id}
  `;

  if (baris.length === 0) return null;

  const mahasiswa = baris[0].nim
    ? (
        await sql`SELECT id, nim, nama FROM mahasiswa WHERE nim = ${baris[0].nim}`
      )[0] ?? null
    : null;

  return bentukPengguna(baris[0], mahasiswa);
}
