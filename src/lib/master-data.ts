import { readJson, writeJson } from "@/lib/storage";

export type MataKuliah = {
  id: string;
  nama: string;
};

export type Tugas = {
  id: string;
  mataKuliahId: string;
  nomor: number;
  judul: string;
  /** ISO-8601 beroffset WIB; null berarti tugas tanpa batas waktu. */
  tenggat: string | null;
  rubrikFileName: string | null;
  rubrikText: string | null;
};

export type KelasPraktikum = {
  id: string;
  nama: string;
};

export type Angkatan = {
  id: string;
  tahun: string;
};

export type MasterData = {
  mataKuliah: MataKuliah[];
  tugas: Tugas[];
  kelasPraktikum: KelasPraktikum[];
  angkatan: Angkatan[];
};

export const MASTER_DATA_STORAGE_KEY = "koreksi-master-data";

export const initialMasterData: MasterData = {
  mataKuliah: [
    {
      id: "mk-alpro",
      nama: "Praktikum Alpro",
    },
    {
      id: "mk-basis-data",
      nama: "Praktikum Basis Data",
    },
    {
      id: "mk-jaringan",
      nama: "Praktikum Jaringan Komputer",
    },
  ],

  tugas: [
    {
      id: "tugas-alpro-1",
      mataKuliahId: "mk-alpro",
      nomor: 1,
      judul: "Variabel dan Tipe Data",
      tenggat: "2026-08-21T23:59:00+07:00",
      rubrikFileName: "rubrik-alpro-tugas-1.txt",
      rubrikText: `Mahasiswa menjelaskan konsep variabel dan tipe data dasar dalam bahasa C++.

Materi utama:
1. Pengertian variabel.
2. Tipe data int.
3. Tipe data float.
4. Tipe data char.
5. Deklarasi variabel.
6. Inisialisasi variabel.
7. Contoh implementasi program.`,
    },
    {
      id: "tugas-alpro-2",
      mataKuliahId: "mk-alpro",
      nomor: 2,
      judul: "Percabangan",
      tenggat: "2026-08-30T23:59:00+07:00",
      rubrikFileName: null,
      rubrikText: null,
    },
    {
      id: "tugas-basis-data-1",
      mataKuliahId: "mk-basis-data",
      nomor: 1,
      judul: "Pengenalan Database dan SQL",
      tenggat: null,
      rubrikFileName: "rubrik-basis-data-tugas-1.txt",
      rubrikText:
        "Mahasiswa mampu menjelaskan konsep database, DBMS, tabel, kolom, record, primary key, dan SQL dasar.",
    },
  ],

  kelasPraktikum: [
    { id: "kelas-a", nama: "A" },
    { id: "kelas-b", nama: "B" },
    { id: "kelas-c", nama: "C" },
    { id: "kelas-d", nama: "D" },
    { id: "kelas-e", nama: "E" },
  ],

  angkatan: [
    { id: "angkatan-2024", tahun: "2024" },
    { id: "angkatan-2025", tahun: "2025" },
    { id: "angkatan-2026", tahun: "2026" },
  ],
};

export function loadMasterData(): MasterData {
  return readJson(
    MASTER_DATA_STORAGE_KEY,
    initialMasterData,
    (raw) => {
      const parsed = raw as Partial<MasterData>;

      return {
        mataKuliah: Array.isArray(parsed.mataKuliah)
          ? parsed.mataKuliah
          : initialMasterData.mataKuliah,

        // Tugas yang tersimpan sebelum fitur tenggat ada tidak punya
        // fieldnya; disamakan di sini supaya sisa aplikasi tidak perlu
        // membedakan "tanpa tenggat" dari "field belum ada".
        tugas: Array.isArray(parsed.tugas)
          ? parsed.tugas.map((tugas) => ({
              ...tugas,
              tenggat: tugas.tenggat ?? null,
            }))
          : initialMasterData.tugas,

        kelasPraktikum: Array.isArray(parsed.kelasPraktikum)
          ? parsed.kelasPraktikum
          : initialMasterData.kelasPraktikum,

        angkatan: Array.isArray(parsed.angkatan)
          ? parsed.angkatan
          : initialMasterData.angkatan,
      };
    }
  );
}

export function saveMasterData(data: MasterData) {
  writeJson(MASTER_DATA_STORAGE_KEY, data);
}

export function createMasterDataId(prefix: string) {
  return `${prefix}-${Date.now()}-${Math.random()
    .toString(36)
    .slice(2, 8)}`;
}
