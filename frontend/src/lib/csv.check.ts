/**
 * Pemeriksa escaping CSV. Jalankan: `node src/lib/csv.check.ts`
 *
 * Tidak diimpor kode aplikasi, jadi `assert` tidak ikut ke bundel browser.
 * Nilai uji memakai kasus yang benar-benar bisa muncul: nama bertanda koma,
 * dan catatan asisten yang memuat tanda kutip serta baris baru.
 */
import assert from "node:assert/strict";

import { escapeCsvField, parseCsv, toCsv } from "./csv.ts";

// Nilai biasa tidak dikutip.
assert.equal(escapeCsvField("Budi Santoso"), "Budi Santoso");
assert.equal(escapeCsvField(88), "88");

// Kosong dan tidak ada nilai jadi sel kosong, bukan "null"/"undefined".
assert.equal(escapeCsvField(null), "");
assert.equal(escapeCsvField(undefined), "");

// Koma memaksa kutip, kalau tidak kolomnya bergeser.
assert.equal(
  escapeCsvField("Santoso, Budi"),
  '"Santoso, Budi"'
);

// Tanda kutip digandakan.
assert.equal(
  escapeCsvField('Dia bilang "cukup"'),
  '"Dia bilang ""cukup"""'
);

// Baris baru harus tetap di dalam satu sel.
assert.equal(
  escapeCsvField("baris satu\nbaris dua"),
  '"baris satu\nbaris dua"'
);

// Baris utuh: header + satu baris data bermasalah.
const csv = toCsv(
  ["Nama", "Skor", "Catatan"],
  [["Santoso, Budi", 90, 'Bilang "oke"\nlanjut']]
);

const tanpaBom = csv.replace(/^﻿/, "");

assert.equal(
  tanpaBom,
  "Nama,Skor,Catatan\r\n" +
    '"Santoso, Budi",90,"Bilang ""oke""\nlanjut"'
);

// BOM wajib ada agar huruf beraksen tidak rusak di Excel.
assert.ok(csv.startsWith("﻿"));

// Baris baru di dalam sel tidak boleh memecah rekaman.
assert.equal(tanpaBom.split("\r\n").length, 2);

/* ------------------------------------------------------------------
   parseCsv
------------------------------------------------------------------ */

assert.deepEqual(
  parseCsv(`a,b
1,2
`),
  [
    ["a", "b"],
    ["1", "2"],
  ],
  "baris dan kolom terbaca apa adanya"
);

// Nama orang kadang memuat koma, dan spreadsheet akan mengutipnya.
assert.equal(
  parseCsv(`nim,nama
1,"BUDI, S.T."
`)[1][1],
  "BUDI, S.T.",
  "koma di dalam kutip tidak memecah kolom"
);

assert.equal(
  parseCsv(`a
"dia ""bilang"" begitu"
`)[1][0],
  'dia "bilang" begitu',
  "kutip ganda menjadi satu kutip"
);

// Excel menyisipkan BOM; tanpa dibuang, nama kolom pertama tidak pernah cocok.
assert.equal(parseCsv("﻿No,NIM\n1,2\n")[0][0], "No", "BOM dibuang");

assert.equal(parseCsv("a,b\n\n1,2\n\n").length, 2, "baris kosong dibuang");

assert.equal(parseCsv("a,b\r\n1,2\r\n")[1][0], "1", "akhiran CRLF ditangani");

console.log("csv.check.ts: semua pemeriksaan lolos");
