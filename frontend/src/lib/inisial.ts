/**
 * Dua huruf untuk avatar yang tidak punya foto.
 *
 * Dipakai ketika akun Google tidak membawa avatar_url — akun tanpa foto, atau
 * fotonya gagal dimuat. Lingkaran berisi ikon orang generik terlihat sama
 * untuk semua orang; dua huruf setidaknya menunjuk satu orang tertentu.
 *
 * Import di berkas .check.ts memakai ekstensi .ts supaya bisa diperiksa Node:
 * `node src/lib/inisial.check.ts`.
 */
export function inisial(nama: string, email?: string | null): string {
  // Nama Google bisa kosong pada akun yang belum pernah mengisinya. Bagian
  // depan email adalah tebakan terbaik berikutnya, dan biasanya masih
  // mengandung nama orangnya.
  const sumber = nama.trim() || (email ?? "").split("@")[0].trim();

  // Titik, garis bawah, dan strip diperlakukan sebagai pemisah kata karena
  // email memakainya sebagai pengganti spasi: "budi.santoso" adalah dua kata.
  const kata = sumber.split(/[\s._-]+/).filter(Boolean);

  if (kata.length === 0) return "?";

  // Satu kata: dua huruf pertamanya, bukan satu huruf yang berdiri sendiri.
  if (kata.length === 1) return kata[0].slice(0, 2).toUpperCase();

  return (kata[0][0] + kata[1][0]).toUpperCase();
}
