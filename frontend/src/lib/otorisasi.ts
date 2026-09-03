import { auth } from "@/auth";
import { db } from "@/lib/db";

/**
 * Penentuan peran dan penjagaan endpoint.
 *
 * Peran tersimpan di tabel app_user, tetapi ADMIN_EMAIL tetap diperlakukan
 * sebagai admin tanpa syarat. Tanpa jalan masuk itu, database yang masih
 * kosong tidak punya satu pun admin — dan tidak ada yang bisa mengangkat
 * admin pertama.
 */
export type Peran = "user" | "admin";

function daftarAdmin() {
  return (process.env.ADMIN_EMAIL ?? "")
    .split(",")
    .map((email) => email.trim().toLowerCase())
    .filter(Boolean);
}

export function adminBawaan(email: string) {
  return daftarAdmin().includes(email.toLowerCase());
}

/** Satu baris app_user, atau null bila akunnya belum pernah masuk. */
export async function akun(email: string) {
  const sql = db();

  const baris = await sql`
    SELECT id, email, name, avatar_url, role, active, login_count,
           last_login, created_at, nim
      FROM app_user WHERE lower(email) = ${email.toLowerCase()}
  `;

  return baris[0] ?? null;
}

export async function peran(email: string): Promise<Peran> {
  if (adminBawaan(email)) return "admin";

  return (await akun(email))?.role === "admin" ? "admin" : "user";
}

/** NIM roster yang tertaut ke sebuah akun Google, null bila belum ditautkan. */
export async function nimTertaut(email: string) {
  return ((await akun(email))?.nim as string | null | undefined) ?? null;
}

type Hasil =
  | { ok: true; email: string }
  | { ok: false; balasan: Response };

function tolak(status: number, pesan: string): Hasil {
  return {
    ok: false,
    balasan: Response.json({ detail: pesan }, { status }),
  };
}

/** Endpoint yang menuntut pemanggilnya sudah masuk dan akunnya aktif. */
export async function pastikanMasuk(): Promise<Hasil> {
  const sesi = await auth();
  const email = sesi?.user?.email;

  if (!email) return tolak(401, "Silakan masuk terlebih dahulu.");

  // Akun yang dinonaktifkan admin masih memegang cookie sesi yang sah, jadi
  // penonaktifan hanya berarti bila diperiksa di sini.
  const baris = await akun(email);

  if (baris && baris.active === false && !adminBawaan(email)) {
    return tolak(403, "Akun Anda dinonaktifkan. Hubungi admin.");
  }

  return { ok: true, email };
}

/** Endpoint yang menuntut pemanggilnya admin. */
export async function pastikanAdmin(): Promise<Hasil> {
  const hasil = await pastikanMasuk();

  if (!hasil.ok) return hasil;
  if ((await peran(hasil.email)) !== "admin") {
    return tolak(403, "Hanya admin yang boleh melakukan ini.");
  }

  return hasil;
}

/**
 * Data satu mahasiswa boleh dibaca admin, atau oleh pemilik NIM itu sendiri.
 *
 * Tanpa penjagaan ini siapa pun yang sudah masuk bisa membaca profil
 * mahasiswa lain hanya dengan menebak NIM, yang berurutan dan mudah ditebak.
 */
export async function pastikanAksesMahasiswa(nim: string): Promise<Hasil> {
  const hasil = await pastikanMasuk();

  if (!hasil.ok) return hasil;
  if ((await peran(hasil.email)) === "admin") return hasil;
  if ((await nimTertaut(hasil.email)) === nim) return hasil;

  return tolak(403, "Anda hanya boleh melihat data diri sendiri.");
}
