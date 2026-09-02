/**
 * Saring, urutkan, dan potong halaman untuk tabel pengumpulan asisten.
 *
 * Dipisah dari komponen halaman karena inilah bagian yang paling mudah salah
 * diam-diam: null pada skor, arah urutan, dan pencarian yang harus mengabaikan
 * huruf besar-kecil. Begitu backend ada, isi berkas ini menjadi WHERE +
 * ORDER BY + LIMIT — bentuk fungsinya tidak perlu berubah.
 *
 * Import tipe memakai `import type` (dihapus saat dijalankan) supaya berkas ini
 * bisa diperiksa Node: `node src/lib/daftar-pengumpulan.check.ts`.
 */

import type { StatusSubmission } from "@/lib/submission";

/** Nilai filter yang berarti "jangan saring kolom ini". */
export const SEMUA = "Semua";

/** Kolom yang dibutuhkan penyaring dan pengurut; baris boleh punya kolom lain. */
export type BarisPengumpulan = {
  namaMahasiswa: string;
  nim: string;
  kelasPraktikum: string;
  mataKuliah: string;
  tugasKe: number;
  dikirimPada: string;
  skor: number | null;
  status: StatusSubmission;
};

export type KunciUrut =
  | "namaMahasiswa"
  | "nim"
  | "kelasPraktikum"
  | "mataKuliah"
  | "tugasKe"
  | "dikirimPada"
  | "skor";

export type Urutan = {
  key: KunciUrut;
  dir: "asc" | "desc";
};

export type FilterPengumpulan = {
  kelas: string;
  mataKuliah: string;
  status: StatusSubmission | typeof SEMUA;
  /** Cocok dengan nama (tanpa peduli huruf besar-kecil) atau NIM. */
  query: string;
};

export const FILTER_KOSONG: FilterPengumpulan = {
  kelas: SEMUA,
  mataKuliah: SEMUA,
  status: SEMUA,
  query: "",
};

export function adaFilterAktif(filter: FilterPengumpulan): boolean {
  return (
    filter.kelas !== SEMUA ||
    filter.mataKuliah !== SEMUA ||
    filter.status !== SEMUA ||
    filter.query.trim() !== ""
  );
}

export function saringPengumpulan<T extends BarisPengumpulan>(
  rows: T[],
  filter: FilterPengumpulan
): T[] {
  const kata = filter.query.trim().toLowerCase();

  return rows.filter(
    (row) =>
      (filter.kelas === SEMUA || row.kelasPraktikum === filter.kelas) &&
      (filter.mataKuliah === SEMUA || row.mataKuliah === filter.mataKuliah) &&
      (filter.status === SEMUA || row.status === filter.status) &&
      (kata === "" ||
        row.namaMahasiswa.toLowerCase().includes(kata) ||
        row.nim.includes(kata))
  );
}

/** Skor yang masih null selalu di bawah, ke arah mana pun urutannya. */
function bandingkan(
  a: BarisPengumpulan,
  b: BarisPengumpulan,
  key: KunciUrut
): number {
  const av = a[key];
  const bv = b[key];

  if (av === null && bv === null) return 0;
  if (av === null) return 1;
  if (bv === null) return -1;

  if (typeof av === "number" && typeof bv === "number") {
    return av - bv;
  }

  return String(av).localeCompare(String(bv), "id");
}

export function urutkanPengumpulan<T extends BarisPengumpulan>(
  rows: T[],
  sort: Urutan
): T[] {
  const arah = sort.dir === "asc" ? 1 : -1;

  return [...rows].sort((a, b) => {
    const hasil = bandingkan(a, b, sort.key);

    // Baris tanpa nilai tetap di bawah walau arah urutan dibalik.
    if (a[sort.key] === null || b[sort.key] === null) {
      return hasil;
    }

    return hasil * arah;
  });
}

/** Menekan tombol kolom yang sama membalik arah; kolom lain mulai dari asc. */
export function urutanBerikutnya(sort: Urutan, key: KunciUrut): Urutan {
  return sort.key === key
    ? { key, dir: sort.dir === "asc" ? "desc" : "asc" }
    : { key, dir: "asc" };
}

export type Potongan<T> = {
  /** Halaman yang benar-benar dipakai; ikut mengecil bila filter menyusut. */
  halaman: number;
  totalHalaman: number;
  /** Indeks baris pertama, berbasis 0 — untuk teks "menampilkan x sampai y". */
  mulai: number;
  items: T[];
};

export function potongHalaman<T>(
  rows: T[],
  page: number,
  perPage: number
): Potongan<T> {
  const totalHalaman = Math.max(1, Math.ceil(rows.length / perPage));
  const halaman = Math.min(page, totalHalaman);
  const mulai = (halaman - 1) * perPage;

  return {
    halaman,
    totalHalaman,
    mulai,
    items: rows.slice(mulai, mulai + perPage),
  };
}
