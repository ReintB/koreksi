/**
 * Pemeriksa inisial avatar. Jalankan: `node src/lib/inisial.check.ts`
 *
 * Yang diperiksa: nama biasa diambil dua kata pertamanya, nama satu kata tetap
 * menghasilkan dua huruf, dan nama kosong jatuh ke email alih-alih
 * menghasilkan lingkaran kosong.
 */
import assert from "node:assert/strict";

import { inisial } from "./inisial.ts";

// Dua kata: huruf awal masing-masing.
assert.equal(inisial("Reinhart Barus"), "RB");

// Lebih dari dua kata: hanya dua yang pertama, bukan seluruhnya.
assert.equal(inisial("Nadia Rahmawati Putri"), "NR");

// Satu kata: dua huruf pertamanya, bukan satu huruf yang berdiri sendiri.
assert.equal(inisial("Budi"), "BU");

// Satu huruf tetap satu huruf, bukan galat.
assert.equal(inisial("B"), "B");

// Spasi berlebih tidak menghasilkan kata kosong.
assert.equal(inisial("  Siti   Aminah  "), "SA");

// Huruf kecil dinaikkan.
assert.equal(inisial("budi santoso"), "BS");

// Nama kosong: jatuh ke bagian depan email, yang memakai titik atau garis
// bawah sebagai pengganti spasi.
assert.equal(inisial("", "budi.santoso@gmail.com"), "BS");
assert.equal(inisial("   ", "nadia_rahmawati@gmail.com"), "NR");
assert.equal(inisial("", "reinhart@gmail.com"), "RE");

// Tidak ada nama dan tidak ada email: penanda, bukan string kosong yang
// membuat lingkarannya terlihat rusak.
assert.equal(inisial(""), "?");
assert.equal(inisial("", null), "?");
assert.equal(inisial("", "@gmail.com"), "?");

console.log("inisial.check.ts: semua pemeriksaan lolos");
