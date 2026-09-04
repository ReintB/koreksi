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

/**
 * Generik atas bentuk pengumpulannya supaya baris rekap tetap membawa kolom
 * tambahan milik pemanggil — halaman rekap perlu `skorOtomatis` dan
 * `catatanTimpa` untuk membuka dialog Ubah Skor langsung dari tabelnya.
 */
export type RekapRow<S extends AdminSubmission = AdminSubmission> = {
  mahasiswa: Mahasiswa;
  /** null berarti belum mengumpulkan — inti dari halaman rekap. */
  submission: S | null;
  terlambat: boolean;
};

export type RekapFilter = {
  mataKuliahId: string;
  tugasId: string;
  /** null berarti semua kelas. */
  kelas: string | null;
  tenggat: string | null;
};

/**
 * Dicocokkan lewat NIM + id mata kuliah + id tugas.
 *
 * Semula pencocokannya memakai nama mata kuliah dan nomor tugas. Keduanya
 * bisa diubah asisten dari halaman Pengaturan Tugas, dan begitu diubah
 * seluruh pengumpulan lama berhenti cocok — lenyap dari rekap tanpa pesan apa
 * pun, seolah kelasnya memang belum mengumpulkan.
 */
export function buildRekap<S extends AdminSubmission>(
  mahasiswa: Mahasiswa[],
  submissions: S[],
  { mataKuliahId, tugasId, kelas, tenggat }: RekapFilter
): RekapRow<S>[] {
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
            kiriman.mataKuliahId === mataKuliahId &&
            kiriman.tugasId === tugasId
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
