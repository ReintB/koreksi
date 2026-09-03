import { auth } from "@/auth";

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
