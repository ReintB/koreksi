/**
 * Aturan urutan daftar mahasiswa.
 *
 * Dipisahkan dari halamannya supaya bisa diperiksa `roster.check.ts` tanpa
 * merender komponen: urutannya punya kasus khusus yang mudah salah, dan
 * salahnya tidak kelihatan sampai seseorang menelusuri 385 baris.
 */

/** Penanda kelas yang belum ditetapkan, dikirim server sebagai "-". */
export const TANPA_KELAS = "-";

export type BarisRoster = {
  nama: string;
  kelasPraktikum: string;
  angkatan: string;
};

/**
 * Urutan bawaan: angkatan terbaru lebih dahulu, lalu kelas A ke E, lalu nama.
 *
 * Angkatan didahulukan karena angkatan termuda yang sedang menjalani
 * praktikum, sehingga barisnya paling sering dicari — hasilnya baris pertama
 * adalah kelas A dari angkatan terbaru.
 *
 * Mahasiswa tanpa kelas diletakkan setelah kelas mana pun. Kalau dibandingkan
 * apa adanya, tanda "-" jatuh sebelum "A" dan justru merekalah yang muncul
 * paling atas, padahal mereka yang paling jarang dicari.
 */
export function urutRoster(a: BarisRoster, b: BarisRoster) {
  if (a.angkatan !== b.angkatan) return b.angkatan.localeCompare(a.angkatan);

  const tanpaKelasA = a.kelasPraktikum === TANPA_KELAS;
  const tanpaKelasB = b.kelasPraktikum === TANPA_KELAS;

  if (tanpaKelasA !== tanpaKelasB) return tanpaKelasA ? 1 : -1;

  if (a.kelasPraktikum !== b.kelasPraktikum) {
    return a.kelasPraktikum.localeCompare(b.kelasPraktikum);
  }

  return a.nama.localeCompare(b.nama, "id");
}
