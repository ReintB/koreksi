/**
 * Pemeriksa escaping CSV. Jalankan: `node src/lib/csv.check.ts`
 *
 * Tidak diimpor kode aplikasi, jadi `assert` tidak ikut ke bundel browser.
 * Nilai uji memakai kasus yang benar-benar bisa muncul: nama bertanda koma,
 * dan catatan asisten yang memuat tanda kutip serta baris baru.
 */
import assert from "node:assert/strict";

import { escapeCsvField, toCsv } from "./csv.ts";

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

console.log("csv.check.ts: semua pemeriksaan lolos");
