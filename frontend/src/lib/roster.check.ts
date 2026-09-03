/**
 * Pemeriksa urutan roster. Jalankan: `node src/lib/roster.check.ts`
 *
 * Tidak diimpor kode aplikasi, jadi `assert` tidak ikut ke bundel browser.
 */
import assert from "node:assert/strict";

import { urutRoster, type BarisRoster } from "./roster.ts";

const buat = (
  nama: string,
  kelasPraktikum: string,
  angkatan: string
): BarisRoster => ({ nama, kelasPraktikum, angkatan });

// Sengaja diacak supaya urutan masukan tidak ikut menentukan hasil.
const roster = [
  buat("Zaki", "C", "2024"),
  buat("Bimo", "A", "2026"),
  buat("Yuni", "-", "2026"),
  buat("Adi", "A", "2026"),
  buat("Cakra", "B", "2026"),
  buat("Dina", "A", "2025"),
];

const hasil = [...roster].sort(urutRoster);

assert.deepEqual(
  hasil.map((b) => `${b.angkatan}/${b.kelasPraktikum}/${b.nama}`),
  [
    "2026/A/Adi",
    "2026/A/Bimo",
    "2026/B/Cakra",
    "2026/-/Yuni",
    "2025/A/Dina",
    "2024/C/Zaki",
  ],
  "angkatan terbaru dulu, lalu kelas, lalu nama"
);

// Yang diminta: baris teratas adalah kelas A dari angkatan terbaru.
assert.equal(hasil[0].angkatan, "2026", "angkatan terbaru di baris pertama");
assert.equal(hasil[0].kelasPraktikum, "A", "kelas A di baris pertama");

// Kelas yang belum ditetapkan tidak boleh naik ke atas hanya karena "-"
// berada sebelum "A" dalam urutan karakter.
assert.ok(
  hasil.findIndex((b) => b.kelasPraktikum === "-") >
    hasil.findIndex((b) => b.kelasPraktikum === "B"),
  "tanpa kelas berada setelah kelas bernama"
);

// Nama diurutkan menurut kaidah Indonesia, bukan kode karakter.
assert.deepEqual(
  [buat("Éko", "A", "2026"), buat("Doni", "A", "2026")]
    .sort(urutRoster)
    .map((b) => b.nama),
  ["Doni", "Éko"],
  "nama beraksen tetap pada tempatnya"
);

console.log("roster.check.ts: semua pemeriksaan lolos");
