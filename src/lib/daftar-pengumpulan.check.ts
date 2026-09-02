/**
 * Pemeriksa tabel pengumpulan. Jalankan:
 * `node src/lib/daftar-pengumpulan.check.ts`
 *
 * Yang diperiksa: filter saling menumpuk, pencarian mengabaikan huruf
 * besar-kecil, skor kosong tidak pernah naik ke atas saat urutan dibalik, dan
 * halaman ikut mengecil ketika hasil filter menyusut.
 */
import assert from "node:assert/strict";

import {
  FILTER_KOSONG,
  adaFilterAktif,
  potongHalaman,
  saringPengumpulan,
  urutanBerikutnya,
  urutkanPengumpulan,
} from "./daftar-pengumpulan.ts";

const baris = (
  nama: string,
  nim: string,
  kelas: string,
  mataKuliah: string,
  tugasKe: number,
  skor: number | null,
  status: "menunggu" | "diproses" | "selesai" | "gagal",
  dikirimPada = "2026-08-20T13:42:00+07:00"
) => ({
  namaMahasiswa: nama,
  nim,
  kelasPraktikum: kelas,
  mataKuliah,
  tugasKe,
  skor,
  status,
  dikirimPada,
});

const rows = [
  baris("Budi", "0001", "A", "Praktikum Alpro", 1, 88, "selesai"),
  baris("Ani", "0002", "B", "Praktikum Alpro", 2, null, "diproses"),
  baris("Citra", "0003", "A", "Praktikum Basis Data", 1, 76, "selesai"),
  baris("Dewi", "0004", "C", "Praktikum Alpro", 3, null, "gagal"),
];

/* --- Filter ------------------------------------------------------------- */

// Tanpa filter, semuanya lolos.
assert.equal(saringPengumpulan(rows, FILTER_KOSONG).length, 4);
assert.equal(adaFilterAktif(FILTER_KOSONG), false);

// Filter kelas.
assert.deepEqual(
  saringPengumpulan(rows, { ...FILTER_KOSONG, kelas: "A" }).map((r) => r.nim),
  ["0001", "0003"]
);

// Filter saling menumpuk, bukan saling menimpa.
assert.deepEqual(
  saringPengumpulan(rows, {
    ...FILTER_KOSONG,
    kelas: "A",
    mataKuliah: "Praktikum Alpro",
  }).map((r) => r.nim),
  ["0001"]
);

// Status.
assert.deepEqual(
  saringPengumpulan(rows, { ...FILTER_KOSONG, status: "gagal" }).map(
    (r) => r.nim
  ),
  ["0004"]
);

// Pencarian nama mengabaikan huruf besar-kecil, dan spasi di tepi diabaikan.
assert.deepEqual(
  saringPengumpulan(rows, { ...FILTER_KOSONG, query: "  bUdI " }).map(
    (r) => r.nim
  ),
  ["0001"]
);

// Pencarian juga mengenai NIM.
assert.deepEqual(
  saringPengumpulan(rows, { ...FILTER_KOSONG, query: "0003" }).map(
    (r) => r.nim
  ),
  ["0003"]
);

// Tidak cocok berarti kosong, bukan semua.
assert.deepEqual(
  saringPengumpulan(rows, { ...FILTER_KOSONG, query: "zzz" }),
  []
);

assert.equal(adaFilterAktif({ ...FILTER_KOSONG, query: "   " }), false);
assert.equal(adaFilterAktif({ ...FILTER_KOSONG, status: "gagal" }), true);

/* --- Urutan ------------------------------------------------------------- */

const skorAsc = urutkanPengumpulan(rows, { key: "skor", dir: "asc" });
const skorDesc = urutkanPengumpulan(rows, { key: "skor", dir: "desc" });

// Skor terkecil dulu; yang belum dinilai di bawah.
assert.deepEqual(
  skorAsc.map((r) => r.skor),
  [76, 88, null, null]
);

// Arah dibalik, tetapi null TETAP di bawah — bukan naik ke atas.
assert.deepEqual(
  skorDesc.map((r) => r.skor),
  [88, 76, null, null]
);

// Teks diurutkan menurut locale Indonesia.
assert.deepEqual(
  urutkanPengumpulan(rows, { key: "namaMahasiswa", dir: "asc" }).map(
    (r) => r.namaMahasiswa
  ),
  ["Ani", "Budi", "Citra", "Dewi"]
);

// Angka diurutkan sebagai angka, bukan sebagai teks.
assert.deepEqual(
  urutkanPengumpulan(rows, { key: "tugasKe", dir: "desc" }).map(
    (r) => r.tugasKe
  ),
  [3, 2, 1, 1]
);

// Sumbernya tidak ikut berubah.
assert.equal(rows[0].namaMahasiswa, "Budi");

// Kolom sama membalik arah; kolom lain mulai dari asc.
assert.deepEqual(urutanBerikutnya({ key: "skor", dir: "asc" }, "skor"), {
  key: "skor",
  dir: "desc",
});

assert.deepEqual(urutanBerikutnya({ key: "skor", dir: "desc" }, "nim"), {
  key: "nim",
  dir: "asc",
});

/* --- Halaman ------------------------------------------------------------ */

const halaman1 = potongHalaman(rows, 1, 3);
assert.equal(halaman1.totalHalaman, 2);
assert.equal(halaman1.mulai, 0);
assert.equal(halaman1.items.length, 3);

const halaman2 = potongHalaman(rows, 2, 3);
assert.equal(halaman2.mulai, 3);
assert.equal(halaman2.items.length, 1);

// Halaman di luar jangkauan dijepit, bukan menghasilkan tabel kosong.
assert.equal(potongHalaman(rows, 9, 3).halaman, 2);
assert.equal(potongHalaman(rows, 9, 3).items.length, 1);

// Tanpa hasil tetap ada satu halaman, supaya penomoran tidak jadi 0.
const kosong = potongHalaman([], 1, 3);
assert.equal(kosong.totalHalaman, 1);
assert.deepEqual(kosong.items, []);

console.log("daftar-pengumpulan.check.ts: semua pemeriksaan lolos");
