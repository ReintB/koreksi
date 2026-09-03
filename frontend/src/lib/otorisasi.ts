import { auth } from "@/auth";
import { db } from "@/lib/db";

/**
 * Penentuan peran dan penjagaan endpoint.
 *
 * Selama tabel app_user belum menjadi sumber peran, admin ditentukan oleh
 * environment ADMIN_EMAIL. Logikanya ditaruh di satu tempat supaya
 * /api/auth/me dan setiap endpoint yang dijaga tidak menyimpulkan peran
 * dengan cara yang berbeda.
 */
export type Peran = "user" | "admin";

function daftarAdmin() {
  return (process.env.ADMIN_EMAIL ?? "")
    .split(",")
    .map((email) => email.trim().toLowerCase())
    .filter(Boolean);
}

export function peran(email: string): Peran {
  return daftarAdmin().includes(email.toLowerCase()) ? "admin" : "user";
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

/** Endpoint yang menuntut pemanggilnya sudah masuk. */
export async function pastikanMasuk(): Promise<Hasil> {
  const sesi = await auth();
  const email = sesi?.user?.email;

  if (!email) return tolak(401, "Silakan masuk terlebih dahulu.");

  return { ok: true, email };
}

/** Endpoint yang menuntut pemanggilnya admin. */
export async function pastikanAdmin(): Promise<Hasil> {
  const hasil = await pastikanMasuk();

  if (!hasil.ok) return hasil;
  if (peran(hasil.email) !== "admin") {
    return tolak(403, "Hanya admin yang boleh melakukan ini.");
  }

  return hasil;
}

/**
 * NIM roster yang tertaut ke sebuah akun Google.
 *
 * Penautan dilakukan admin, jadi akun yang belum ditautkan mengembalikan
 * null dan otomatis tidak punya akses ke data mahasiswa mana pun.
 */
export async function nimTertaut(email: string) {
  const sql = db();

  const baris = await sql`
    SELECT nim FROM app_user WHERE lower(email) = ${email.toLowerCase()}
  `;

  return (baris[0]?.nim as string | null | undefined) ?? null;
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
  if (peran(hasil.email) === "admin") return hasil;
  if ((await nimTertaut(hasil.email)) === nim) return hasil;

  return tolak(403, "Anda hanya boleh melihat data diri sendiri.");
}
