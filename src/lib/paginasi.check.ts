/**
 * Pemeriksa deret nomor halaman. Jalankan: `node src/lib/paginasi.check.ts`
 *
 * Yang diperiksa adalah bagian yang benar-benar bisa salah: lebar deret harus
 * tetap sama di mana pun halaman aktif berada, dan elipsis tidak boleh muncul
 * menggantikan satu nomor saja.
 */
import assert from "node:assert/strict";

import { ELIPSIS, nomorHalaman } from "./paginasi.ts";

// Sedikit halaman: tampilkan semua, tanpa elipsis.
assert.deepEqual(nomorHalaman(1, 1), [1]);
assert.deepEqual(nomorHalaman(3, 7), [1, 2, 3, 4, 5, 6, 7]);

// Di awal dan di akhir deret, lebarnya harus tetap sama.
assert.deepEqual(nomorHalaman(1, 10), [1, 2, 3, 4, 5, ELIPSIS, 10]);
assert.deepEqual(nomorHalaman(10, 10), [1, ELIPSIS, 6, 7, 8, 9, 10]);
assert.deepEqual(nomorHalaman(5, 10), [1, ELIPSIS, 4, 5, 6, ELIPSIS, 10]);

// Elipsis untuk satu nomor saja adalah kemunduran: nomornya lebih pendek.
assert.deepEqual(nomorHalaman(4, 8), [1, 2, 3, 4, 5, ELIPSIS, 8]);

for (let total = 1; total <= 40; total++) {
  for (let halaman = 1; halaman <= total; halaman++) {
    const deret = nomorHalaman(halaman, total);

    assert.ok(deret.includes(halaman), `halaman aktif hilang: ${halaman}/${total}`);
    assert.equal(deret[0], 1);
    assert.equal(deret.at(-1), total);
    assert.ok(deret.length <= 7, `deret terlalu panjang: ${halaman}/${total}`);

    const angka = deret.filter((slot) => typeof slot === "number");

    assert.deepEqual(
      angka,
      [...angka].sort((a, b) => a - b),
      `urutan tidak menaik: ${halaman}/${total}`
    );

    deret.forEach((slot, index) => {
      if (slot !== ELIPSIS) return;

      const kiri = deret[index - 1] as number;
      const kanan = deret[index + 1] as number;

      assert.ok(
        kanan - kiri > 2,
        `elipsis hanya menutupi satu nomor: ${halaman}/${total}`
      );
    });
  }
}

console.log("paginasi.check.ts: semua pemeriksaan lolos.");
