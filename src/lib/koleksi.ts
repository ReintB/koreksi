/**
 * Mekanika daftar master data: cari duplikat, lalu ubah-atau-tambah.
 *
 * Sebelumnya bagian ini disalin utuh di empat fungsi simpan pada
 * /admin/tugas (mata kuliah, tugas, kelas, angkatan). Yang benar-benar
 * berbeda antar keempatnya hanya aturan validasi dan teks pesannya, bukan
 * cara datanya diperbarui — jadi hanya bagian itu yang dikumpulkan di sini.
 *
 * Sengaja tanpa import apa pun supaya bisa dijalankan langsung oleh Node
 * untuk pemeriksaan: `node src/lib/koleksi.check.ts`.
 */

/**
 * Apakah ada item LAIN yang cocok. `kecuali` diisi id yang sedang diedit,
 * supaya menyimpan ulang tanpa mengubah nama tidak dianggap duplikat.
 */
export function adaDuplikat<T extends { id: string }>(
  list: T[],
  kecuali: string | null | undefined,
  cocok: (item: T) => boolean
): boolean {
  return list.some((item) => item.id !== kecuali && cocok(item));
}

/**
 * Ubah item ber-id tersebut bila sudah ada, atau tambahkan di akhir bila
 * belum. Id dibuat pemanggil, bukan di sini, karena setelah menambah mata
 * kuliah halaman perlu langsung memilihnya.
 */
export function upsert<T extends { id: string }>(
  list: T[],
  id: string,
  fields: Omit<T, "id">
): T[] {
  return list.some((item) => item.id === id)
    ? list.map((item) => (item.id === id ? { ...item, ...fields } : item))
    : [...list, { id, ...fields } as T];
}

export function hapusById<T extends { id: string }>(
  list: T[],
  id: string
): T[] {
  return list.filter((item) => item.id !== id);
}
