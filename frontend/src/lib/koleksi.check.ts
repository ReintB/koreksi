/**
 * Pemeriksa mekanika master data. Jalankan: `node src/lib/koleksi.check.ts`
 *
 * Yang diperiksa: menyimpan ulang item yang sedang diedit tidak dianggap
 * duplikat, upsert benar-benar mengubah (bukan menambah kembar), urutan
 * daftar tidak berubah saat mengedit, dan sumbernya tidak ikut termutasi.
 */
import assert from "node:assert/strict";

import { adaDuplikat, hapusById, upsert } from "./koleksi.ts";

const awal = [
  { id: "mk-1", nama: "Praktikum Alpro" },
  { id: "mk-2", nama: "Praktikum Basis Data" },
];

/* --- adaDuplikat --------------------------------------------------------- */

const samaNama = (nama: string) => (item: { nama: string }) =>
  item.nama.toLowerCase() === nama.toLowerCase();

// Nama yang sudah dipakai item lain adalah duplikat.
assert.equal(adaDuplikat(awal, null, samaNama("Praktikum Alpro")), true);

// Perbandingannya mengabaikan huruf besar-kecil.
assert.equal(adaDuplikat(awal, null, samaNama("praktikum alpro")), true);

// Menyimpan ulang item yang sedang diedit BUKAN duplikat terhadap dirinya.
assert.equal(adaDuplikat(awal, "mk-1", samaNama("Praktikum Alpro")), false);

// Tetapi tetap duplikat bila bentrok dengan item lain.
assert.equal(adaDuplikat(awal, "mk-2", samaNama("Praktikum Alpro")), true);

// Nama baru bebas.
assert.equal(adaDuplikat(awal, null, samaNama("Praktikum Jaringan")), false);

// undefined (editor sedang mode tambah) diperlakukan seperti null.
assert.equal(adaDuplikat(awal, undefined, samaNama("Praktikum Alpro")), true);

/* --- upsert -------------------------------------------------------------- */

// Id yang sudah ada -> diubah, jumlah tetap.
const diubah = upsert(awal, "mk-1", { nama: "Alpro Lanjut" });
assert.equal(diubah.length, 2);
assert.equal(diubah[0].nama, "Alpro Lanjut");

// Posisinya tidak berpindah ke akhir saat diedit.
assert.deepEqual(
  diubah.map((item) => item.id),
  ["mk-1", "mk-2"]
);

// Id baru -> ditambahkan di akhir.
const ditambah = upsert(awal, "mk-3", { nama: "Praktikum Jaringan" });
assert.equal(ditambah.length, 3);
assert.equal(ditambah[2].id, "mk-3");
assert.equal(ditambah[2].nama, "Praktikum Jaringan");

// Sumbernya tidak ikut berubah.
assert.equal(awal.length, 2);
assert.equal(awal[0].nama, "Praktikum Alpro");

// Daftar kosong tetap bisa diisi.
assert.deepEqual(upsert([] as typeof awal, "mk-1", { nama: "Pertama" }), [
  { id: "mk-1", nama: "Pertama" },
]);

/* --- hapusById ----------------------------------------------------------- */

assert.deepEqual(
  hapusById(awal, "mk-1").map((item) => item.id),
  ["mk-2"]
);

// Id yang tidak ada tidak menghapus apa pun.
assert.equal(hapusById(awal, "mk-9").length, 2);
assert.equal(awal.length, 2);

console.log("koleksi.check.ts: semua pemeriksaan lolos");
