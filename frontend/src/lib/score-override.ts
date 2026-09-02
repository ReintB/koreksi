/**
 * Skor yang ditimpa manual oleh asisten praktikum.
 *
 * Disimpan terpisah dari data pengumpulan, bukan menimpa nilainya, supaya
 * skor otomatis tetap terlihat dan penilaian tetap bisa diaudit — sesuai
 * prinsip produk: otomasi mengurangi pekerjaan manusia, bukan menggantikannya.
 */

import { readJson, writeJson } from "@/lib/storage";

export const SCORE_OVERRIDE_STORAGE_KEY =
  "koreksi-tugas:skor-timpa";

export const SKOR_MIN = 0;
export const SKOR_MAX = 100;

export type ScoreOverride = {
  /** Skor pengganti, bilangan bulat 0–100. */
  skor: number;
  /** Alasan perubahan. Opsional, tapi sangat dianjurkan untuk jejak audit. */
  catatan?: string;
  /** ISO-8601, mis. "2026-08-25T10:00:00.000Z" */
  diubahPada: string;
};

/** Kunci map adalah id pengumpulan. */
export type ScoreOverrideMap = Record<string, ScoreOverride>;

export const EMPTY_OVERRIDES: ScoreOverrideMap = {};

/** null bila valid; string alasan bila tidak. */
export function validateSkor(nilai: string): string | null {
  const teks = nilai.trim();

  if (teks === "") {
    return "Skor wajib diisi";
  }

  if (!/^\d+$/.test(teks)) {
    return "Skor harus berupa angka bulat tanpa desimal";
  }

  const angka = Number(teks);

  if (angka < SKOR_MIN || angka > SKOR_MAX) {
    return `Skor harus antara ${SKOR_MIN} dan ${SKOR_MAX}`;
  }

  return null;
}

function isOverride(value: unknown): value is ScoreOverride {
  if (typeof value !== "object" || value === null) {
    return false;
  }

  const kandidat = value as Partial<ScoreOverride>;

  return (
    typeof kandidat.skor === "number" &&
    Number.isInteger(kandidat.skor) &&
    kandidat.skor >= SKOR_MIN &&
    kandidat.skor <= SKOR_MAX &&
    typeof kandidat.diubahPada === "string"
  );
}

export function loadScoreOverrides(): ScoreOverrideMap {
  return readJson(
    SCORE_OVERRIDE_STORAGE_KEY,
    EMPTY_OVERRIDES,
    (raw) => {
      if (typeof raw !== "object" || raw === null) {
        return EMPTY_OVERRIDES;
      }

      // Buang entri rusak alih-alih memercayai isi localStorage apa adanya.
      const bersih: ScoreOverrideMap = {};

      for (const [id, nilai] of Object.entries(raw)) {
        if (isOverride(nilai)) {
          bersih[id] = nilai;
        }
      }

      return bersih;
    }
  );
}

export function saveScoreOverrides(data: ScoreOverrideMap) {
  writeJson(SCORE_OVERRIDE_STORAGE_KEY, data);
}
