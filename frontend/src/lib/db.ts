import { neon, type NeonQueryFunction } from "@neondatabase/serverless";

/**
 * Klien SQL untuk Neon.
 *
 * Driver serverless dipakai, bukan `pg`, karena tiap permintaan di Vercel
 * berjalan pada instance terpisah. Pool koneksi biasa akan cepat menghabiskan
 * kuota koneksi Postgres di sana, sedangkan driver ini berkomunikasi lewat
 * HTTP tanpa menahan koneksi.
 *
 * Tipe dikunci ke NeonQueryFunction<false, false> supaya hasil query langsung
 * terbaca sebagai daftar baris. Tanpa itu tipenya berupa union dari semua
 * kemungkinan opsi driver, dan setiap pemanggil harus menyempitkannya sendiri.
 *
 * Klien dibuat malas supaya `next build` tetap lolos ketika DATABASE_URL
 * belum diisi; kegagalan baru muncul saat endpoint benar-benar dipanggil,
 * dengan pesan yang jelas.
 */
export type Baris = Record<string, unknown>;

let client: NeonQueryFunction<false, false> | null = null;

export function db(): NeonQueryFunction<false, false> {
  if (!client) {
    const url = process.env.DATABASE_URL;

    if (!url) {
      throw new Error(
        "DATABASE_URL belum diisi. Lihat frontend/.env.example."
      );
    }

    client = neon(url);
  }

  return client;
}
