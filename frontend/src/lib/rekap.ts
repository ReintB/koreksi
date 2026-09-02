/**
 * Rekap satu tugas untuk satu kelas: siapa sudah mengumpulkan, siapa belum.
 *
 * Tabel admin hanya bisa menampilkan pengumpulan yang ada. Yang paling sering
 * ditanya asisten justru kebalikannya, dan itu hanya bisa dijawab kalau
 * daftar mahasiswanya ikut dibawa — bukan hasil turunan dari pengumpulan.
 *
 * Import nilainya sengaja relatif berekstensi .ts (dan tipe di-import sebagai
 * `import type`, yang dihapus saat dijalankan) supaya berkas ini bisa
 * diperiksa Node: `node src/lib/rekap.check.ts`.
 */
import { isTerlambat } from "./tenggat.ts";

import type { AdminSubmission } from "@/lib/submission";

export type Mahasiswa = {
  id: string;
  nama: string;
  nim: string;
  kelasPraktikum: string;
  angkatan: string;
};

export type RekapRow = {
  mahasiswa: Mahasiswa;
  /** null berarti belum mengumpulkan — inti dari halaman rekap. */
  submission: AdminSubmission | null;
  terlambat: boolean;
};

export type RekapFilter = {
  mataKuliah: string;
  tugasKe: number;
  /** null berarti semua kelas. */
  kelas: string | null;
  tenggat: string | null;
};

/**
 * Dicocokkan lewat NIM + nama mata kuliah + nomor tugas karena itulah yang
 * dimiliki pengumpulan saat ini. Setelah backend ada, ganti dengan join
 * `tugasId` dan `mahasiswaId` — bentuk fungsinya tidak perlu berubah.
 */
export function buildRekap(
  mahasiswa: Mahasiswa[],
  submissions: AdminSubmission[],
  { mataKuliah, tugasKe, kelas, tenggat }: RekapFilter
): RekapRow[] {
  const peserta =
    kelas === null
      ? mahasiswa
      : mahasiswa.filter((item) => item.kelasPraktikum === kelas);

  return peserta
    .map((item) => {
      const submission =
        submissions.find(
          (kiriman) =>
            kiriman.nim === item.nim &&
            kiriman.mataKuliah === mataKuliah &&
            kiriman.tugasKe === tugasKe
        ) ?? null;

      return {
        mahasiswa: item,
        submission,
        terlambat: submission
          ? isTerlambat(submission.dikirimPada, tenggat)
          : false,
      };
    })
    .sort((a, b) => {
      // Yang belum mengumpulkan naik ke atas: itu yang dicari saat halaman
      // ini dibuka, bukan daftar menurut abjad.
      const belumA = a.submission === null ? 0 : 1;
      const belumB = b.submission === null ? 0 : 1;

      if (belumA !== belumB) return belumA - belumB;

      return a.mahasiswa.nama.localeCompare(b.mahasiswa.nama, "id");
    });
}

export function rekapCounts(rows: RekapRow[]) {
  const sudah = rows.filter((row) => row.submission !== null).length;

  return {
    total: rows.length,
    sudah,
    belum: rows.length - sudah,
    terlambat: rows.filter((row) => row.terlambat).length,
  };
}
