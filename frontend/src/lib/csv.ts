/**
 * Pembuatan CSV. Sengaja tanpa import apa pun supaya bisa dijalankan langsung
 * oleh Node untuk pemeriksaan: `node src/lib/csv.check.ts`.
 */

/**
 * Pemisah kolom. Koma dipilih karena Google Sheets membacanya langsung, dan
 * produk ini sudah berbasis akun Google. Ganti ke ";" bila berkasnya lebih
 * sering dibuka dengan Excel berlokal Indonesia.
 */
export const CSV_DELIMITER = ",";

/** Excel dan Sheets butuh BOM agar huruf beraksen tidak rusak. */
const BOM = "﻿";

export type CsvValue = string | number | null | undefined;

/**
 * Membungkus nilai sesuai RFC 4180: kutip hanya bila perlu, dan gandakan
 * tanda kutip di dalamnya. Catatan asisten bisa memuat koma maupun baris
 * baru, jadi bagian ini yang menentukan berkasnya rusak atau tidak.
 */
export function escapeCsvField(value: CsvValue): string {
  if (value === null || value === undefined) {
    return "";
  }

  const text = String(value);

  const perluKutip =
    text.includes(CSV_DELIMITER) ||
    text.includes('"') ||
    text.includes("\n") ||
    text.includes("\r");

  if (!perluKutip) {
    return text;
  }

  return '"' + text.replaceAll('"', '""') + '"';
}

export function toCsv(
  headers: string[],
  rows: CsvValue[][]
): string {
  const lines = [headers, ...rows].map((row) =>
    row.map(escapeCsvField).join(CSV_DELIMITER)
  );

  // CRLF adalah akhir baris yang diminta RFC 4180 dan paling aman di Excel.
  return BOM + lines.join("\r\n");
}

/** Memicu unduhan di browser. Tidak dipanggil saat modul diimpor. */
export function downloadCsv(
  filename: string,
  csv: string
) {
  const blob = new Blob([csv], {
    type: "text/csv;charset=utf-8;",
  });

  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");

  anchor.href = url;
  anchor.download = filename;
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();

  URL.revokeObjectURL(url);
}

/** Nama berkas dengan tanggal lokal, mis. nilai-praktikum-2026-08-25.csv */
/**
 * Membaca teks CSV menjadi larik baris berisi larik kolom.
 *
 * Menangani kolom berkutip dua beserta koma dan kutip ganda di dalamnya,
 * karena nama orang kadang memuat koma dan berkas dari spreadsheet akan
 * mengutipnya. Tanda BOM yang biasa disisipkan Excel ikut dibuang; tanpa itu
 * nama kolom pertama tidak akan pernah cocok saat dicari.
 */
export function parseCsv(teks: string): string[][] {
  const bersih = teks.replace(/^﻿/, "");
  const hasil: string[][] = [];

  let kolom: string[] = [];
  let nilai = "";
  let dalamKutip = false;

  for (let i = 0; i < bersih.length; i += 1) {
    const huruf = bersih[i];

    if (dalamKutip) {
      if (huruf !== '"') {
        nilai += huruf;
      } else if (bersih[i + 1] === '"') {
        nilai += '"';
        i += 1;
      } else {
        dalamKutip = false;
      }
      continue;
    }

    if (huruf === '"') {
      dalamKutip = true;
    } else if (huruf === CSV_DELIMITER) {
      kolom.push(nilai);
      nilai = "";
    } else if (huruf === "\n") {
      kolom.push(nilai);
      hasil.push(kolom);
      kolom = [];
      nilai = "";
    } else if (huruf !== "\r") {
      nilai += huruf;
    }
  }

  if (nilai !== "" || kolom.length > 0) {
    kolom.push(nilai);
    hasil.push(kolom);
  }

  // Baris kosong di ujung berkas lazim dan bukan data.
  return hasil.filter((baris) => baris.some((sel) => sel.trim() !== ""));
}

export function csvFilename(prefix: string, now = new Date()) {
  const pad = (n: number) => String(n).padStart(2, "0");

  const tanggal =
    now.getFullYear() +
    "-" +
    pad(now.getMonth() + 1) +
    "-" +
    pad(now.getDate());

  return `${prefix}-${tanggal}.csv`;
}
