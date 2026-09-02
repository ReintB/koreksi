/**
 * Pemeriksa rekap "belum mengumpulkan". Jalankan: `node src/lib/rekap.check.ts`
 *
 * Yang diperiksa: mahasiswa tanpa pengumpulan tetap muncul (itu gunanya
 * halaman ini), pengumpulan milik tugas atau mata kuliah lain tidak dianggap
 * menutup tugas ini, dan urutan barisnya menaikkan yang belum mengumpulkan.
 */
import assert from "node:assert/strict";

import { buildRekap, rekapCounts } from "./rekap.ts";

const mahasiswa = [
  {
    id: "mhs-1",
    nama: "Budi",
    nim: "0001",
    kelasPraktikum: "A",
    angkatan: "2024",
  },
  {
    id: "mhs-2",
    nama: "Ani",
    nim: "0002",
    kelasPraktikum: "A",
    angkatan: "2024",
  },
  {
    id: "mhs-3",
    nama: "Citra",
    nim: "0003",
    kelasPraktikum: "B",
    angkatan: "2024",
  },
];

const dasar = {
  status: "selesai" as const,
  skor: 90,
  judulTugas: "Variabel dan Tipe Data",
  kelasPraktikum: "A",
};

const submissions = [
  // Tepat waktu.
  {
    ...dasar,
    id: "s-1",
    namaMahasiswa: "Budi",
    nim: "0001",
    mataKuliah: "Praktikum Alpro",
    tugasKe: 1,
    dikirimPada: "2026-08-20T13:42:00+07:00",
  },
  // Tugas lain: tidak boleh menutup Tugas 1.
  {
    ...dasar,
    id: "s-2",
    namaMahasiswa: "Ani",
    nim: "0002",
    mataKuliah: "Praktikum Alpro",
    tugasKe: 2,
    dikirimPada: "2026-08-20T13:42:00+07:00",
  },
  // Mata kuliah lain: juga tidak boleh menutup Tugas 1 Alpro.
  {
    ...dasar,
    id: "s-3",
    namaMahasiswa: "Citra",
    nim: "0003",
    kelasPraktikum: "B",
    mataKuliah: "Praktikum Basis Data",
    tugasKe: 1,
    dikirimPada: "2026-08-22T18:10:00+07:00",
  },
];

const filter = {
  mataKuliah: "Praktikum Alpro",
  tugasKe: 1,
  kelas: "A",
  tenggat: "2026-08-21T23:59:00+07:00",
};

const kelasA = buildRekap(mahasiswa, submissions, filter);

// Kelas A berisi dua orang, keduanya tetap muncul walau satu belum mengirim.
assert.equal(kelasA.length, 2);
assert.deepEqual(
  kelasA.map((row) => row.mahasiswa.nama),
  ["Ani", "Budi"]
);

// Yang belum mengumpulkan naik ke atas.
assert.equal(kelasA[0].submission, null);
assert.equal(kelasA[1].submission?.id, "s-1");

// Pengumpulan tepat waktu tidak ditandai terlambat.
assert.equal(kelasA[1].terlambat, false);

// Mahasiswa kelas B tidak ikut terbawa.
assert.ok(kelasA.every((row) => row.mahasiswa.kelasPraktikum === "A"));

const hitungan = rekapCounts(kelasA);
assert.deepEqual(hitungan, {
  total: 2,
  sudah: 1,
  belum: 1,
  terlambat: 0,
});

// kelas null berarti semua kelas.
const semua = buildRekap(mahasiswa, submissions, {
  ...filter,
  kelas: null,
});

assert.equal(semua.length, 3);
assert.equal(rekapCounts(semua).belum, 2);

// Pengumpulan setelah tenggat ditandai terlambat.
const telat = buildRekap(mahasiswa, submissions, {
  ...filter,
  tenggat: "2026-08-19T23:59:00+07:00",
});

assert.equal(rekapCounts(telat).terlambat, 1);

// Tugas tanpa tenggat: tidak ada yang terlambat.
const tanpaTenggat = buildRekap(mahasiswa, submissions, {
  ...filter,
  tenggat: null,
});

assert.equal(rekapCounts(tanpaTenggat).terlambat, 0);

// Tidak ada mahasiswa terdaftar: rekap kosong, bukan galat.
assert.deepEqual(buildRekap([], submissions, filter), []);
assert.deepEqual(rekapCounts([]), {
  total: 0,
  sudah: 0,
  belum: 0,
  terlambat: 0,
});

console.log("rekap.check.ts: semua pemeriksaan lolos");
