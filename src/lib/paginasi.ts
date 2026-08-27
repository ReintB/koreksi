/**
 * Deret nomor halaman untuk navigasi paginasi.
 *
 * Sengaja tanpa import apa pun supaya bisa dijalankan langsung oleh Node
 * untuk pemeriksaan: `node src/lib/paginasi.check.ts`.
 */

export const ELIPSIS = "…" as const;

export type SlotHalaman = number | typeof ELIPSIS;

/** Panjang deret tidak boleh berubah-ubah; barisnya ikut bergeser kalau iya. */
const MAKS_TAMPIL = 7;

/** Tetangga kiri dan kanan halaman aktif yang selalu ikut tampil. */
const TEPI = 1;

/**
 * Halaman pertama dan terakhir selalu ikut — itu dua lompatan yang paling
 * sering dipakai. Sisanya jendela di sekitar halaman aktif.
 */
export function nomorHalaman(halaman: number, total: number): SlotHalaman[] {
  if (total < 1) return [];

  if (total <= MAKS_TAMPIL) {
    return Array.from({ length: total }, (_, index) => index + 1);
  }

  let awal = Math.max(2, halaman - TEPI);
  let akhir = Math.min(total - 1, halaman + TEPI);

  // Di ujung deret jendelanya melebar ke dalam, supaya panjangnya tetap sama.
  if (halaman - TEPI <= 2) akhir = Math.min(total - 1, MAKS_TAMPIL - 2);
  if (halaman + TEPI >= total - 1) awal = Math.max(2, total - MAKS_TAMPIL + 3);

  // Elipsis yang hanya menutupi satu nomor memakan tempat yang sama dengan
  // nomornya sendiri, jadi tampilkan nomornya.
  if (awal === 3) awal = 2;
  if (akhir === total - 2) akhir = total - 1;

  const tengah: SlotHalaman[] = [];

  for (let nomor = awal; nomor <= akhir; nomor++) tengah.push(nomor);

  return [
    1,
    ...(awal > 2 ? [ELIPSIS] : []),
    ...tengah,
    ...(akhir < total - 1 ? [ELIPSIS] : []),
    total,
  ];
}
